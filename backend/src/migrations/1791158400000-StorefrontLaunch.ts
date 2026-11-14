import { MigrationInterface, QueryRunner } from 'typeorm';
export class StorefrontLaunch1791158400000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE products ADD COLUMN purchase_mode varchar(20) NOT NULL DEFAULT 'both' CHECK(purchase_mode IN ('direct','quote_only','both')), ADD COLUMN minimum_order_quantity int NOT NULL DEFAULT 1 CHECK(minimum_order_quantity>0), ADD COLUMN quantity_increment int NOT NULL DEFAULT 1 CHECK(quantity_increment>0)`,
    );
    await q.query(
      `CREATE TABLE storefront_contacts(id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),name varchar(200) NOT NULL,email varchar(320) NOT NULL,subject varchar(200) NOT NULL,message text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE TABLE storefront_payment_sessions(order_id uuid PRIMARY KEY REFERENCES orders(id),session_id varchar(255) NOT NULL,url text NOT NULL,expires_at timestamptz NOT NULL)`,
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE storefront_payment_sessions');
    await q.query('DROP TABLE storefront_contacts');
    await q.query(
      'ALTER TABLE products DROP COLUMN purchase_mode, DROP COLUMN minimum_order_quantity, DROP COLUMN quantity_increment',
    );
  }
}
