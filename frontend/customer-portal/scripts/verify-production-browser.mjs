// Deployment smoke test. No account creation, purchase or business messages.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const origin='https://teamcoresportswear.org';
const output='../../docs/teamcore/production-20261024';
await mkdir(output,{recursive:true});
// Pin this authorized EC2 target during DNS propagation. TLS validation remains
// enabled, so the test still requires the correct certificate and server name.
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--host-resolver-rules=MAP teamcoresportswear.org 3.87.169.239, MAP admin.teamcoresportswear.org 3.87.169.239, MAP api.teamcoresportswear.org 3.87.169.239']});
const results=[];
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  for(const path of ['/','/categories','/products','/categories/soccer','/products/soccer-smsc-101','/custom-uniforms','/private-label','/wholesale','/contact','/design-studio']) {
    const response=await page.goto(origin+path);
    assert.equal(response.status(),200,path);
    await page.locator('h1').first().waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,path);
    assert.equal(await page.getByText('Local review:',{exact:true}).count(),0);
    results.push({path,status:response.status()});
  }
  await page.goto(origin);
  const hero=page.getByRole('region',{name:'Team Core uniform collections'});
  await hero.getByRole('button',{name:'Show Rugby uniforms'}).click();
  await hero.getByRole('link',{name:'Explore Rugby'}).waitFor({state:'visible'});
  assert.equal(await hero.getByRole('link',{name:'Explore Rugby'}).getAttribute('href'),'/categories/rugby');
  await hero.getByRole('button',{name:'Show Soccer uniforms'}).click();
  await page.locator('.tc-carousel img').evaluate(async image=>image.decode());
  await page.screenshot({path:output+'/storefront-desktop.png'});
  const capabilities=page.getByRole('region',{name:'Technology & Fabric Capabilities'});
  assert.equal(await capabilities.getByRole('link').count(),12);
  await capabilities.scrollIntoViewIfNeeded();
  await page.screenshot({path:output+'/capabilities-desktop.png'});
  await page.setViewportSize({width:390,height:1100});
  await page.goto(origin);
  await hero.getByRole('button',{name:'Show Soccer uniforms'}).waitFor({state:'visible'});
  await page.locator('.tc-carousel img').evaluate(async image=>image.decode());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:output+'/storefront-mobile.png'});
  await page.goto(origin+'/products/soccer-smsc-101');
  await page.locator('h1').waitFor({state:'visible'});
  await page.getByRole('button',{name:'Specification: Custom brief — sizes confirmed with quotation',exact:true}).click();
  const quantity=page.getByRole('spinbutton');
  await quantity.fill('30');
  await page.getByRole('button',{name:'Add to quote basket',exact:true}).click();
  await page.goto(origin+'/quote-basket');
  await page.getByRole('link',{name:'Request your quotation',exact:true}).waitFor({state:'visible'});
  assert.equal(await page.getByRole('spinbutton').inputValue(),'30');
  await page.goto('https://admin.teamcoresportswear.org');
  await page.getByRole('textbox',{name:/email/i}).waitFor({state:'visible'});
  await page.screenshot({path:output+'/admin-login.png'});
  const api=await context.request.get('https://api.teamcoresportswear.org/health');
  assert.equal(api.status(),200);
  assert.equal((await api.json()).database,'up');
  assert.deepEqual(errors,[]);
  await writeFile(output+'/browser-verification.json',JSON.stringify({origin,target:'3.87.169.239',dnsPinnedForPropagation:true,tlsValidation:true,publicRoutes:results,hero:true,capabilities:12,mobileOverflow:false,quoteBasket:true,adminLogin:true,apiHealth:true,pageErrors:errors},null,2));
  console.log('Production browser verification passed: public routes, responsive layout, hero, capabilities, quote basket, admin login and API health. TLS validation remained enabled.');
}finally{await browser.close();}
