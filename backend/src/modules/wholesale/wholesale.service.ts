import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { NotificationHelperService } from '../notifications/notification-helper.service';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import {
  CreateWholesaleInquiryDto,
  CreateWholesaleQuotationDto,
  ListWholesaleInquiriesDto,
  UpdateWholesaleInquiryDto,
} from './dto';
import {
  WholesaleInquiry,
  WholesaleInquiryItem,
  WholesaleQuotation,
  WholesaleQuotationItem,
} from './entities';
import { assertQuantity } from '../storefront/commerce-rules';
import { Store } from '../sellers/entities/store.entity';
import { InquiryStatus, QuotationStatus } from './enums/wholesale.enum';
import { MailService } from '../../common/modules/mail/mail.service';

const ADMIN_ROLES = new Set(['admin', 'super_admin']);
const ADMIN_STATUS_TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
  [InquiryStatus.SUBMITTED]: [
    InquiryStatus.UNDER_REVIEW,
    InquiryStatus.CANCELLED,
  ],
  [InquiryStatus.UNDER_REVIEW]: [
    InquiryStatus.QUOTED,
    InquiryStatus.CANCELLED,
    InquiryStatus.CLOSED,
  ],
  [InquiryStatus.QUOTED]: [InquiryStatus.UNDER_REVIEW, InquiryStatus.CLOSED],
  [InquiryStatus.ACCEPTED]: [InquiryStatus.CLOSED],
  [InquiryStatus.DECLINED]: [InquiryStatus.UNDER_REVIEW, InquiryStatus.CLOSED],
  [InquiryStatus.CANCELLED]: [],
  [InquiryStatus.CLOSED]: [],
};

@Injectable()
export class WholesaleService {
  constructor(
    @InjectRepository(WholesaleInquiry)
    private readonly inquiryRepo: Repository<WholesaleInquiry>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationHelperService,
    private readonly mail: MailService,
  ) {}

  async createInquiry(customerId: string, dto: CreateWholesaleInquiryDto) {
    const uniqueVariantIds = [
      ...new Set(dto.items.map((item) => item.variantId)),
    ];
    if (uniqueVariantIds.length !== dto.items.length) {
      throw new BadRequestException(
        'Each product variant may appear only once',
      );
    }

    const variants = await this.dataSource.getRepository(ProductVariant).find({
      where: { id: In(uniqueVariantIds), isActive: true },
      relations: ['product'],
    });
    if (variants.length !== uniqueVariantIds.length) {
      throw new BadRequestException(
        'One or more product variants are missing or inactive',
      );
    }
    const store = await this.dataSource
      .getRepository(Store)
      .findOne({ where: { singletonKey: true, isActive: true } });
    for (const item of dto.items) {
      const variant = variants.find((v) => v.id === item.variantId)!;
      if (
        !store ||
        variant.product.storeId !== store.id ||
        !variant.product.isActive ||
        variant.product.status !== 'active' ||
        variant.product.purchaseMode === 'direct'
      )
        throw new BadRequestException(
          'A product is not available for quotation',
        );
      assertQuantity(
        item.requestedQuantity,
        variant.product.minimumOrderQuantity,
        variant.product.quantityIncrement,
      );
    }
    const variantMap = new Map(
      variants.map((variant) => [variant.id, variant]),
    );
    const reference = this.makeReference('RFQ');

    const result = await this.dataSource.transaction(async (manager) => {
      const inquiry = manager.create(WholesaleInquiry, {
        reference,
        customerId,
        companyName: dto.companyName.trim(),
        contactName: dto.contactName.trim(),
        contactEmail: dto.contactEmail.toLowerCase(),
        contactPhone: dto.contactPhone || null,
        deliveryCountry: dto.deliveryCountry.toUpperCase(),
        deliveryCity: dto.deliveryCity?.trim() || null,
        deliveryAddress: dto.deliveryAddress?.trim() || null,
        notes: dto.notes?.trim() || null,
        status: InquiryStatus.SUBMITTED,
      });
      const saved = await manager.save(inquiry);
      const items = dto.items.map((item) => {
        const variant = variantMap.get(item.variantId)!;
        return manager.create(WholesaleInquiryItem, {
          inquiryId: saved.id,
          variantId: item.variantId,
          requestedQuantity: item.requestedQuantity,
          targetUnitPrice: item.targetUnitPrice ?? null,
          notes: item.notes?.trim() || null,
          skuSnapshot: variant.sku,
          productNameSnapshot: variant.product?.name || variant.sku,
        });
      });
      await manager.save(items);
      saved.items = items;
      return saved;
    });
    await this.mail.sendActivity(
      result.contactEmail,
      'Quote request received',
      `We received your request ${result.reference}. Our team will review it and prepare a quotation.`,
      `/account/wholesale/${result.id}`,
    );
    await this.mail.sendBusinessAlert(
      'New quote request',
      [
        `Reference: ${result.reference}`,
        `Company: ${result.companyName}`,
        `Contact: ${result.contactName} <${result.contactEmail}>`,
        ...(result.contactPhone ? [`Phone: ${result.contactPhone}`] : []),
        `Delivery: ${[result.deliveryCity, result.deliveryCountry].filter(Boolean).join(', ')}`,
        '',
        ...result.items.map(
          (item) =>
            `${item.requestedQuantity} × ${item.productNameSnapshot} (${item.skuSnapshot})`,
        ),
        ...(result.notes ? ['', `Notes: ${result.notes}`] : []),
      ].join('\n'),
      { replyTo: result.contactEmail, path: '/wholesale' },
    );
    return result;
  }

  async listInquiries(
    actor: { id: string; role?: string },
    query: ListWholesaleInquiriesDto,
  ): Promise<{
    data: WholesaleInquiry[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const qb = this.inquiryRepo
      .createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.attributeValues', 'attributeValues')
      .leftJoinAndSelect('attributeValues.attributeValue', 'attributeValue')
      .leftJoinAndSelect('attributeValue.attributeKey', 'attributeKey')
      .orderBy('inquiry.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (!this.isAdmin(actor.role)) {
      qb.andWhere('inquiry.customerId = :customerId', { customerId: actor.id });
    }
    if (query.status)
      qb.andWhere('inquiry.status = :status', { status: query.status });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async getInquiry(id: string, actor: { id: string; role?: string }) {
    const qb = this.inquiryRepo
      .createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.customer', 'customer')
      .leftJoinAndSelect('inquiry.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('variant.attributeValues', 'attributeValues')
      .leftJoinAndSelect('attributeValues.attributeValue', 'attributeValue')
      .leftJoinAndSelect('attributeValue.attributeKey', 'attributeKey')
      .leftJoinAndSelect('inquiry.quotations', 'quotations')
      .leftJoinAndSelect('quotations.items', 'quotationItems')
      .where('inquiry.id = :id', { id })
      .orderBy('quotations.createdAt', 'DESC');
    if (this.isAdmin(actor.role))
      qb.addSelect(['quotations.internalNotes', 'inquiry.adminNotes']);
    const inquiry = await qb.getOne();
    if (!inquiry) throw new NotFoundException('Wholesale inquiry not found');
    this.assertOwnerOrAdmin(inquiry, actor);
    this.markExpiredQuotes(inquiry.quotations || []);
    const quotationIds = (inquiry.quotations || []).map((quote) => quote.id);
    if (quotationIds.length) {
      const orders = await this.dataSource.getRepository(Order).find({
        where: { wholesaleQuotationId: In(quotationIds) },
      });
      const orderByQuotation = new Map(
        orders.map((order) => [order.wholesaleQuotationId, order]),
      );
      for (const quote of inquiry.quotations || []) {
        (quote as WholesaleQuotation & { order?: Order }).order =
          orderByQuotation.get(quote.id);
      }
    }
    return inquiry;
  }

  async updateInquiry(id: string, dto: UpdateWholesaleInquiryDto) {
    const inquiry = await this.inquiryRepo.findOne({ where: { id } });
    if (!inquiry) throw new NotFoundException('Wholesale inquiry not found');
    if (dto.status && dto.status !== inquiry.status) {
      const allowed = ADMIN_STATUS_TRANSITIONS[inquiry.status] || [];
      if (!allowed.includes(dto.status)) {
        throw new ConflictException(
          `Cannot move inquiry from ${inquiry.status} to ${dto.status}`,
        );
      }
      inquiry.status = dto.status;
    }
    if (dto.adminNotes !== undefined)
      inquiry.adminNotes = dto.adminNotes.trim() || null;
    const saved = await this.inquiryRepo.save(inquiry);
    if (dto.status)
      await this.mail.sendActivity(
        saved.contactEmail,
        'Quote request updated',
        `Request ${saved.reference} is now ${saved.status.replace(/_/g, ' ')}.`,
        `/account/wholesale/${saved.id}`,
      );
    return saved;
  }

  async cancelInquiry(id: string, customerId: string) {
    const inquiry = await this.inquiryRepo.findOne({ where: { id } });
    if (!inquiry) throw new NotFoundException('Wholesale inquiry not found');
    if (inquiry.customerId !== customerId)
      throw new ForbiddenException('You do not own this inquiry');
    if (
      ![InquiryStatus.SUBMITTED, InquiryStatus.UNDER_REVIEW].includes(
        inquiry.status,
      )
    ) {
      throw new ConflictException('This inquiry can no longer be cancelled');
    }
    inquiry.status = InquiryStatus.CANCELLED;
    const saved = await this.inquiryRepo.save(inquiry);
    await this.mail.sendBusinessAlert(
      'Quote request cancelled',
      `The customer cancelled ${saved.reference}.`,
    );
    return saved;
  }

  async createQuotation(
    inquiryId: string,
    adminId: string,
    dto: CreateWholesaleQuotationDto,
  ) {
    const expiresAt = new Date(dto.expiresAt);
    if (expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Quotation expiry must be in the future');
    }
    const discount = this.money(dto.discountAmount || 0);
    const shipping = this.money(dto.shippingAmount || 0);
    const tax = this.money(dto.taxAmount || 0);

    const quote = await this.dataSource.transaction(async (manager) => {
      const inquiry = await manager.findOne(WholesaleInquiry, {
        where: { id: inquiryId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!inquiry) throw new NotFoundException('Wholesale inquiry not found');
      inquiry.items = await manager.find(WholesaleInquiryItem, {
        where: { inquiryId },
      });
      if (
        [
          InquiryStatus.CANCELLED,
          InquiryStatus.CLOSED,
          InquiryStatus.ACCEPTED,
        ].includes(inquiry.status)
      ) {
        throw new ConflictException(
          `Cannot quote an inquiry with status ${inquiry.status}`,
        );
      }

      const requested = new Map(
        inquiry.items.map((item) => [this.designLineKey(item), item]),
      );
      const uniqueIds = new Set(
        dto.items.map((item) => this.designLineKey(item)),
      );
      if (uniqueIds.size !== dto.items.length) {
        throw new BadRequestException(
          'Each quotation variant may appear only once',
        );
      }
      for (const item of dto.items) {
        const requestItem = requested.get(this.designLineKey(item));
        if (!requestItem)
          throw new BadRequestException(
            'Quotation contains a variant not in the inquiry',
          );
        if (item.quantity > requestItem.requestedQuantity) {
          throw new BadRequestException(
            'Quoted quantity cannot exceed requested quantity',
          );
        }
        if (
          requestItem.designRevisionId &&
          item.quantity !== requestItem.requestedQuantity
        )
          throw new BadRequestException(
            'Design quantities are pinned to the approved roster. Request a revised design to change them.',
          );
      }
      if (
        inquiry.items.some((i) => i.designRevisionId) &&
        dto.items.length !== inquiry.items.length
      )
        throw new BadRequestException(
          'A custom quotation must include every approved size.',
        );
      const designProofs = new Map<string, string>();
      for (const revisionId of [
        ...new Set(dto.items.map((i) => i.designRevisionId).filter(Boolean)),
      ].sort()) {
        const revision = await this.checkedDesign(
          manager,
          revisionId,
          inquiry.id,
          inquiry.customerId,
        );
        designProofs.set(revisionId, revision.approved_proof_id);
      }

      const subtotal = this.money(
        dto.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        ),
      );
      if (discount > subtotal)
        throw new BadRequestException('Discount cannot exceed subtotal');
      const total = this.money(subtotal - discount + shipping + tax);
      const quotation = manager.create(WholesaleQuotation, {
        reference: this.makeReference('QUO'),
        inquiryId,
        createdBy: adminId,
        status: QuotationStatus.SENT,
        currency: dto.currency.toUpperCase(),
        subtotal,
        discountAmount: discount,
        shippingAmount: shipping,
        taxAmount: tax,
        totalAmount: total,
        terms: dto.terms?.trim() || null,
        internalNotes: dto.internalNotes?.trim() || null,
        expiresAt,
      });
      const saved = await manager.save(quotation);
      const items = dto.items.map((item) => {
        const requestItem = requested.get(this.designLineKey(item))!;
        const unitPrice = this.money(item.unitPrice);
        return manager.create(WholesaleQuotationItem, {
          quotationId: saved.id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice,
          lineTotal: this.money(unitPrice * item.quantity),
          skuSnapshot: requestItem.skuSnapshot,
          productNameSnapshot: requestItem.productNameSnapshot,
          designRevisionId: requestItem.designRevisionId || null,
          designProofId: designProofs.get(requestItem.designRevisionId) || null,
        });
      });
      await manager.save(items);
      inquiry.status = InquiryStatus.QUOTED;
      await manager.save(inquiry);
      saved.items = items;
      return {
        saved,
        customerId: inquiry.customerId,
        email: inquiry.contactEmail,
      };
    });

    this.notifications
      .notify(quote.customerId, 'WHOLESALE_QUOTE_READY', {
        inquiryId,
        quoteId: quote.saved.id,
        reference: quote.saved.reference,
      })
      .catch(() => undefined);
    await this.mail.sendActivity(
      quote.email,
      'Your quotation is ready',
      `Quotation ${quote.saved.reference} is ready to review. Sign in to view prices, terms and the expiry date.`,
      `/account/wholesale/${inquiryId}`,
    );
    return quote.saved;
  }

  async respondToQuotation(
    quotationId: string,
    customerId: string,
    response: QuotationStatus.ACCEPTED | QuotationStatus.DECLINED,
  ) {
    const result = await this.dataSource.transaction(async (manager) => {
      const snapshot = await manager.findOne(WholesaleQuotation, {
        where: { id: quotationId },
      });
      if (!snapshot)
        throw new NotFoundException('Wholesale quotation not found');
      const inquiry = await manager.findOne(WholesaleInquiry, {
        where: { id: snapshot.inquiryId },
        lock: { mode: 'pessimistic_write' },
      });
      const quote = await manager.findOne(WholesaleQuotation, {
        where: { id: quotationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (quote) quote.inquiry = inquiry!;
      if (!quote) throw new NotFoundException('Wholesale quotation not found');
      if (!quote.inquiry) {
        quote.inquiry = await manager.findOne(WholesaleInquiry, {
          where: { id: quote.inquiryId },
        });
      }
      if (!quote.inquiry)
        throw new NotFoundException('Wholesale inquiry not found');
      if (quote.inquiry.customerId !== customerId)
        throw new ForbiddenException('You do not own this quotation');
      if (quote.inquiry.status === InquiryStatus.ACCEPTED)
        throw new ConflictException('An order already exists for this inquiry');
      if (quote.status !== QuotationStatus.SENT) {
        throw new ConflictException(`Quotation is already ${quote.status}`);
      }
      if (quote.expiresAt.getTime() <= Date.now()) {
        quote.status = QuotationStatus.EXPIRED;
        await manager.save(quote);
        return { expired: true as const, quote: null };
      }
      quote.status = response;
      quote.respondedAt = new Date();
      await manager.save(quote);
      quote.inquiry.status =
        response === QuotationStatus.ACCEPTED
          ? InquiryStatus.ACCEPTED
          : InquiryStatus.DECLINED;
      await manager.save(quote.inquiry);
      if (response === QuotationStatus.ACCEPTED) {
        quote.items = await manager.find(WholesaleQuotationItem, {
          where: { quotationId },
        });
        await this.createWholesaleOrder(manager, quote);
        await this.supersedeOtherQuotes(manager, quote.inquiryId, quote.id);
      }
      return { expired: false as const, quote };
    });
    if (result.expired) throw new ConflictException('Quotation has expired');
    await this.mail.sendActivity(
      result.quote.inquiry.contactEmail,
      'Quotation response recorded',
      `Quotation ${result.quote.reference} was ${response}.`,
      `/account/wholesale/${result.quote.inquiryId}`,
    );
    await this.mail.sendBusinessAlert(
      'Quotation response',
      `Quotation ${result.quote.reference} was ${response}.`,
    );
    return result.quote;
  }

  private async createWholesaleOrder(
    manager: EntityManager,
    quote: WholesaleQuotation,
  ) {
    const existing = await manager.findOne(Order, {
      where: { wholesaleQuotationId: quote.id },
    });
    if (existing) return existing;

    const designModes = new Map<string, string>();
    for (const revisionId of [
      ...new Set(quote.items.map((i) => i.designRevisionId).filter(Boolean)),
    ].sort()) {
      const revision = await this.checkedDesign(
        manager,
        revisionId,
        quote.inquiryId,
        quote.inquiry.customerId,
      );
      if (
        quote.items
          .filter((i) => i.designRevisionId === revisionId)
          .some((i) => i.designProofId !== revision.approved_proof_id)
      )
        throw new ConflictException(
          'The design proof changed. Request a new quotation.',
        );
      designModes.set(revisionId, revision.fulfilment);
    }
    const variantIds = [...new Set(quote.items.map((item) => item.variantId))];
    const variants: Array<{ id: string; store_id: string }> =
      await manager.query(
        `SELECT pv.id, p.store_id
         FROM product_variants pv
         JOIN products p ON p.id = pv.product_id
         WHERE pv.id = ANY($1::uuid[])`,
        [variantIds],
      );
    const stores = new Map(variants.map((row) => [row.id, row.store_id]));
    if (stores.size !== variantIds.length) {
      throw new BadRequestException('A quoted product is no longer available');
    }

    const stockMovements: Array<{
      warehouseId: string;
      variantId: string;
      quantity: number;
    }> = [];
    for (const item of [...quote.items].sort((a, b) =>
      a.variantId.localeCompare(b.variantId),
    )) {
      if (
        item.designRevisionId &&
        designModes.get(item.designRevisionId) === 'made_to_order'
      )
        continue;
      const rows: Array<{
        warehouse_id: string;
        qty_on_hand: number;
        qty_reserved: number;
      }> = await manager.query(
        `SELECT i.warehouse_id, i.qty_on_hand, i.qty_reserved
         FROM inventory i JOIN warehouses w ON w.id=i.warehouse_id
         WHERE i.variant_id = $1 AND i.qty_on_hand > i.qty_reserved AND w.is_active=true
         ORDER BY i.warehouse_id
         FOR UPDATE OF i`,
        [item.variantId],
      );
      const available = rows.reduce(
        (sum, row) => sum + Number(row.qty_on_hand) - Number(row.qty_reserved),
        0,
      );
      if (available < item.quantity) {
        throw new ConflictException(
          `Insufficient stock for ${item.productNameSnapshot}`,
        );
      }
      let remaining = item.quantity;
      for (const row of rows) {
        if (remaining === 0) break;
        const quantity = Math.min(
          remaining,
          Number(row.qty_on_hand) - Number(row.qty_reserved),
        );
        await manager.query(
          `UPDATE inventory SET qty_on_hand = qty_on_hand - $1
           WHERE warehouse_id = $2 AND variant_id = $3`,
          [quantity, row.warehouse_id, item.variantId],
        );
        stockMovements.push({
          warehouseId: row.warehouse_id,
          variantId: item.variantId,
          quantity,
        });
        remaining -= quantity;
      }
    }

    const order = manager.create(Order, {
      orderNumber: `WHO-${quote.reference.replace(/^QUO-/, '')}`,
      userId: quote.inquiry.customerId,
      idempotencyKey: `wholesale:${quote.id}`,
      status: 'pending_payment',
      currency: quote.currency,
      source: 'wholesale',
      wholesaleQuotationId: quote.id,
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      shippingAmount: quote.shippingAmount,
      taxAmount: quote.taxAmount,
      totalAmount: quote.totalAmount,
      shippingLine1: quote.inquiry.deliveryAddress,
      shippingCity: quote.inquiry.deliveryCity,
      shippingCountry: quote.inquiry.deliveryCountry,
    });
    const savedOrder = await manager.save(order);
    for (const movement of stockMovements) {
      await manager.query(
        `INSERT INTO inventory_movements
         (order_id, warehouse_id, variant_id, movement_type, quantity, note)
         VALUES ($1, $2, $3, 'sale', $4, 'Wholesale quotation accepted')`,
        [
          savedOrder.id,
          movement.warehouseId,
          movement.variantId,
          -movement.quantity,
        ],
      );
    }
    const orderItems = quote.items.map((item) =>
      manager.create(OrderItem, {
        orderId: savedOrder.id,
        variantId: item.variantId,
        storeId: stores.get(item.variantId)!,
        skuSnapshot: item.skuSnapshot,
        nameSnapshot: item.productNameSnapshot,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: item.lineTotal,
        flashSaleId: null,
        designRevisionId: item.designRevisionId || null,
        designProofId: item.designProofId || null,
      }),
    );
    await manager.save(orderItems);
    for (const revisionId of designModes.keys())
      await manager.query(
        "UPDATE design_revisions SET state='ordered' WHERE id=$1",
        [revisionId],
      );
    return savedOrder;
  }

  private designLineKey(item: {
    variantId: string;
    designRevisionId?: string | null;
  }) {
    return item.variantId + ':' + (item.designRevisionId || 'standard');
  }

  private async checkedDesign(
    manager: EntityManager,
    revisionId: string,
    inquiryId: string,
    ownerId: string,
  ) {
    const [revision] = await manager.query(
      `SELECT r.*,p.owner_id,t.spec->>'fulfilment' AS fulfilment FROM design_revisions r
      JOIN design_projects p ON p.id=r.project_id JOIN design_templates t ON t.id=r.template_id
      JOIN design_proofs f ON f.id=r.approved_proof_id AND f.status='approved'
      WHERE r.id=$1 AND r.inquiry_id=$2 AND p.owner_id=$3 AND r.state='approved' AND r.capacity_notes IS NOT NULL
      AND t.spec->>'sampleApproved'='true'
      FOR UPDATE OF r`,
      [revisionId, inquiryId, ownerId],
    );
    if (!revision)
      throw new ConflictException(
        'The customer must approve the current production proof and TEAM CORE must confirm a sample-approved garment and fulfilment before quotation acceptance.',
      );
    return revision;
  }

  private async supersedeOtherQuotes(
    manager: EntityManager,
    inquiryId: string,
    acceptedId: string,
  ) {
    await manager
      .createQueryBuilder()
      .update(WholesaleQuotation)
      .set({ status: QuotationStatus.SUPERSEDED })
      .where('inquiry_id = :inquiryId', { inquiryId })
      .andWhere('id != :acceptedId', { acceptedId })
      .andWhere('status = :status', { status: QuotationStatus.SENT })
      .execute();
  }

  private markExpiredQuotes(quotes: WholesaleQuotation[]) {
    const now = Date.now();
    for (const quote of quotes) {
      if (
        quote.status === QuotationStatus.SENT &&
        quote.expiresAt.getTime() <= now
      ) {
        quote.status = QuotationStatus.EXPIRED;
      }
    }
  }

  private assertOwnerOrAdmin(
    inquiry: WholesaleInquiry,
    actor: { id: string; role?: string },
  ) {
    if (!this.isAdmin(actor.role) && inquiry.customerId !== actor.id) {
      throw new ForbiddenException('You do not have access to this inquiry');
    }
  }

  private isAdmin(role?: string) {
    return !!role && ADMIN_ROLES.has(role);
  }

  private money(value: number) {
    return Math.round((Number(value) + Number.EPSILON) * 10000) / 10000;
  }

  private makeReference(prefix: 'RFQ' | 'QUO') {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${prefix}-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
