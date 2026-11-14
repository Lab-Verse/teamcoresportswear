import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import { mkdir, writeFile, readFile, unlink } from 'fs/promises';
import { resolve } from 'path';
// TypeScript's legacy Nest resolver selects the ESM declaration; runtime uses CJS.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp') as typeof import('sharp').default;
import {
  validDocument,
  validTemplate,
  inspectDesign,
  DesignDocument,
  TemplateSpec,
} from './design-contract';
import {
  SaveDesignDto,
  TemplateDto,
  SubmitDesignDto,
  ProofDto,
  DecisionDto,
} from './design.dto';
import { renderDesign } from './design-render';
import { Side } from './design-contract';
export type Actor = { id: string; role?: string };
export const isDesignAdmin = (actor: Actor) =>
  ['admin', 'super_admin'].includes(actor.role || '');
const hash = (v: unknown) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
@Injectable()
export class DesignService {
  private processing = 0;
  constructor(
    private db: DataSource,
    private config: ConfigService,
  ) {}
  enabled() {
    return this.config.get('DESIGN_STUDIO_ENABLED') === 'true';
  }
  private requireEnabled() {
    if (!this.enabled())
      throw new ServiceUnavailableException(
        'The design studio is not accepting new designs yet.',
      );
  }
  private root() {
    return resolve(
      this.config.get<string>('DESIGN_PRIVATE_DIR', './private-designs'),
    );
  }
  async templates(admin = false) {
    if (!admin && !this.enabled()) return [];
    return this.db.query(
      `SELECT t.* FROM design_templates t JOIN products p ON p.id=t.product_id JOIN stores s ON s.id=p.store_id
      WHERE $1 OR (t.status='published' AND p.is_active AND p.status='active' AND s.singleton_key AND s.is_active) ORDER BY t.created_at DESC LIMIT 100`,
      [admin],
    );
  }
  async createTemplate(actor: Actor, dto: TemplateDto) {
    if (!validTemplate(dto.spec))
      throw new BadRequestException('Invalid template specification');
    await this.validateVariants(dto.productId, dto.spec);
    return (
      await this.db.query(
        `INSERT INTO design_templates(name,product_id,spec,created_by) VALUES($1,$2,$3,$4) RETURNING *`,
        [dto.name, dto.productId, dto.spec, actor.id],
      )
    )[0];
  }
  private async validateVariants(productId: string, spec: TemplateSpec) {
    const ids = [...new Set(spec.sizes.map((v) => v.variantId))];
    const rows = await this.db.query(
      `SELECT v.id FROM product_variants v JOIN products p ON p.id=v.product_id JOIN stores s ON s.id=p.store_id
      WHERE v.id=ANY($1::uuid[]) AND p.id=$2 AND v.is_active AND p.is_active AND p.status='active' AND p.purchase_mode<>'direct' AND s.singleton_key AND s.is_active`,
      [ids, productId],
    );
    if (rows.length !== ids.length)
      throw new BadRequestException(
        'Template variants must belong to an active TEAM CORE product available for quotations.',
      );
  }
  async publish(id: string, retired = false) {
    const [t] = await this.db.query(
      'SELECT * FROM design_templates WHERE id=$1',
      [id],
    );
    if (!t) throw new NotFoundException();
    if (!retired) {
      if (t.status !== 'draft')
        throw new ConflictException(
          'Published template versions are immutable. Create a new version.',
        );
      const s = t.spec as TemplateSpec;
      if (
        (!s.sampleApproved && s.publicationMode !== 'design_brief') ||
        !s.productionNotes.trim() ||
        !s.sizeGuide.trim() ||
        s.zones.some((z) => !s.images[z.side])
      )
        throw new BadRequestException(
          'Approve a real sample, garment images for every side, print areas and sizing before publishing.',
        );
      await this.validateVariants(t.product_id, s);
      if (s.publicationMode === 'design_brief') {
        const [product] = await this.db.query(
          'SELECT purchase_mode FROM products WHERE id=$1',
          [t.product_id],
        );
        if (product?.purchase_mode !== 'quote_only')
          throw new BadRequestException(
            'Design briefs require a quotation-only product.',
          );
      }
      for (const path of Object.values(s.images)) {
        try {
          const bytes = await readFile(
            resolve(
              this.config.get<string>('UPLOAD_DIR', '/var/lib/teamcore/uploads'),
              path.replace('/uploads/', ''),
            ),
          );
          const meta = await sharp(bytes, {
            limitInputPixels: 24000000,
          }).metadata();
          if (meta.width !== 600 || meta.height !== 650)
            throw new Error('alignment');
        } catch {
          throw new BadRequestException(
            'Every garment view must be an available 600 × 650 image aligned with its print areas.',
          );
        }
      }
    }
    return (
      await this.db.query(
        'UPDATE design_templates SET status=$2 WHERE id=$1 RETURNING *',
        [id, retired ? 'retired' : 'published'],
      )
    )[0][0];
  }
  async list(actor: Actor) {
    return this.db.query(
      `SELECT p.id,p.name,p.version,p.updated_at,p.owner_id,p.document->>'colour' AS colour,
      (SELECT count(*)::int FROM design_revisions r WHERE r.project_id=p.id) AS revisions
      FROM design_projects p WHERE $1 OR p.owner_id=$2 ORDER BY p.updated_at DESC LIMIT 100`,
      [isDesignAdmin(actor), actor.id],
    );
  }
  async garmentImage(id: string, side: string) {
    if (!['front', 'back', 'left', 'right'].includes(side))
      throw new NotFoundException();
    const [t] = await this.db.query(
      "SELECT spec FROM design_templates WHERE id=$1 AND status IN ('published','retired')",
      [id],
    );
    const path = t?.spec.images[side];
    if (!path) throw new NotFoundException();
    try {
      return await sharp(
        await readFile(
          resolve(
            this.config.get<string>('UPLOAD_DIR', '/var/lib/teamcore/uploads'),
            path.replace('/uploads/', ''),
          ),
        ),
      )
        .png()
        .toBuffer();
    } catch {
      throw new NotFoundException('Garment image unavailable');
    }
  }
  async mailStatus() {
    return this.db
      .query(`SELECT id,title,attempts,delivered_at,next_attempt_at,leased_until FROM design_mail_outbox
      WHERE delivered_at IS NULL ORDER BY attempts DESC,next_attempt_at LIMIT 100`);
  }
  async retryMail(id: string) {
    const result = await this.db.query(
      `UPDATE design_mail_outbox SET attempts=0,next_attempt_at=now(),leased_until=NULL
      WHERE id=$1 AND delivered_at IS NULL AND (leased_until IS NULL OR leased_until<now()) RETURNING id`,
      [id],
    );
    if (!result[1])
      throw new ConflictException(
        'This email is already delivered or currently processing.',
      );
    return { queued: true };
  }
  async project(
    id: string,
    actor: Actor,
    manager: EntityManager = this.db.manager,
    lock = false,
  ) {
    const [p] = await manager.query(
      `SELECT * FROM design_projects WHERE id=$1 ${lock ? 'FOR UPDATE' : ''}`,
      [id],
    );
    if (!p || (p.owner_id !== actor.id && !isDesignAdmin(actor)))
      throw new NotFoundException('Design not found');
    return p;
  }
  async detail(id: string, actor: Actor) {
    const p = await this.project(id, actor);
    const revisions = await this.db.query(
      'SELECT * FROM design_revisions WHERE project_id=$1 ORDER BY created_at DESC',
      [id],
    );
    const proofs = await this.db.query(
      'SELECT f.* FROM design_proofs f JOIN design_revisions r ON r.id=f.revision_id WHERE r.project_id=$1 ORDER BY f.created_at DESC',
      [id],
    );
    const events = await this.db.query(
      'SELECT e.* FROM design_events e JOIN design_revisions r ON r.id=e.revision_id WHERE r.project_id=$1 ORDER BY e.created_at DESC',
      [id],
    );
    const templateIds = [
      ...new Set([
        p.document.templateId,
        ...revisions.map((r) => r.template_id),
      ]),
    ];
    const templates = await this.db.query(
      'SELECT * FROM design_templates WHERE id=ANY($1::uuid[])',
      [templateIds],
    );
    const assetIds = [
      ...new Set(
        [p.document, ...revisions.map((r) => r.document)].flatMap((d) =>
          d.layers.filter((l) => l.kind === 'image').map((l) => l.assetId),
        ),
      ),
    ];
    const assets = assetIds.length
      ? await this.db.query(
          'SELECT id,width,height FROM design_assets WHERE id=ANY($1::uuid[]) AND owner_id=$2',
          [assetIds, p.owner_id],
        )
      : [];
    return { ...p, revisions, proofs, events, templates, assets };
  }
  async preview(id: string, actor: Actor, side: string) {
    if (!['front', 'back', 'left', 'right'].includes(side))
      throw new BadRequestException('Invalid garment side');
    const r = await this.revision(id, actor);
    const [t] = await this.db.query(
      'SELECT spec FROM design_templates WHERE id=$1',
      [r.template_id],
    );
    const spec = structuredClone(t.spec) as TemplateSpec;
    const assets: Record<string, string> = {};
    for (const assetId of [
      ...new Set<string>(
        r.document.layers
          .filter((l) => l.kind === 'image')
          .map((l) => l.assetId),
      ),
    ]) {
      assets[assetId] =
        'data:image/png;base64,' +
        (await readFile(resolve(this.root(), assetId + '.png'))).toString(
          'base64',
        );
    }
    for (const [view, path] of Object.entries(spec.images)) {
      const image = await readFile(
        resolve(
          this.config.get<string>('UPLOAD_DIR', '/var/lib/teamcore/uploads'),
          path.replace('/uploads/', ''),
        ),
      );
      const ext = path.endsWith('.webp')
        ? 'webp'
        : /\.jpe?g$/.test(path)
          ? 'jpeg'
          : 'png';
      spec.images[view] =
        `data:image/${ext};base64,` + image.toString('base64');
    }
    return renderDesign(r.document, spec, side as Side, assets, 0, true);
  }
  async specification(id: string, actor: Actor) {
    const r = await this.revision(id, actor);
    const [template] = await this.db.query(
      'SELECT * FROM design_templates WHERE id=$1',
      [r.template_id],
    );
    return {
      name: r.name,
      revisionId: r.id,
      contentHash: r.content_hash,
      document: r.document,
      template,
      productionProofId: r.approved_proof_id,
      note: 'Dimensions are millimetres. Manufacture only from the current customer-approved production proof after production release.',
    };
  }
  async save(actor: Actor, dto: SaveDesignDto, id?: string) {
    this.requireEnabled();
    if (!validDocument(dto.document))
      throw new BadRequestException('Invalid design document');
    await this.activeTemplate(dto.document.templateId);
    await this.assetMap(dto.document, actor.id);
    if (!id)
      return (
        await this.db.query(
          'INSERT INTO design_projects(owner_id,name,document) VALUES($1,$2,$3) RETURNING *',
          [actor.id, dto.name, dto.document],
        )
      )[0];
    const result = await this.db.query(
      'UPDATE design_projects SET name=$1,document=$2,version=version+1,updated_at=now() WHERE id=$3 AND owner_id=$4 AND version=$5 RETURNING *',
      [dto.name, dto.document, id, actor.id, dto.version],
    );
    if (!result[1])
      throw new ConflictException(
        'This design changed in another tab. Reload its latest version or save your changes as a copy.',
      );
    return result[0][0];
  }
  async activeTemplate(id: string, manager: EntityManager = this.db.manager) {
    const [t] = await manager.query(
      `SELECT t.* FROM design_templates t JOIN products p ON p.id=t.product_id JOIN stores s ON s.id=p.store_id WHERE t.id=$1 AND t.status='published' AND p.is_active AND p.status='active' AND s.singleton_key AND s.is_active`,
      [id],
    );
    if (!t)
      throw new BadRequestException(
        'This garment template is unavailable. Save a copy using a current template.',
      );
    return t;
  }
  async assetMap(
    doc: DesignDocument,
    ownerId: string,
    manager: EntityManager = this.db.manager,
  ) {
    const ids = [
      ...new Set(
        doc.layers.filter((l) => l.kind === 'image').map((l) => l.assetId),
      ),
    ];
    const rows = ids.length
      ? await manager.query(
          'SELECT id,width,height FROM design_assets WHERE id=ANY($1::uuid[]) AND owner_id=$2',
          [ids, ownerId],
        )
      : [];
    if (rows.length !== ids.length)
      throw new BadRequestException(
        'Artwork is missing or does not belong to this account.',
      );
    return Object.fromEntries(rows.map((a) => [a.id, a]));
  }
  async upload(actor: Actor, file: Express.Multer.File) {
    if (!isDesignAdmin(actor)) this.requireEnabled();
    if (!file || file.size > 10 * 1024 * 1024)
      throw new BadRequestException(
        'Choose a PNG, JPEG or WebP image up to 10 MB.',
      );
    if (this.processing >= 1)
      throw new ServiceUnavailableException(
        'Another artwork is processing. Please retry shortly.',
      );
    this.processing++;
    const id = randomUUID();
    try {
      const [usage] = await this.db.query(
        'SELECT count(*)::int AS count,coalesce(sum(bytes),0)::bigint AS bytes FROM design_assets WHERE owner_id=$1',
        [actor.id],
      );
      if (
        usage.count >= 500 ||
        Number(usage.bytes) + file.size > 250 * 1024 * 1024
      )
        throw new BadRequestException(
          'Your artwork storage allowance is full. Contact TEAM CORE to arrange more space.',
        );
      const image = sharp(file.buffer, {
        limitInputPixels: 24000000,
        failOn: 'warning',
      });
      const meta = await image.metadata();
      if (
        !['png', 'jpeg', 'webp'].includes(meta.format) ||
        (meta.pages || 1) > 1
      )
        throw new BadRequestException(
          'Only still PNG, JPEG and WebP images are supported.',
        );
      let preview = await image
        .rotate()
        .resize({
          width: 1800,
          height: 1800,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
      // Bound normalized preview memory. Originals remain unchanged for staff.
      if (preview.length > 2 * 1024 * 1024)
        preview = await sharp(preview)
          .resize({ width: 1000, height: 1000, fit: 'inside' })
          .png({ palette: true, colours: 256 })
          .toBuffer();
      if (preview.length > 2 * 1024 * 1024)
        throw new BadRequestException('Choose a less complex artwork image.');
      await mkdir(this.root(), { recursive: true, mode: 0o700 });
      await writeFile(resolve(this.root(), id + '.original'), file.buffer, {
        flag: 'wx',
        mode: 0o600,
      });
      await writeFile(resolve(this.root(), id + '.png'), preview, {
        flag: 'wx',
        mode: 0o600,
      });
      const rotated = [5, 6, 7, 8].includes(meta.orientation);
      return (
        await this.db.query(
          `INSERT INTO design_assets(id,owner_id,width,height,original_type,bytes,checksum) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,width,height`,
          [
            id,
            actor.id,
            rotated ? meta.height : meta.width,
            rotated ? meta.width : meta.height,
            meta.format,
            file.size,
            createHash('sha256').update(file.buffer).digest('hex'),
          ],
        )
      )[0];
    } catch (e) {
      await Promise.all(
        ['.original', '.png'].map((ext) =>
          unlink(resolve(this.root(), id + ext)).catch(() => undefined),
        ),
      );
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(
        'The image could not be safely decoded or stored. Try a smaller PNG or JPEG.',
      );
    } finally {
      this.processing--;
    }
  }
  async asset(id: string, actor: Actor, original = false) {
    const [asset] = await this.db.query(
      `SELECT a.* FROM design_assets a WHERE a.id=$1 AND ($2 OR a.owner_id=$3 OR EXISTS (
      SELECT 1 FROM design_proofs f JOIN design_revisions r ON r.id=f.revision_id JOIN design_projects p ON p.id=r.project_id WHERE f.asset_id=a.id AND p.owner_id=$3))`,
      [id, isDesignAdmin(actor), actor.id],
    );
    if (!asset || (original && !isDesignAdmin(actor)))
      throw new NotFoundException();
    return readFile(
      resolve(this.root(), id + (original ? '.original' : '.png')),
    );
  }
  async submit(id: string, actor: Actor, dto: SubmitDesignDto) {
    this.requireEnabled();
    return this.db.transaction(async (m) => {
      const p = await this.project(id, actor, m, true);
      if (p.owner_id !== actor.id) throw new ForbiddenException();
      const [existing] = await m.query(
        'SELECT * FROM design_revisions WHERE submission_key=$1',
        [dto.submissionKey],
      );
      if (existing) {
        if (
          existing.project_id !== id ||
          existing.content_hash !==
            hash({
              document: p.document,
              contact: dto.contact,
              desiredDate: dto.desiredDate || null,
            })
        )
          throw new ConflictException(
            'Submission key already used for different content.',
          );
        return existing;
      }
      if (p.version !== dto.version)
        throw new ConflictException(
          'Save and review the latest design before sending.',
        );
      const t = await this.activeTemplate(p.document.templateId, m);
      const d: DesignDocument = p.document,
        s: TemplateSpec = t.spec;
      const issues = inspectDesign(d, s, await this.assetMap(d, actor.id, m));
      if (issues.some((i) => i.level === 'error'))
        throw new BadRequestException(issues.map((i) => i.message));
      if (issues.length && !dto.warningsAccepted)
        throw new BadRequestException(
          'Review and acknowledge the design warnings.',
        );
      const revisionId = randomUUID(),
        inquiryId = randomUUID();
      const c = dto.contact;
      await m.query(
        `INSERT INTO wholesale_inquiries(id,reference,customer_id,company_name,contact_name,contact_email,contact_phone,delivery_country,delivery_city,delivery_address,notes,status)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'submitted')`,
        [
          inquiryId,
          'DS-' + revisionId.slice(0, 8).toUpperCase(),
          actor.id,
          c.companyName,
          c.contactName,
          c.contactEmail,
          c.contactPhone || null,
          c.deliveryCountry,
          c.deliveryCity || null,
          c.deliveryAddress || null,
          [
            c.notes,
            dto.desiredDate
              ? `Requested delivery date: ${dto.desiredDate}`
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
        ],
      );
      const [revision] = await m.query(
        `INSERT INTO design_revisions(id,project_id,template_id,document,content_hash,inquiry_id,submission_key) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          revisionId,
          id,
          t.id,
          d,
          hash({
            document: d,
            contact: c,
            desiredDate: dto.desiredDate || null,
          }),
          inquiryId,
          dto.submissionKey,
        ],
      );
      for (const [size, quantity] of Object.entries(d.quantities).filter(
        ([, q]) => q > 0,
      )) {
        const variant = s.sizes.find(
          (v) => v.label === size && v.colour === d.colour,
        )!;
        const rows = await m.query(
          `INSERT INTO wholesale_inquiry_items(inquiry_id,variant_id,requested_quantity,sku_snapshot,product_name_snapshot,notes,design_revision_id)
          SELECT $1,v.id,$2,v.sku,p.name,$3,$4 FROM product_variants v JOIN products p ON p.id=v.product_id
          WHERE v.id=$5 AND v.is_active AND p.is_active AND p.purchase_mode<>'direct' RETURNING id`,
          [
            inquiryId,
            quantity,
            `Design: ${p.name}; Size: ${size}`,
            revisionId,
            variant.variantId,
          ],
        );
        if (!rows.length)
          throw new ConflictException('A garment size became unavailable.');
      }
      await this.event(m, revisionId, actor.id, 'submitted');
      await this.notify(
        m,
        `${revisionId}:submitted`,
        actor.id,
        'Your design request is received',
        'TEAM CORE will review your artwork and prepare a quotation.',
        id,
      );
      return revision;
    });
  }
  async revision(
    id: string,
    actor: Actor,
    m: EntityManager = this.db.manager,
    lock = false,
  ) {
    // Commerce locks inquiry -> quotation -> revision. Take the same first lock
    // before invalidating quotes so proof replacement cannot race acceptance.
    if (lock)
      await m.query(
        'SELECT id FROM wholesale_inquiries WHERE id=(SELECT inquiry_id FROM design_revisions WHERE id=$1) FOR UPDATE',
        [id],
      );
    const [r] = await m.query(
      `SELECT r.*,p.owner_id,p.name FROM design_revisions r JOIN design_projects p ON p.id=r.project_id WHERE r.id=$1 ${lock ? 'FOR UPDATE OF r' : ''}`,
      [id],
    );
    if (!r || (!isDesignAdmin(actor) && r.owner_id !== actor.id))
      throw new NotFoundException();
    return r;
  }
  async proof(id: string, actor: Actor, dto: ProofDto) {
    return this.db.transaction(async (m) => {
      const r = await this.revision(id, actor, m, true);
      if (r.production_released_at || r.state === 'ordered')
        throw new ConflictException(
          'An ordered design needs a managed amendment.',
        );
      const [asset] = await m.query(
        'SELECT id FROM design_assets WHERE id=$1 AND owner_id=$2',
        [dto.assetId, actor.id],
      );
      if (!asset)
        throw new BadRequestException(
          'Upload the proof using your staff account.',
        );
      await m.query(
        "UPDATE design_proofs SET status='superseded' WHERE revision_id=$1 AND status IN ('pending','approved')",
        [id],
      );
      const [f] = await m.query(
        'INSERT INTO design_proofs(revision_id,asset_id,notes,created_by) VALUES($1,$2,$3,$4) RETURNING *',
        [id, dto.assetId, dto.notes, actor.id],
      );
      await m.query(
        "UPDATE design_revisions SET state='proof_ready',approved_proof_id=NULL,capacity_notes=$2 WHERE id=$1",
        [id, dto.capacityNotes],
      );
      await m.query(
        "UPDATE wholesale_quotations SET status='superseded' WHERE inquiry_id=$1 AND status='sent'",
        [r.inquiry_id],
      );
      await this.event(m, id, actor.id, 'proof_ready', dto.notes);
      await this.notify(
        m,
        f.id + ':ready',
        r.owner_id,
        'Your production proof is ready',
        'Review the proof and confirm every side, size and player before approval.',
        r.project_id,
      );
      return f;
    });
  }
  async decide(proofId: string, actor: Actor, dto: DecisionDto) {
    return this.db.transaction(async (m) => {
      const [snapshot] = await m.query(
        'SELECT revision_id FROM design_proofs WHERE id=$1',
        [proofId],
      );
      if (!snapshot) throw new NotFoundException();
      const r = await this.revision(snapshot.revision_id, actor, m, true);
      if (r.owner_id !== actor.id)
        throw new ForbiddenException(
          'Only the customer can approve their proof.',
        );
      const [f] = await m.query(
        'SELECT * FROM design_proofs WHERE id=$1 FOR UPDATE',
        [proofId],
      );
      if (f.status === dto.decision && f.decided_by === actor.id) return f;
      if (f.status !== 'pending' || r.state !== 'proof_ready')
        throw new ConflictException(
          'This proof is no longer awaiting approval.',
        );
      await m.query(
        'UPDATE design_proofs SET status=$2,decided_by=$3,decision_notes=$4,decided_at=now() WHERE id=$1',
        [proofId, dto.decision, actor.id, dto.notes],
      );
      await m.query(
        'UPDATE design_revisions SET state=$2,approved_proof_id=$3 WHERE id=$1',
        [
          r.id,
          dto.decision === 'approved' ? 'approved' : 'changes_requested',
          dto.decision === 'approved' ? proofId : null,
        ],
      );
      await this.event(m, r.id, actor.id, dto.decision, dto.notes);
      await this.notify(
        m,
        proofId + ':' + dto.decision,
        actor.id,
        'Design proof response recorded',
        `Your proof was ${dto.decision}.`,
        r.project_id,
      );
      return { status: dto.decision };
    });
  }
  async changes(id: string, actor: Actor, notes: string) {
    return this.db.transaction(async (m) => {
      const r = await this.revision(id, actor, m, true);
      if (r.production_released_at || r.state === 'ordered')
        throw new ConflictException('This design is already ordered.');
      await m.query(
        "UPDATE design_revisions SET state='changes_requested',approved_proof_id=NULL WHERE id=$1",
        [id],
      );
      await m.query(
        "UPDATE design_proofs SET status='superseded' WHERE revision_id=$1 AND status IN ('pending','approved')",
        [id],
      );
      await m.query(
        "UPDATE wholesale_quotations SET status='superseded' WHERE inquiry_id=$1 AND status='sent'",
        [r.inquiry_id],
      );
      await this.event(m, id, actor.id, 'changes_requested', notes);
      await this.notify(
        m,
        randomUUID(),
        r.owner_id,
        'Your design needs a revision',
        notes,
        r.project_id,
      );
      return { status: 'changes_requested' };
    });
  }
  async release(id: string, actor: Actor) {
    return this.db.transaction(async (m) => {
      const r = await this.revision(id, actor, m, true);
      if (r.production_released_at) return r;
      const [template] = await m.query(
        'SELECT spec FROM design_templates WHERE id=$1',
        [r.template_id],
      );
      if (!template?.spec.sampleApproved)
        throw new ConflictException(
          'This design brief needs a sample-approved garment template before production. Create an approved template version and request a revised design.',
        );
      const orders = await m.query(
        `SELECT o.id FROM orders o JOIN wholesale_quotations q ON q.id=o.wholesale_quotation_id
        WHERE EXISTS(SELECT 1 FROM order_items i WHERE i.order_id=o.id AND i.design_revision_id=$1 AND i.design_proof_id=$2)
        AND q.status='accepted' AND o.status IN ('confirmed','processing')
        AND EXISTS(SELECT 1 FROM payments p WHERE p.order_id=o.id AND p.status='paid' AND p.currency=o.currency AND p.amount>=o.total_amount)
        FOR UPDATE OF o`,
        [id, r.approved_proof_id],
      );
      if (r.state !== 'ordered' || !r.capacity_notes || !orders.length)
        throw new ConflictException(
          'Production requires the matching approved proof, accepted quote, paid order and confirmed capacity.',
        );
      await m.query(
        "UPDATE design_revisions SET production_released_at=now(),state='production' WHERE id=$1",
        [id],
      );
      await this.event(m, id, actor.id, 'production_released');
      await this.notify(
        m,
        id + ':production',
        r.owner_id,
        'Your kit is entering production',
        'TEAM CORE has released your approved design for production.',
        r.project_id,
      );
      return { status: 'production' };
    });
  }
  private async event(
    m: EntityManager,
    revision: string,
    actor: string,
    kind: string,
    note: string = null,
  ) {
    await m.query(
      'INSERT INTO design_events(revision_id,actor_id,kind,note) VALUES($1,$2,$3,$4)',
      [revision, actor, kind, note],
    );
  }
  private async notify(
    m: EntityManager,
    key: string,
    user: string,
    title: string,
    message: string,
    project: string,
  ) {
    for (const staff of [false, true])
      await m.query(
        `INSERT INTO design_mail_outbox(event_key,user_id,title,message,path) VALUES($1,$2,$3,$4,$5) ON CONFLICT(event_key) DO NOTHING`,
        [
          key + (staff ? ':staff' : ':buyer'),
          staff ? null : user,
          title,
          message,
          '/account/designs/' + project,
        ],
      );
  }
}
