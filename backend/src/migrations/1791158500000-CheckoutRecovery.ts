import { MigrationInterface, QueryRunner } from 'typeorm';

export class CheckoutRecovery1791158500000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE orders ADD COLUMN checkout_fingerprint varchar(64)`,
    );
    await runner.query(
      `ALTER TABLE wholesale_inquiries ADD COLUMN delivery_address varchar(300)`,
    );
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE wholesale_inquiries DROP COLUMN delivery_address`,
    );
    await runner.query(`ALTER TABLE orders DROP COLUMN checkout_fingerprint`);
  }
}
