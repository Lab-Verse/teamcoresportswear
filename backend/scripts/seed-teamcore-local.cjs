// Review catalogue only. Never writes to an existing business/production database.
const { Client } = require('pg');
const { randomBytes } = require('crypto');
const { readFile, writeFile, mkdir } = require('fs/promises');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
require('dotenv').config({ path: '.env.local' });
const { validTemplate } = require('../dist/src/modules/design-studio/design-contract');
const { garmentPaths } = require('../dist/src/modules/design-studio/garment-geometry');
async function main(){
  if(process.env.DB_HOST!=='127.0.0.1'||process.env.DB_DATABASE!=='teamcore_redesign_test'||!['55443','55439'].includes(process.env.DB_PORT))throw Error('Use the isolated Team Core review database');
  const db=new Client({host:'127.0.0.1',port:Number(process.env.DB_PORT),user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,database:process.env.DB_DATABASE});await db.connect();
  const manifest=JSON.parse(await readFile('../docs/teamcore/reference/prepared-assets.json','utf8'));
  const password=randomBytes(24).toString('hex');const passwordHash=await bcrypt.hash(password,10);
  const accounts={};const products=[];
  await db.query('BEGIN');
  try{
    for(const [key,email,role] of [['buyer','buyer@teamcore.example','customer'],['other','other@teamcore.example','customer'],['admin','admin@teamcore.example','super_admin']]){
      const r=await db.query('INSERT INTO roles(name,is_system) VALUES($1,true) ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id',[role]);
      const u=await db.query("INSERT INTO users(email,password_hash,first_name,last_name,is_email_verified) VALUES($1,$2,'Local','Reviewer',true) ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash RETURNING id",[email,passwordHash]);
      await db.query('INSERT INTO user_roles(user_id,role_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[u.rows[0].id,r.rows[0].id]);accounts[key]={id:u.rows[0].id,email,password};
    }
    const store=await db.query("INSERT INTO stores(name,slug,is_active,logo_url) VALUES('Team Core Sports Wear','team-core-sports-wear',true,'/teamcore/logo.png') ON CONFLICT(singleton_key) DO UPDATE SET name=EXCLUDED.name RETURNING id");
    const sizeKey=(await db.query("INSERT INTO attribute_keys(name,slug,input_type) VALUES('Size','size','select') ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id")).rows[0].id;
    const sizes={};for(const [n,label] of ['S','M','L','XL','2XL'].entries()){sizes[label]=(await db.query('INSERT INTO attribute_values(attribute_key_id,value,display_value,sort_order) VALUES($1,$2,$2,$3) ON CONFLICT(attribute_key_id,value) DO UPDATE SET display_value=EXCLUDED.display_value RETURNING id',[sizeKey,label,n])).rows[0].id;}
    const wh=(await db.query("INSERT INTO warehouses(code,name,line1,city,country) VALUES('LOCAL-TEAMCORE','Isolated review stock','Local test location','Sialkot','PK') ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name RETURNING id")).rows[0].id;
    const groups={ 'american-football':[[0],[1],[2],[3],[4],[5],[6],[7]],baseball:[[0],[1],[2],[3],[4],[5],[7]],basketball:[[0,1,2],[3,4],[5,6],[7]],'ice-hockey':[[0,1,2,3],[4,5,6,7]],rugby:[[0],[1],[2],[3],[4],[5],[6],[7]],soccer:[[0],[1],[2],[3],[4],[5],[6],[7]] };
    for(const [category,sets] of Object.entries(groups)){
      const assets=manifest.assets.filter(a=>a.category===category&&a.local);
      const name=category.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join(' ');
      const cat=(await db.query('INSERT INTO categories(name,slug,image_url,sort_order,is_active) VALUES($1,$2,$3,$4,true) ON CONFLICT(slug) DO UPDATE SET image_url=EXCLUDED.image_url RETURNING id',[name,category,assets[0].local,Object.keys(groups).indexOf(category)])).rows[0].id;
      for(const indexes of sets){
        const gallery=indexes.map(i=>assets.find(a=>a.index===i)).filter(Boolean);if(!gallery.length)continue;
        const reference=gallery[0];const code=reference.alt.match(/SM[A-Z]+-\d+/)?.[0];const productName=reference.alt.replace(/\sSM[A-Z]+-\d+$/,'');
        const slug=category+'-'+(code||indexes[0]).toLowerCase();
        const p=(await db.query("INSERT INTO products(store_id,category_id,name,slug,short_desc,full_desc,base_price,currency,is_active,requires_shipping,status,purchase_mode,minimum_order_quantity,quantity_increment) VALUES($1,$2,$3,$4,$5,$6,0,'USD',true,true,'active','quote_only',15,1) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id",[store.rows[0].id,cat,productName,slug,'Custom uniform design. Discuss your team artwork, sizing and quantities.','<p>Source-reference design for local review. Product specifications, size measurements, minimums and commercial pricing must be confirmed before publication.</p>'])).rows[0].id;
        await db.query('DELETE FROM product_images WHERE product_id=$1',[p]);for(const [i,a] of gallery.entries())await db.query('INSERT INTO product_images(product_id,url,alt_text,sort_order,is_primary) VALUES($1,$2,$3,$4,$5)',[p,a.local,a.alt,i,i===0]);
        const variants=[];for(const label of Object.keys(sizes)){
          const v=(await db.query('INSERT INTO product_variants(product_id,sku,price,weight_grams,is_active) VALUES($1,$2,NULL,500,true) ON CONFLICT(sku) DO UPDATE SET is_active=true RETURNING id',[p,'TC-'+code+'-'+label])).rows[0].id;
          await db.query('INSERT INTO variant_attribute_values(variant_id,attribute_key_id,attribute_value_id) VALUES($1,$2,$3) ON CONFLICT(variant_id,attribute_key_id) DO UPDATE SET attribute_value_id=EXCLUDED.attribute_value_id',[v,sizeKey,sizes[label]]);
          await db.query('INSERT INTO inventory(warehouse_id,variant_id,qty_on_hand) VALUES($1,$2,10000) ON CONFLICT(warehouse_id,variant_id) DO NOTHING',[wh,v]);variants.push({label,variantId:v,colour:'#ffffff'});
        }
        products.push({id:p,slug,category,source:reference.url,gallery:gallery.map(a=>a.url),variants});
      }
    }
    const studioProduct=products.find(p=>p.category==='soccer');
    const uploadRoot=process.env.UPLOAD_DIR||'../.local/uploads';await mkdir(uploadRoot+'/products',{recursive:true});
    for(const side of ['front','back']){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="650"><path d="${garmentPaths.tee}" fill="#ffffff" stroke="#b7bbc4" stroke-width="2"/></svg>`;await sharp(Buffer.from(svg)).png().toFile(uploadRoot+'/products/teamcore-brief-'+side+'.png');}
    const spec={garment:'tee',publicationMode:'design_brief',fabric:'Confirm fabric with your quotation',fit:'Confirm measurements before production',neckline:'Confirm neckline with your quotation',sizeGuide:'Local review template. Request product-specific measurements.',colours:['#ffffff'],methods:['Sublimation'],patterns:['plain','stripe','chevron','diagonal','hoops','split','dots'],sizes:studioProduct.variants,zones:[{id:'front',label:'Front artwork',side:'front',width:300,height:380,x:190,y:140,previewWidth:220,previewHeight:350},{id:'back',label:'Back artwork',side:'back',width:300,height:380,x:190,y:140,previewWidth:220,previewHeight:350}],images:{front:'/uploads/products/teamcore-brief-front.png',back:'/uploads/products/teamcore-brief-back.png'},minimumQuantity:15,increment:1,minimumDpi:150,fulfilment:'made_to_order',productionNotes:'Design brief for isolated local review. Production proof and commercial details need explicit agreement.',sampleApproved:false};
    if(!validTemplate(spec))throw Error('Invalid local design template');
    let template=(await db.query("SELECT id FROM design_templates WHERE name='Team Core custom team jersey'")).rows[0];if(!template)template=(await db.query("INSERT INTO design_templates(name,product_id,spec,status,created_by) VALUES('Team Core custom team jersey',$1,$2,'published',$3) RETURNING id",[studioProduct.id,spec,accounts.admin.id])).rows[0];
    await db.query('COMMIT');
    await mkdir('../.local',{recursive:true});await writeFile('../.local/review-accounts.json',JSON.stringify(accounts));await writeFile('../docs/teamcore/reference/local-catalogue-map.json',JSON.stringify({mode:'isolated local review; not a production import',categories:6,designs:products.length,products,templateId:template.id},null,2));
    console.log(`Seeded ${products.length} quote-only uniform designs, six sports and one design-brief template in the isolated local database. No commercial prices or live payments imported.`);
  }catch(e){await db.query('ROLLBACK');throw e;}finally{await db.end();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
