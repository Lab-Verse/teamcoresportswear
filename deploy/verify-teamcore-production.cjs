// Run on the EC2 host through node --env-file=/etc/teamcore/backend.env.
// Uses the generated administrator without printing credentials or tokens.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { Client } = require('../backend/node_modules/pg');
async function main() {
  assert.equal(process.env.STOREFRONT_URL, 'https://teamcoresportswear.org');
  const base = 'http://127.0.0.1:3001';
  const get = async path => { const r = await fetch(base + path); assert.equal(r.status,200,path); return (await r.json()).data; };
  const categories = await get('/storefront/categories');
  assert.equal(categories.length,6);
  const collection = await get('/storefront/products?limit=48');
  assert.equal(collection.items.length,37);
  assert.ok(collection.items.every(p => p.purchaseMode === 'quote_only'));
  const product = await get('/storefront/products/soccer-smsc-101');
  assert.ok(product.variants.length > 0);
  assert.ok(product.variants.every(v => v.price === null));
  const templates = await get('/design-studio/templates');
  assert.equal(templates.length,1);
  assert.equal(templates[0].spec.publicationMode,'design_brief');
  assert.equal((await fetch(base + '/storefront/contacts')).status,401);
  const login = await fetch(base + '/auth/login', { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:process.env.SUPER_ADMIN_EMAIL,password:process.env.SUPER_ADMIN_PASSWORD}) });
  assert.equal(login.status,201);
  const identity = (await login.json()).data;
  assert.equal(identity.user.role,'super_admin');
  const headers={Authorization:'Bearer '+identity.accessToken};
  const contacts = await fetch(base + '/storefront/contacts',{headers});
  assert.equal(contacts.status,200);
  // Save a labelled deployment enquiry, verify through the protected API, then
  // remove only that newly-created verification row in the same operator session.
  const contact = await fetch(base + '/storefront/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Deployment verification',email:'deployment-check@example.test',subject:'Team Core deployment verification',message:'Automatic deployment verification of the contact database connection. No outbound email requested.'})});
  assert.equal(contact.status,201);
  const reference=(await contact.json()).data.reference;
  const saved=await fetch(base + '/storefront/contacts',{headers});
  assert.ok((await saved.json()).data.some(c=>c.id===reference));
  const db=new Client({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE});
  await db.connect();
  try {
    await db.query('DELETE FROM storefront_contacts WHERE id=$1 AND email=$2',[reference,'deployment-check@example.test']);
    await db.query('UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1 AND refresh_token=$2',[identity.user.id,createHash('sha256').update(identity.refreshToken).digest('hex')]);
    const count=(await db.query("SELECT (SELECT count(*) FROM users) users,(SELECT count(*) FROM orders) orders,(SELECT count(*) FROM inventory) inventory,(SELECT count(*) FROM migrations) migrations")).rows[0];
    assert.equal(Number(count.users),1);assert.equal(Number(count.orders),0);assert.equal(Number(count.inventory),0);assert.equal(Number(count.migrations),31);
  } finally {await db.end();}
  console.log('Production verification passed: 37 designs, six sports, one brief template, protected admin login, persisted contact enquiry, 31 migrations and no imported test users/orders/stock.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
