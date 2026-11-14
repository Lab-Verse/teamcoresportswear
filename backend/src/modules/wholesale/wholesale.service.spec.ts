import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { WholesaleService } from './wholesale.service';
import { WholesaleInquiry } from './entities';
import { InquiryStatus, QuotationStatus } from './enums/wholesale.enum';

describe('WholesaleService', () => {
  const inquiryRepo = {} as any;
  const notifications = { notify: jest.fn() } as any;

  function serviceWith(dataSource: any) {
    return new WholesaleService(inquiryRepo, dataSource, notifications, {
      sendActivity: jest.fn().mockResolvedValue(true),
      sendBusinessAlert: jest.fn().mockResolvedValue(true),
    } as any);
  }

  beforeEach(() => jest.clearAllMocks());

  it('emails a saved quotation request to the buyer and sales with its details', async () => {
    const variant = {
      id: 'variant-id',
      sku: 'TC-SOCCER-101',
      product: {
        storeId: 'store-id',
        isActive: true,
        status: 'active',
        purchaseMode: 'quote_only',
        minimumOrderQuantity: 1,
        quantityIncrement: 1,
        name: 'Soccer uniform',
      },
    };
    const manager = {
      create: jest.fn((_entity, value) => value),
      save: jest.fn(async (value) =>
        Array.isArray(value) ? value : { ...value, id: 'inquiry-id' },
      ),
    };
    const dataSource = {
      getRepository: jest.fn(() => ({
        find: jest.fn().mockResolvedValue([variant]),
        findOne: jest.fn().mockResolvedValue({ id: 'store-id' }),
      })),
      transaction: jest.fn((work: any) => work(manager)),
    };
    const mail = { sendActivity: jest.fn(), sendBusinessAlert: jest.fn() };
    const service = new WholesaleService(
      inquiryRepo,
      dataSource as any,
      notifications,
      mail as any,
    );
    const result = await service.createInquiry('customer-id', {
      companyName: 'Example Club',
      contactName: 'Buyer',
      contactEmail: 'buyer@example.com',
      deliveryCountry: 'PK',
      deliveryCity: 'Sialkot',
      notes: 'Custom crest please',
      items: [{ variantId: 'variant-id', requestedQuantity: 30 }],
    });
    expect(mail.sendActivity).toHaveBeenCalledWith(
      'buyer@example.com',
      'Quote request received',
      expect.stringContaining(result.reference),
      '/account/wholesale/inquiry-id',
    );
    expect(mail.sendBusinessAlert).toHaveBeenCalledWith(
      'New quote request',
      expect.stringContaining('30 × Soccer uniform (TC-SOCCER-101)'),
      { replyTo: 'buyer@example.com', path: '/wholesale' },
    );
    const message = mail.sendBusinessAlert.mock.calls[0][1];
    expect(message).toContain('Example Club');
    expect(message).toContain('Sialkot, PK');
    expect(message).toContain('Custom crest please');
  });

  it('rejects duplicate variants in an inquiry before accessing the database', async () => {
    const dataSource = { getRepository: jest.fn() };
    const service = serviceWith(dataSource);

    await expect(
      service.createInquiry('customer-id', {
        companyName: 'Example Trading',
        contactName: 'Buyer Name',
        contactEmail: 'buyer@example.com',
        deliveryCountry: 'PK',
        items: [
          {
            variantId: 'd27bf09c-1dee-4a70-b101-065bdd47410f',
            requestedQuantity: 10,
          },
          {
            variantId: 'd27bf09c-1dee-4a70-b101-065bdd47410f',
            requestedQuantity: 20,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.getRepository).not.toHaveBeenCalled();
  });

  it('rejects quotation expiry dates in the past', async () => {
    const dataSource = { transaction: jest.fn() };
    const service = serviceWith(dataSource);

    await expect(
      service.createQuotation('inquiry-id', 'admin-id', {
        currency: 'PKR',
        expiresAt: '2020-01-01T00:00:00.000Z',
        items: [
          {
            variantId: 'd27bf09c-1dee-4a70-b101-065bdd47410f',
            quantity: 10,
            unitPrice: 25,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('does not allow a customer to respond to another customer quotation', async () => {
    const quote = {
      id: 'quote-id',
      status: QuotationStatus.SENT,
      expiresAt: new Date(Date.now() + 60000),
      inquiry: { customerId: 'owner-id' },
      items: [],
    };
    const manager = {
      findOne: jest
        .fn()
        .mockImplementation(async (entity) =>
          entity === WholesaleInquiry ? quote.inquiry : quote,
        ),
    };
    const dataSource = {
      transaction: jest.fn((work: any) => work(manager)),
    };
    const service = serviceWith(dataSource);

    await expect(
      service.respondToQuotation(
        'quote-id',
        'different-id',
        QuotationStatus.ACCEPTED,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('persists expiry before returning an expired-quotation conflict', async () => {
    const quote = {
      id: 'quote-id',
      status: QuotationStatus.SENT,
      expiresAt: new Date(Date.now() - 60000),
      inquiry: { customerId: 'owner-id', status: InquiryStatus.QUOTED },
      items: [],
    };
    const manager = {
      findOne: jest
        .fn()
        .mockImplementation(async (entity) =>
          entity === WholesaleInquiry ? quote.inquiry : quote,
        ),
      save: jest.fn().mockResolvedValue(quote),
    };
    const dataSource = {
      transaction: jest.fn((work: any) => work(manager)),
    };
    const service = serviceWith(dataSource);

    await expect(
      service.respondToQuotation(
        'quote-id',
        'owner-id',
        QuotationStatus.ACCEPTED,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: QuotationStatus.EXPIRED }),
    );
  });
});
