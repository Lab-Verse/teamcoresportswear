import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { MailService } from '../../common/modules/mail/mail.service';
@Injectable()
export class DesignMailService {
  private busy = false;
  private logger = new Logger('DesignMail');
  constructor(
    private db: DataSource,
    private mail: MailService,
  ) {}
  @Cron('*/30 * * * * *')
  async dispatch() {
    if (this.busy) return;
    this.busy = true;
    try {
      const jobs = await this.db.transaction(async (m) => {
        const rows =
          await m.query(`SELECT j.*,u.email FROM design_mail_outbox j LEFT JOIN users u ON u.id=j.user_id
          WHERE j.delivered_at IS NULL AND j.attempts<8 AND j.next_attempt_at<=now() AND (j.leased_until IS NULL OR j.leased_until<now())
          ORDER BY j.next_attempt_at LIMIT 1 FOR UPDATE OF j SKIP LOCKED`);
        for (const j of rows)
          await m.query(
            "UPDATE design_mail_outbox SET leased_until=now()+interval '10 minutes',attempts=attempts+1 WHERE id=$1",
            [j.id],
          );
        return rows;
      });
      for (const j of jobs) {
        const sent = j.user_id
          ? await this.mail.sendActivity(j.email, j.title, j.message, j.path)
          : await this.mail.sendBusinessAlert(j.title, j.message);
        await this.db.query(
          `UPDATE design_mail_outbox SET delivered_at=CASE WHEN $2 THEN now() ELSE NULL END,
          leased_until=NULL,next_attempt_at=now()+interval '5 minutes' * LEAST(64,power(2,attempts)::int) WHERE id=$1`,
          [j.id, sent],
        );
      }
    } catch {
      this.logger.warn(
        'Design mail dispatch failed; pending records will retry.',
      );
    } finally {
      this.busy = false;
    }
  }
}
