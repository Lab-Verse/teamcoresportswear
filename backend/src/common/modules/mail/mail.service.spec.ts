import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';
import { activityEmail } from './mail.templates';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));
describe('TEAM CORE SMTP configuration', () => {
  const sendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
  });
  const make = (extra = {}) =>
    new MailService(
      new ConfigService({
        NOTIFICATION_ENABLED: 'true',
        EMAIL_USER: 'notifications@example.com',
        EMAIL_PASS: 'test-only',
        FRONTEND_URL: 'https://teamcoresportswear.com',
        MAIL_REPLY_TO: 'support@teamcoresportswear.com',
        ...extra,
      }),
    );
  it('uses implicit TLS on 465 and sends replies to support', async () => {
    const service = make({ SMTP_PORT: '465' });
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 465,
        secure: true,
        tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
      }),
    );
    await service.sendActivity(
      'buyer@example.com',
      'Quote ready',
      'Please review',
      '/account/wholesale/123',
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: 'support@teamcoresportswear.com',
        html: expect.stringContaining(
          'https://teamcoresportswear.com/account/wholesale/123',
        ),
      }),
    );
  });
  it('requires STARTTLS on port 587', () => {
    make({ SMTP_PORT: '587' });
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false, requireTLS: true }),
    );
  });
  it('delivers business alerts to sales with the customer reply address and admin destination', async () => {
    const service = make({
      ADMIN_EMAIL: 'sales@teamcoresportswear.org',
      ADMIN_URL: 'https://admin.teamcoresportswear.org',
    });
    await service.sendBusinessAlert('New contact enquiry', 'Reference: test', {
      replyTo: 'buyer@example.com',
      path: '/contacts',
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'sales@teamcoresportswear.org',
        replyTo: 'buyer@example.com',
        html: expect.stringContaining(
          'https://admin.teamcoresportswear.org/contacts',
        ),
      }),
    );
    expect(sendMail.mock.calls[0][0].html).toContain(
      'Open administration portal',
    );
    await expect(
      service.sendBusinessAlert('Enquiry', 'Message', {
        path: '//evil.example',
      }),
    ).rejects.toThrow('Invalid administration email link');
    expect(sendMail).toHaveBeenCalledTimes(1);
  });
  it('does not report a disabled email as sent', async () => {
    const service = make({ NOTIFICATION_ENABLED: 'false' });
    expect(await service.sendTestEmail('buyer@example.com')).toBe(false);
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });
  it('rejects missing credentials and external account links', async () => {
    expect(() => make({ EMAIL_PASS: '' })).toThrow('SMTP credentials');
    await expect(
      make().sendActivity(
        'buyer@example.com',
        'Subject',
        'Message',
        '//evil.example',
      ),
    ).rejects.toThrow('Invalid email link');
  });
  it('escapes enquiry markup in transactional messages', () => {
    const result = activityEmail(
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      'https://teamcoresportswear.com/account',
    );
    expect(result.html).not.toContain('<script>');
    expect(result.html).not.toContain('<img src=x');
    expect(result.html).toContain('&lt;img');
  });
});
