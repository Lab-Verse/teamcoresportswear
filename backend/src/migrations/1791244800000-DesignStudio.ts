import { MigrationInterface, QueryRunner } from 'typeorm';
export class DesignStudio1791244800000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE design_templates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL,
        product_id uuid NOT NULL REFERENCES products(id), spec jsonb NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','retired')),
        created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE design_assets (
        id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES users(id),
        width int NOT NULL, height int NOT NULL, original_type varchar(30) NOT NULL,
        bytes int NOT NULL, checksum varchar(64) NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
      CREATE INDEX design_assets_owner ON design_assets(owner_id);
      CREATE TABLE design_projects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES users(id),
        name varchar(120) NOT NULL, document jsonb NOT NULL, version int NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
      CREATE INDEX design_projects_owner ON design_projects(owner_id,updated_at DESC);
      CREATE TABLE design_revisions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES design_projects(id),
        template_id uuid NOT NULL REFERENCES design_templates(id), document jsonb NOT NULL,
        content_hash varchar(64) NOT NULL, inquiry_id uuid UNIQUE REFERENCES wholesale_inquiries(id),
        submission_key uuid NOT NULL UNIQUE, state varchar(30) NOT NULL DEFAULT 'submitted',
        capacity_notes text, approved_proof_id uuid, production_released_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE design_proofs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), revision_id uuid NOT NULL REFERENCES design_revisions(id),
        asset_id uuid NOT NULL REFERENCES design_assets(id), notes text NOT NULL,
        created_by uuid NOT NULL REFERENCES users(id), status varchar(20) NOT NULL DEFAULT 'pending',
        decided_by uuid REFERENCES users(id), decision_notes text, decided_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now());
      ALTER TABLE design_revisions ADD CONSTRAINT design_approved_proof FOREIGN KEY(approved_proof_id) REFERENCES design_proofs(id);
      CREATE TABLE design_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), revision_id uuid REFERENCES design_revisions(id),
        actor_id uuid REFERENCES users(id), kind varchar(50) NOT NULL, note text,
        created_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE design_mail_outbox (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_key varchar(200) UNIQUE NOT NULL,
        user_id uuid REFERENCES users(id), title varchar(200) NOT NULL, message text NOT NULL,
        path varchar(300) NOT NULL, attempts int NOT NULL DEFAULT 0, delivered_at timestamptz,
        next_attempt_at timestamptz NOT NULL DEFAULT now(), leased_until timestamptz);
      CREATE INDEX design_mail_pending ON design_mail_outbox(next_attempt_at) WHERE delivered_at IS NULL;
      ALTER TABLE wholesale_inquiry_items ADD COLUMN design_revision_id uuid REFERENCES design_revisions(id);
      ALTER TABLE wholesale_quotation_items ADD COLUMN design_revision_id uuid REFERENCES design_revisions(id);
      ALTER TABLE wholesale_quotation_items ADD COLUMN design_proof_id uuid REFERENCES design_proofs(id);
      ALTER TABLE order_items ADD COLUMN design_revision_id uuid REFERENCES design_revisions(id);
      ALTER TABLE order_items ADD COLUMN design_proof_id uuid REFERENCES design_proofs(id);
      ALTER TABLE wholesale_inquiry_items DROP CONSTRAINT wholesale_inquiry_items_inquiry_id_variant_id_key;
      ALTER TABLE wholesale_quotation_items DROP CONSTRAINT wholesale_quotation_items_quotation_id_variant_id_key;
      CREATE UNIQUE INDEX inquiry_standard_line ON wholesale_inquiry_items(inquiry_id,variant_id) WHERE design_revision_id IS NULL;
      CREATE UNIQUE INDEX inquiry_design_line ON wholesale_inquiry_items(inquiry_id,variant_id,design_revision_id) WHERE design_revision_id IS NOT NULL;
      CREATE UNIQUE INDEX quotation_standard_line ON wholesale_quotation_items(quotation_id,variant_id) WHERE design_revision_id IS NULL;
      CREATE UNIQUE INDEX quotation_design_line ON wholesale_quotation_items(quotation_id,variant_id,design_revision_id) WHERE design_revision_id IS NOT NULL;
    `);
  }
  async down(): Promise<void> {
    throw new Error(
      'Design data must be retained. Roll back application code without dropping approved designs.',
    );
  }
}
