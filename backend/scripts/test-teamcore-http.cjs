// Exercises real local APIs. Refuses non-loopback endpoints and business databases.
const assert=require('node:assert/strict');
const {readFile,writeFile}=require('node:fs/promises');
const {randomUUID}=require('node:crypto');
const {Client}=require('pg');
require('dotenv').config({path:'.env.local'});
const origin=process.env.REVIEW_API_URL||`http://127.0.0.1:${process.env.PORT||3011}`;
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)||process.env.DB_DATABASE!=='teamcore_redesign_test'||process.env.DB_HOST!=='127.0.0.1'||process.env.NOTIFICATION_ENABLED!=='false'||process.env.STOREFRONT_CHECKOUT_ENABLED!=='false')throw Error('Only isolated review services with payments/email disabled are allowed');
async function main(){
  const accounts=JSON.parse(await readFile('../.local/review-accounts.json','utf8'));const checks=[];
  async function call(path,method='GET',data,token,status=(method==='POST'?201:200)){const response=await fetch(origin+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(15000)});const body=await response.json();assert.equal(response.status,status,`${method} ${path}: ${body.message}`);return body.data??body;}
  const tokens={};for(const role of ['buyer','other','admin']){tokens[role]=(await call('/auth/login','POST',{email:accounts[role].email,password:accounts[role].password},null,201)).accessToken;}
  const categories=await call('/storefront/categories');assert.equal(categories.length,6);const result=await call('/storefront/products?limit=48');assert.equal(result.total,37);const p=await call('/storefront/products/soccer-smsc-101');assert.equal(p.variants.length,5);checks.push('six categories, 37 designs and real variant options');
  const variant=p.variants[0].id;const items=[{variantId:variant,quantity:15}];await call('/storefront/basket','POST',{items});await call('/storefront/basket','POST',{items:[{variantId:variant,quantity:14}]},null,400);checks.push('valid basket and rejected MOQ violation');
  await call('/storefront/checkout/preview','POST',{items,address:{shippingLine1:'Local test address',shippingCity:'Sialkot',shippingCountry:'PK'}},tokens.buyer,400);checks.push('quote-only items cannot enter direct checkout');
  const inquiry=await call('/wholesale/inquiries','POST',{companyName:'Local HTTP review',contactName:'Local Reviewer',contactEmail:accounts.buyer.email,deliveryCountry:'PK',deliveryCity:'Sialkot',deliveryAddress:'Local test address',notes:'Isolated regression request; no real manufacture.',items:[{variantId:variant,requestedQuantity:15}]},tokens.buyer,201);
  await call('/wholesale/inquiries/'+inquiry.id,'GET',null,tokens.other,403);
  const quote=await call(`/wholesale/inquiries/${inquiry.id}/quotations`,'POST',{currency:'USD',items:[{variantId:variant,quantity:15,unitPrice:18}],shippingAmount:5,taxAmount:0,terms:'Isolated test quotation only.',expiresAt:new Date(Date.now()+86400000).toISOString()},tokens.admin,201);
  const accepted=await call('/wholesale/quotations/'+quote.id+'/accept','PATCH',{},tokens.buyer);
  assert.equal(accepted.status,'accepted');
  const lookup=new Client({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE});
  await lookup.connect();
  const order=(await lookup.query('SELECT id,total_amount FROM orders WHERE wholesale_quotation_id=$1',[quote.id])).rows[0];
  await lookup.end();
  assert.equal(Number(order.total_amount),275);
  await call('/wholesale/quotations/'+quote.id+'/accept','PATCH',{},tokens.buyer,409);
  checks.push('quotation submission, ownership, explicit acceptance and duplicate acceptance safety');
  await call(`/storefront/orders/${order.id}/pay`,'POST',{},tokens.buyer,503);const state=await call(`/storefront/orders/${order.id}/payment`,'GET',null,tokens.buyer);assert.equal(state.paid,false);await call(`/storefront/orders/${order.id}/payment`,'GET',null,tokens.other,404);checks.push('payment unavailable state, unpaid order and private order access');
  const templates=await call('/design-studio/templates');assert.equal(templates.length,1);const template=templates[0];const doc={schemaVersion:1,templateId:template.id,colour:template.spec.colours[0],accent:'#c6010b',method:template.spec.methods[0],pattern:'plain',layers:[],quantities:{M:15},roster:[]};
  const project=await call('/design-studio/projects','POST',{name:'Local review design',document:doc,version:0},tokens.buyer,201);await call('/design-studio/projects/'+project.id,'GET',null,tokens.buyer);await call('/design-studio/projects/'+project.id,'GET',null,tokens.other,404);checks.push('design creation, saved document and ownership isolation');
  const db=new Client({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE});await db.connect();
  try{
    const direct=(await db.query("INSERT INTO products(store_id,name,slug,base_price,currency,is_active,requires_shipping,status,purchase_mode,minimum_order_quantity,quantity_increment) SELECT id,'Isolated direct-checkout fixture',$1,12,'USD',true,false,'active','direct',10,5 FROM stores WHERE singleton_key RETURNING id",['qa-direct-'+randomUUID()])).rows[0].id;
    const directVariant=(await db.query('INSERT INTO product_variants(product_id,sku,price,is_active) VALUES($1,$2,12,true) RETURNING id',[direct,'QA-'+randomUUID()])).rows[0].id;
    try{const address={shippingLine1:'Local test address',shippingCity:'Sialkot',shippingCountry:'PK'};const preview=await call('/storefront/checkout/preview','POST',{items:[{variantId:directVariant,quantity:10}],address},tokens.buyer);assert.equal(preview.currency,'USD');assert.equal(Number(preview.totalAmount),120);await call('/storefront/basket','POST',{items:[{variantId:directVariant,quantity:11}]},null,400);const before=(await db.query('SELECT count(*)::int AS n FROM orders')).rows[0].n;await call('/storefront/checkout','POST',{items:[{variantId:directVariant,quantity:10}],address,idempotencyKey:randomUUID()},tokens.buyer,503);assert.equal((await db.query('SELECT count(*)::int AS n FROM orders')).rows[0].n,before);checks.push('server-priced direct preview, increments and disabled checkout creates no order');}finally{await db.query('DELETE FROM products WHERE id=$1',[direct]);}
  }finally{await db.end();}
  await writeFile('../docs/teamcore/http-verification.json',JSON.stringify({checkedOn:'2026-10-13',target:'isolated loopback review API',checks},null,2));console.log(checks.join('\n'));console.log('All local HTTP regression checks passed. No real payments or outbound messages.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
