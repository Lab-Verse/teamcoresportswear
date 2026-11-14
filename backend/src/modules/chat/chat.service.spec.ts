import { ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';
describe('Conversation email alerts', () => {
  it('notifies other participants only after saving the message', async () => {
    const dto = { threadId: 'thread-1', senderId: 'sender-1', body: 'Hello' };
    const repository = {
      create: jest.fn().mockReturnValue(dto),
      save: jest.fn().mockResolvedValue(dto),
    };
    const db = {
      query: jest.fn().mockResolvedValue([{ email: 'recipient@example.com' }]),
    };
    const mail = { sendActivity: jest.fn().mockResolvedValue(true) };
    const service = new ChatService(
      {} as any,
      { findOne: jest.fn().mockResolvedValue({ userId: 'sender-1' }) } as any,
      repository as any,
      db as any,
      mail as any,
    );
    await service.sendMessage(dto);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('p.user_id<>$2'),
      ['thread-1', 'sender-1'],
    );
    expect(mail.sendActivity).toHaveBeenCalledWith(
      'recipient@example.com',
      'New conversation message',
      expect.any(String),
      '/account/chat',
    );
  });
  it('rejects nonparticipants without sending email', async () => {
    const mail = { sendActivity: jest.fn() };
    const service = new ChatService(
      {} as any,
      { findOne: jest.fn().mockResolvedValue(null) } as any,
      {} as any,
      {} as any,
      mail as any,
    );
    await expect(
      service.sendMessage({ threadId: 'thread-1', senderId: 'outsider' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mail.sendActivity).not.toHaveBeenCalled();
  });
});
