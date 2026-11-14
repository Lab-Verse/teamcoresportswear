import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import Stripe from 'stripe';
import { minorAmount } from '../storefront/commerce-rules';
import { MailService } from '../../common/modules/mail/mail.service';

@Injectable()
export class PaymentSettlementService {
  private readonly logger = new Logger(PaymentSettlementService.name);
  constructor(
    private readonly db: DataSource,
    private readonly mail: MailService,
  ) {}

  async handle(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    // Subscription checkout belongs to the existing subscription handler.
    if (!orderId) return { received: true };
    const result = await this.db.transaction(async (manager) => {
      const orders = await manager.query(
        'SELECT * FROM orders WHERE id=$1 FOR UPDATE',
        [orderId],
      );
      const order = orders[0];
      if (!order || session.metadata?.userId !== order.user_id) {
        throw new BadRequestException('Payment order identity does not match');
      }
      const claimed = await manager.query(
        `INSERT INTO payment_webhook_events(id,provider,event_type) VALUES($1,'stripe',$2)
         ON CONFLICT(id) DO NOTHING RETURNING id`,
        [event.id, event.type],
      );
      if (!claimed.length) return { received: true, duplicate: true };
      if (event.type === 'checkout.session.expired') {
        const active = await manager.query(
          'SELECT session_id FROM storefront_payment_sessions WHERE order_id=$1',
          [orderId],
        );
        // An older, superseded session must not cancel a newer payment attempt.
        if (
          active[0]?.session_id !== session.id ||
          order.status !== 'pending_payment'
        )
          return { received: true };
        const payments = await manager.query(
          "SELECT id FROM payments WHERE order_id=$1 AND status='paid'",
          [orderId],
        );
        if (payments.length) return { received: true };
        const movements = await manager.query(
          `SELECT warehouse_id,variant_id,-SUM(quantity)::int AS quantity FROM inventory_movements
           WHERE order_id=$1 AND movement_type='sale' GROUP BY warehouse_id,variant_id ORDER BY variant_id,warehouse_id`,
          [orderId],
        );
        for (const row of movements) {
          await manager.query(
            'UPDATE inventory SET qty_on_hand=qty_on_hand+$1 WHERE warehouse_id=$2 AND variant_id=$3',
            [row.quantity, row.warehouse_id, row.variant_id],
          );
          await manager.query(
            "INSERT INTO inventory_movements(order_id,warehouse_id,variant_id,movement_type,quantity,note) VALUES($1,$2,$3,'cancellation',$4,'Payment session expired')",
            [orderId, row.warehouse_id, row.variant_id, row.quantity],
          );
        }
        await manager.query(
          "UPDATE orders SET status='cancelled' WHERE id=$1",
          [orderId],
        );
        return { received: true, notify: 'expired' };
      }
      if (session.payment_status !== 'paid')
        return { received: true, pending: true };
      if (
        session.currency?.toUpperCase() !== order.currency.toUpperCase() ||
        session.amount_total !==
          minorAmount(Number(order.total_amount), order.currency.toUpperCase())
      ) {
        // Throwing rolls back the event receipt as well as all payment changes.
        throw new BadRequestException(
          'Payment amount or currency does not match the order',
        );
      }
      const transactionId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || session.id;
      const existing = await manager.query(
        "SELECT id FROM payments WHERE gateway='stripe' AND gateway_tx_id=$1",
        [transactionId],
      );
      if (existing.length) return { received: true, duplicate: true };
      const priorPayments = await manager.query(
        "SELECT id FROM payments WHERE order_id=$1 AND status='paid'",
        [orderId],
      );
      const latePayment =
        order.status === 'cancelled' || priorPayments.length > 0;
      await manager.query(
        `INSERT INTO payments(order_id,user_id,gateway,gateway_tx_id,amount,currency,status,method,metadata)
         VALUES($1,$2,'stripe',$3,$4,$5,'paid','card',$6)`,
        [
          orderId,
          order.user_id,
          transactionId,
          order.total_amount,
          order.currency,
          JSON.stringify({
            sessionId: session.id,
            requiresReview: latePayment,
          }),
        ],
      );
      if (['pending', 'pending_payment'].includes(order.status)) {
        await manager.query(
          "UPDATE orders SET status='confirmed' WHERE id=$1",
          [orderId],
        );
      } else if (latePayment) {
        this.logger.error(
          `Payment received for cancelled order ${orderId}; refund review required`,
        );
      }
      return {
        received: true,
        requiresReview: latePayment,
        notify: latePayment ? 'review' : 'paid',
      };
    });
    if ('notify' in result) {
      const [order] = await this.db.query(
        'SELECT o.order_number, o.total_amount, o.currency, u.email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=$1',
        [orderId],
      );
      if (order) {
        if (result.notify === 'paid') {
          await this.mail.sendActivity(
            order.email,
            'Payment received',
            `Payment received for order ${order.order_number}: ${order.currency} ${order.total_amount}.`,
            `/account/orders/${orderId}`,
          );
          await this.mail.sendBusinessAlert(
            'Order paid',
            `Order ${order.order_number} is paid and ready for processing.`,
          );
        } else if (result.notify === 'expired') {
          await this.mail.sendActivity(
            order.email,
            'Payment session expired',
            `The payment session for order ${order.order_number} expired and the unpaid order was cancelled.`,
            `/account/orders/${orderId}`,
          );
        } else {
          await this.mail.sendBusinessAlert(
            'Payment requires review',
            `Review payment for order ${order.order_number} before fulfilment or refund.`,
          );
        }
      }
    }
    return result;
  }
}
