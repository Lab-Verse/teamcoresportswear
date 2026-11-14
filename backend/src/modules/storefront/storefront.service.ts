import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { randomUUID, createHash } from 'crypto';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Category } from '../categories/entities/category.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Store } from '../sellers/entities/store.entity';
import { StripeService } from '../stripe/stripe.service';
import {
  BasketLineDto,
  ContactDto,
  PreviewDto,
  StorefrontCheckoutDto,
} from './storefront.dto';
import { assertQuantity, roundMoney } from './commerce-rules';
import { MailService } from '../../common/modules/mail/mail.service';

@Injectable()
export class StorefrontService {
  constructor(
    private readonly db: DataSource,
    private readonly config: ConfigService,
    private readonly stripe: StripeService,
    private readonly mail: MailService,
  ) {}
  private async storeId(manager: EntityManager = this.db.manager) {
    const store = await manager.findOne(Store, {
      where: { singletonKey: true, isActive: true },
    });
    if (!store)
      throw new ServiceUnavailableException(
        'The catalogue is temporarily unavailable',
      );
    return store.id;
  }
  async products(query: Record<string, string>) {
    const storeId = await this.storeId();
    const page = Math.max(
      1,
      Math.min(100000, Math.floor(Number(query.page)) || 1),
    );
    const limit = Math.max(
      1,
      Math.min(48, Math.floor(Number(query.limit)) || 12),
    );
    const qb = this.db
      .getRepository(Product)
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'images')
      .leftJoinAndSelect('p.category', 'category')
      .where('p.storeId = :storeId', { storeId })
      .andWhere('p.isActive = true')
      .andWhere("p.status = 'active'");
    if (query.categorySlug)
      qb.andWhere(
        '(category.slug = :slug OR EXISTS (SELECT 1 FROM product_categories pc JOIN categories linked_category ON linked_category.id=pc.category_id WHERE pc.product_id=p.id AND linked_category.slug=:slug AND linked_category.is_active=true))',
        { slug: query.categorySlug },
      );
    if (query.search)
      qb.andWhere(
        '(p.name ILIKE :search OR EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.sku ILIKE :search))',
        { search: '%' + query.search.slice(0, 150) + '%' },
      );
    if (query.mode === 'direct')
      qb.andWhere("p.purchaseMode IN ('direct','both')");
    if (query.mode === 'quote')
      qb.andWhere("p.purchaseMode IN ('quote_only','both')");
    const sorts: Record<string, [string, 'ASC' | 'DESC']> = {
      newest: ['p.createdAt', 'DESC'],
      name_asc: ['p.name', 'ASC'],
      price_asc: ['p.basePrice', 'ASC'],
      price_desc: ['p.basePrice', 'DESC'],
    };
    const sort = sorts[query.sort] || sorts.newest;
    const [data, total] = await qb
      .orderBy(sort[0], sort[1])
      .addOrderBy('p.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async product(slug: string) {
    const p = await this.db.getRepository(Product).findOne({
      where: {
        slug,
        storeId: await this.storeId(),
        isActive: true,
        status: 'active',
      },
      relations: [
        'images',
        'category',
        'brand',
        'variants',
        'variants.attributeValues',
        'variants.attributeValues.attributeKey',
        'variants.attributeValues.attributeValue',
      ],
    });
    if (!p) throw new NotFoundException('Product not found');
    p.variants = p.variants.filter((v) => v.isActive);
    p.images.sort((a, b) => a.sortOrder - b.sortOrder);
    return p;
  }
  async reviews(slug: string) {
    const product = await this.product(slug);
    return this.db.query(
      'SELECT r.id,r.rating,r.title,r.body,r.is_verified AS "isVerified",r.seller_reply AS "sellerReply",r.created_at AS "createdAt",u.first_name AS "firstName" FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.product_id=$1 AND r.status=\'approved\' ORDER BY r.created_at DESC LIMIT 20',
      [product.id],
    );
  }
  async categories() {
    const id = await this.storeId();
    return this.db
      .getRepository(Category)
      .createQueryBuilder('c')
      .where('c.isActive = true')
      .andWhere(
        "EXISTS (SELECT 1 FROM products p WHERE (p.category_id=c.id OR EXISTS (SELECT 1 FROM product_categories pc WHERE pc.product_id=p.id AND pc.category_id=c.id)) AND p.store_id=:id AND p.is_active=true AND p.status='active')",
        { id },
      )
      .orderBy('c.sortOrder', 'ASC')
      .getMany();
  }
  async resolve(
    items: BasketLineDto[],
    direct = false,
    manager: EntityManager = this.db.manager,
  ) {
    if (
      !items?.length ||
      items.length > 100 ||
      new Set(items.map((i) => i.variantId)).size !== items.length
    )
      throw new BadRequestException('Choose between 1 and 100 unique variants');
    const storeId = await this.storeId(manager);
    const rows = await manager
      .getRepository(ProductVariant)
      .createQueryBuilder('v')
      .innerJoinAndSelect('v.product', 'p')
      .leftJoinAndSelect('p.images', 'images')
      .where('v.id IN (:...ids)', { ids: items.map((i) => i.variantId) })
      .andWhere('v.isActive = true')
      .andWhere('p.isActive = true')
      .andWhere("p.status = 'active'")
      .andWhere('p.storeId = :storeId', { storeId })
      .getMany();
    return items.map((item) => {
      const v = rows.find((r) => r.id === item.variantId);
      if (!v)
        throw new BadRequestException(
          'A product in your basket is no longer available. Remove it and try again.',
        );
      assertQuantity(
        item.quantity,
        v.product.minimumOrderQuantity,
        v.product.quantityIncrement,
      );
      if (direct && v.product.purchaseMode === 'quote_only')
        throw new BadRequestException('This product requires a quotation');
      const price = Number(v.price ?? v.product.basePrice);
      if (!Number.isFinite(price) || price < 0)
        throw new BadRequestException('Product pricing is unavailable');
      return {
        variantId: v.id,
        quantity: item.quantity,
        name: v.product.name || v.sku,
        sku: v.sku,
        unitPrice: price,
        image: v.product.images?.[0]?.url,
        productSlug: v.product.slug,
        currency: v.product.currency.toUpperCase(),
        weightGrams: v.weightGrams,
        requiresShipping: v.product.requiresShipping !== false,
        purchaseMode: v.product.purchaseMode,
        minimumOrderQuantity: v.product.minimumOrderQuantity,
        quantityIncrement: v.product.quantityIncrement,
        storeId,
      };
    });
  }
  async preview(dto: PreviewDto, manager: EntityManager = this.db.manager) {
    if (!dto.address)
      throw new BadRequestException('Delivery address is required');
    const items = await this.resolve(dto.items, true, manager);
    const currency = items[0].currency;
    if (items.some((i) => i.currency !== currency))
      throw new BadRequestException(
        'Products with different currencies must be ordered separately',
      );
    if (currency !== this.config.get<string>('STOREFRONT_CURRENCY'))
      throw new ServiceUnavailableException(
        'Online checkout is not yet available in this currency. Please request a quotation.',
      );
    const taxSetting = this.config.get<string>('STOREFRONT_TAX_BPS');
    const bps = Number(taxSetting);
    if (
      taxSetting === undefined ||
      !Number.isInteger(bps) ||
      bps < 0 ||
      bps > 10000
    )
      throw new ServiceUnavailableException(
        'Checkout tax rules are not yet configured. Please request a quotation.',
      );
    const subtotal = roundMoney(
      items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    );
    let shippingAmount = 0;
    let shippingMethodId: string | undefined;
    if (items.some((i) => i.requiresShipping)) {
      const methods = await manager.query(
        `SELECT m.* FROM shipping_methods m JOIN shipping_zones z ON z.id=m.zone_id JOIN shipping_zone_countries c ON c.zone_id=z.id WHERE m.is_active=true AND z.is_active=true AND c.country=$1`,
        [dto.address.shippingCountry.toUpperCase()],
      );
      const rates = methods
        .flatMap((m: any) => {
          if (
            Number(m.per_kg_rate) > 0 &&
            items.some((i) => i.requiresShipping && i.weightGrams == null)
          )
            return [];
          const weight = items.reduce(
            (s, i) =>
              s +
              (i.requiresShipping
                ? (Number(i.weightGrams || 0) * i.quantity) / 1000
                : 0),
            0,
          );
          const fee =
            m.free_threshold != null && subtotal >= Number(m.free_threshold)
              ? 0
              : Number(m.base_rate) + Number(m.per_kg_rate) * weight;
          return Number.isFinite(fee) && fee >= 0
            ? [{ id: m.id, fee: roundMoney(fee) }]
            : [];
        })
        .sort((a: any, b: any) => a.fee - b.fee);
      if (!rates.length)
        throw new BadRequestException(
          'Delivery is not currently available for this basket and destination. Request a quotation instead.',
        );
      shippingAmount = rates[0].fee;
      shippingMethodId = rates[0].id;
    }
    const taxAmount = roundMoney(((subtotal + shippingAmount) * bps) / 10000);
    return {
      items,
      currency,
      subtotal,
      shippingAmount,
      shippingMethodId,
      taxAmount,
      totalAmount: roundMoney(subtotal + shippingAmount + taxAmount),
    };
  }
  private assertEnabled() {
    if (
      this.config.get('STOREFRONT_CHECKOUT_ENABLED') !== 'true' ||
      !this.stripe.isConfigured()
    )
      throw new ServiceUnavailableException(
        'Online payments are temporarily unavailable. You can still request a quotation.',
      );
  }
  async checkout(
    user: { id: string; email: string },
    dto: StorefrontCheckoutDto,
  ) {
    this.assertEnabled();
    const fingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          items: [...dto.items].sort((a, b) =>
            a.variantId.localeCompare(b.variantId),
          ),
          address: Object.fromEntries(
            Object.entries(dto.address).sort(([a], [b]) => a.localeCompare(b)),
          ),
        }),
      )
      .digest('hex');
    let created = false;
    const order = await this.db.transaction(async (manager) => {
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
        [user.id + ':' + dto.idempotencyKey],
      );
      const existing = await manager.findOne(Order, {
        where: { userId: user.id, idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        if (existing.checkoutFingerprint !== fingerprint)
          throw new ConflictException(
            'Checkout details changed. Start a new checkout.',
          );
        return existing;
      }
      const preview = await this.preview(dto, manager);
      // Lock variants in stable order to avoid cross-basket deadlocks.
      const id = randomUUID();
      for (const item of [...preview.items].sort((a, b) =>
        a.variantId.localeCompare(b.variantId),
      )) {
        const stock = await manager.query(
          'SELECT i.warehouse_id,i.qty_on_hand,i.qty_reserved FROM inventory i JOIN warehouses w ON w.id=i.warehouse_id WHERE i.variant_id=$1 AND w.is_active=true ORDER BY i.warehouse_id FOR UPDATE OF i',
          [item.variantId],
        );
        if (
          stock.reduce(
            (s: number, r: any) =>
              s + Math.max(0, Number(r.qty_on_hand) - Number(r.qty_reserved)),
            0,
          ) < item.quantity
        )
          throw new ConflictException(
            'Available stock changed. Adjust the quantity or request a quote.',
          );
      }
      const saved = await manager.save(
        Order,
        manager.create(Order, {
          id,
          userId: user.id,
          idempotencyKey: dto.idempotencyKey,
          checkoutFingerprint: fingerprint,
          orderNumber: 'AS-' + id.slice(0, 8).toUpperCase(),
          source: 'retail',
          status: 'pending_payment',
          currency: preview.currency,
          subtotal: preview.subtotal,
          shippingAmount: preview.shippingAmount,
          taxAmount: preview.taxAmount,
          discountAmount: 0,
          totalAmount: preview.totalAmount,
          ...dto.address,
        }),
      );
      for (const item of preview.items) {
        const stock = await manager.query(
          'SELECT i.warehouse_id,i.qty_on_hand,i.qty_reserved FROM inventory i JOIN warehouses w ON w.id=i.warehouse_id WHERE i.variant_id=$1 AND w.is_active=true ORDER BY i.warehouse_id FOR UPDATE OF i',
          [item.variantId],
        );
        let remaining = item.quantity;
        for (const row of stock) {
          const amount = Math.min(
            remaining,
            Math.max(0, Number(row.qty_on_hand) - Number(row.qty_reserved)),
          );
          if (!amount) continue;
          await manager.query(
            'UPDATE inventory SET qty_on_hand=qty_on_hand-$1 WHERE warehouse_id=$2 AND variant_id=$3',
            [amount, row.warehouse_id, item.variantId],
          );
          await manager.query(
            "INSERT INTO inventory_movements(order_id,warehouse_id,variant_id,movement_type,quantity,note) VALUES($1,$2,$3,'sale',$4,'TEAM CORE checkout')",
            [saved.id, row.warehouse_id, item.variantId, -amount],
          );
          remaining -= amount;
        }
        await manager.save(
          OrderItem,
          manager.create(OrderItem, {
            orderId: saved.id,
            variantId: item.variantId,
            storeId: item.storeId,
            skuSnapshot: item.sku,
            nameSnapshot: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            discountAmount: 0,
            taxAmount: 0,
            totalAmount: roundMoney(item.quantity * item.unitPrice),
          }),
        );
      }
      created = true;
      return saved;
    });
    if (created) {
      await this.mail.sendActivity(
        user.email,
        'Order received — payment pending',
        `Order ${order.orderNumber} has been created. Complete payment to confirm your order.`,
        `/account/orders/${order.id}`,
      );
      await this.mail.sendBusinessAlert(
        'New order awaiting payment',
        `Order ${order.orderNumber} was created. Do not fulfil it until payment is confirmed.`,
      );
    }
    const payment = await this.pay(user, order.id);
    return { order, ...payment };
  }
  async payment(userId: string, id: string) {
    const order = await this.db.manager.findOne(Order, {
      where: { id, userId },
    });
    if (!order) throw new NotFoundException('Order not found');
    const rows = await this.db.query(
      "SELECT id FROM payments WHERE order_id=$1 AND status='paid'",
      [id],
    );
    return { order, paid: rows.length > 0 };
  }
  async pay(user: { id: string; email: string }, id: string) {
    this.assertEnabled();
    return this.db.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id, userId: user.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (
        !['pending_payment', 'pending'].includes(order.status) &&
        !(order.source === 'wholesale' && order.status === 'confirmed')
      )
        throw new ConflictException('This order is not awaiting payment');
      if (!order.shippingLine1 || !order.shippingCity)
        throw new ConflictException(
          'Please contact Team Core Sports Wear to complete the delivery address before paying this order',
        );
      const paid = await manager.query(
        "SELECT id FROM payments WHERE order_id=$1 AND status='paid'",
        [id],
      );
      if (paid.length)
        throw new ConflictException('This order has already been paid');
      const existing = await manager.query(
        'SELECT * FROM storefront_payment_sessions WHERE order_id=$1',
        [id],
      );
      if (
        existing.length &&
        new Date(existing[0].expires_at).getTime() > Date.now()
      )
        return { url: existing[0].url };
      // Do not create a second charge opportunity while an expired or uncertain
      // attempt may still be waiting for its signed provider notification.
      if (existing.length)
        throw new ConflictException(
          'This payment session has expired. Check your order status or contact Team Core Sports Wear before placing another order.',
        );
      if (
        Date.now() - new Date(order.createdAt).getTime() >
        23 * 60 * 60 * 1000
      )
        throw new ConflictException(
          'This payment attempt needs review. Please contact Team Core Sports Wear with your order reference.',
        );
      const origin = this.config.get<string>('STOREFRONT_URL');
      if (
        !origin ||
        !/^https?:\/\/[^/]+$/.test(origin) ||
        (!origin.startsWith('https://') &&
          this.config.get('NODE_ENV') === 'production')
      )
        throw new ServiceUnavailableException(
          'Payment return address is not configured',
        );
      const session = await this.stripe.createCheckoutSession({
        orderId: id,
        amount: Number(order.totalAmount),
        currency: order.currency,
        customerEmail: user.email,
        successUrl: origin + '/checkout/return?order=' + id,
        cancelUrl: origin + '/checkout/cancelled?order=' + id,
        metadata: { userId: user.id },
        idempotencyKey:
          'teamcore-pay-' + id + '-' + (existing[0]?.session_id || 'initial'),
      });
      if (!session.url)
        throw new ServiceUnavailableException(
          'Payment provider did not return a checkout address',
        );
      await manager.query(
        'INSERT INTO storefront_payment_sessions(order_id,session_id,url,expires_at) VALUES($1,$2,$3,$4) ON CONFLICT(order_id) DO UPDATE SET session_id=EXCLUDED.session_id,url=EXCLUDED.url,expires_at=EXCLUDED.expires_at',
        [id, session.id, session.url, new Date(session.expires_at * 1000)],
      );
      return { url: session.url };
    });
  }
  async contact(dto: ContactDto) {
    const rows = await this.db.query(
      'INSERT INTO storefront_contacts(name,email,subject,message) VALUES($1,$2,$3,$4) RETURNING id',
      [
        dto.name.trim(),
        dto.email.trim().toLowerCase(),
        dto.subject.trim(),
        dto.message.trim(),
      ],
    );
    await this.mail.sendBusinessAlert(
      'New contact enquiry',
      `Reference: ${rows[0].id}\nFrom: ${dto.name} <${dto.email}>\nSubject: ${dto.subject}\n\n${dto.message}`,
      { replyTo: dto.email.trim().toLowerCase(), path: '/contacts' },
    );
    return { reference: rows[0].id };
  }
  contacts() {
    return this.db.query(
      'SELECT * FROM storefront_contacts ORDER BY created_at DESC LIMIT 100',
    );
  }
}
