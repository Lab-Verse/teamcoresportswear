// Explicit first publication of the owner's source catalogue; no review users,
// sales, payments, invented prices, warehouse stock or production-approved sizing.
const { Client } = require('pg');
const { readFile, mkdir } = require('node:fs/promises');
const { resolve } = require('node:path');
const sharp = require('sharp');
const { validTemplate } = require('../dist/src/modules/design-studio/design-contract');
const { garmentPaths } = require('../dist/src/modules/design-studio/garment-geometry');

async function main() {
  if (process.env.NODE_ENV !== 'production' || process.env.DB_HOST !== '127.0.0.1' || process.env.DB_DATABASE !== 'teamcore' || process.env.STOREFRONT_URL !== 'https://teamcoresportswear.org') throw Error('Use the authorized Team Core production database and domain.');
  const manifest = JSON.parse(await readFile(resolve(__dirname, '../../docs/teamcore/reference/prepared-assets.json'), 'utf8'));
  const db = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE });
  await db.connect();
  await db.query('BEGIN');
  try {
    if (Number((await db.query('SELECT count(*) FROM products')).rows[0].count)) throw Error('This first-publication import requires an empty catalogue. Existing business products are preserved.');
    const admin = (await db.query('SELECT id FROM users WHERE email=$1', [process.env.SUPER_ADMIN_EMAIL])).rows[0];
    if (!admin) throw Error('Initialize the protected administrator first.');
    const store = (await db.query("INSERT INTO stores(name,slug,description,logo_url,is_active,singleton_key) VALUES('Team Core Sports Wear','team-core-sports-wear','Custom team uniforms and private-label enquiries.','/teamcore/logo.png',true,true) ON CONFLICT(singleton_key) DO UPDATE SET name=EXCLUDED.name,logo_url=EXCLUDED.logo_url RETURNING id")).rows[0];
    const key = (await db.query("INSERT INTO attribute_keys(name,slug,input_type) VALUES('Specification','specification','select') ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id")).rows[0];
    const option = (await db.query("INSERT INTO attribute_values(attribute_key_id,value,display_value,sort_order) VALUES($1,'custom-brief','Custom brief — sizes confirmed with quotation',0) ON CONFLICT(attribute_key_id,value) DO UPDATE SET display_value=EXCLUDED.display_value RETURNING id", [key.id])).rows[0];
    const groups = { 'american-football': [[0],[1],[2],[3],[4],[5],[6],[7]], baseball: [[0],[1],[2],[3],[4],[5],[7]], basketball: [[0,1,2],[3,4],[5,6],[7]], 'ice-hockey': [[0,1,2,3],[4,5,6,7]], rugby: [[0],[1],[2],[3],[4],[5],[6],[7]], soccer: [[0],[1],[2],[3],[4],[5],[6],[7]] };
    const products = [];
    for (const [sortOrder, [category, sets]] of Object.entries(groups).entries()) {
      const assets = manifest.assets.filter(a => a.category === category && a.local);
      if (!assets.length) throw Error('Missing verified category assets: ' + category);
      const name = category.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ');
      const cat = (await db.query('INSERT INTO categories(name,slug,image_url,sort_order,is_active) VALUES($1,$2,$3,$4,true) RETURNING id', [name, category, assets[0].local, sortOrder])).rows[0];
      for (const indexes of sets) {
        const gallery = indexes.map(i => assets.find(a => a.index === i)).filter(Boolean);
        if (!gallery.length) continue;
        const reference = gallery[0];
        const code = reference.alt.match(/SM[A-Z]+-\d+/)?.[0];
        if (!code) throw Error('Source product identity is required.');
        const name = reference.alt.replace(/\sSM[A-Z]+-\d+$/, '');
        const slug = category + '-' + code.toLowerCase();
        const p = (await db.query("INSERT INTO products(store_id,category_id,name,slug,short_desc,full_desc,base_price,currency,is_active,requires_shipping,status,purchase_mode,minimum_order_quantity,quantity_increment) VALUES($1,$2,$3,$4,$5,$6,0,'USD',true,true,'active','quote_only',1,1) RETURNING id", [store.id, cat.id, name, slug, 'Custom uniform design. Request a quotation for your team artwork, sizes and quantity.', '<p>Explore this Team Core Sports Wear uniform design as a starting point for your team. Share your artwork, player roster, size measurements, quantities and destination.</p><p>Fabric, construction, decoration, minimum production quantity, pricing and delivery are confirmed in your reviewed quotation. Submitted quantities are enquiry quantities; no stock availability or production commitment is implied.</p>'])).rows[0];
        for (const [i,a] of gallery.entries()) await db.query('INSERT INTO product_images(product_id,url,alt_text,sort_order,is_primary) VALUES($1,$2,$3,$4,$5)', [p.id, a.local, a.alt, i, i === 0]);
        const variant = (await db.query('INSERT INTO product_variants(product_id,sku,price,is_active) VALUES($1,$2,NULL,true) RETURNING id', [p.id, 'TC-' + code + '-BRIEF'])).rows[0];
        await db.query('INSERT INTO variant_attribute_values(variant_id,attribute_key_id,attribute_value_id) VALUES($1,$2,$3)', [variant.id, key.id, option.id]);
        products.push({ id: p.id, slug, category, variantId: variant.id });
      }
    }
    const uploadRoot = process.env.UPLOAD_DIR;
    await mkdir(uploadRoot + '/products', { recursive: true });
    for (const side of ['front','back']) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="650"><path d="${garmentPaths.tee}" fill="#ffffff" stroke="#b7bbc4" stroke-width="2"/></svg>`;
      await sharp(Buffer.from(svg)).png().toFile(uploadRoot + '/products/teamcore-brief-' + side + '.png');
    }
    const product = products.find(p => p.category === 'soccer');
    const spec = { garment: 'tee', publicationMode: 'design_brief', fabric: 'Confirm fabric with your quotation', fit: 'Confirm measurements before production', neckline: 'Confirm neckline with your quotation', sizeGuide: 'Design brief only. Share your size breakdown and measurements with your enquiry.', colours: ['#ffffff'], methods: ['Sublimation'], patterns: ['plain','stripe','chevron','diagonal','hoops','split','dots'], sizes: [{ label: 'Custom brief', colour: '#ffffff', variantId: product.variantId }], zones: [{ id: 'front', label: 'Front artwork', side: 'front', width: 300, height: 380, x: 190, y: 140, previewWidth: 220, previewHeight: 350 }, { id: 'back', label: 'Back artwork', side: 'back', width: 300, height: 380, x: 190, y: 140, previewWidth: 220, previewHeight: 350 }], images: { front: '/uploads/products/teamcore-brief-front.png', back: '/uploads/products/teamcore-brief-back.png' }, minimumQuantity: 1, increment: 1, minimumDpi: 150, fulfilment: 'made_to_order', productionNotes: 'This is an artwork brief, not a production-ready garment. Measurements, minimum production quantity and commercial terms require an agreed quotation and production proof.', sampleApproved: false };
    if (!validTemplate(spec)) throw Error('Invalid design-brief template.');
    await db.query("INSERT INTO design_templates(name,product_id,spec,status,created_by) VALUES('Team Core custom uniform brief',$1,$2,'published',$3)", [product.id, spec, admin.id]);
    await db.query('COMMIT');
    console.log(`Published ${products.length} quote-only source designs, six sports and one artwork-brief template. No test accounts, prices or stock imported.`);
  } catch (error) { await db.query('ROLLBACK'); throw error; } finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
