// One Chrome mobile-viewport lab sample per site: node render.cjs > rendered.json
const {spawn} = require('node:child_process');
const {mkdtempSync, rmSync} = require('node:fs');
const {tmpdir} = require('node:os');
const {join} = require('node:path');
const {setTimeout: pause} = require('node:timers/promises');
const profile = mkdtempSync(join(tmpdir(), 'teamcore-seo-chrome-'));
const chrome = spawn(process.env.TEAMCORE_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=0', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--user-data-dir='+profile, 'about:blank'
], {stdio:['ignore','ignore','pipe'], windowsHide:true});

async function main() {
  const endpoint = await new Promise((resolve,reject)=>{
    const timer = setTimeout(()=>reject(new Error('Chrome startup timeout')),10000);
    chrome.on('error',reject);
    chrome.stderr.on('data', chunk=>{
      const m = String(chunk).match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
  });
  const base = new URL(endpoint);
  const output = [];
  for (const url of ['https://zipasports.com/','https://www.jugglesports.com/','https://www.shazbro.com/','https://ahmyzimpex.com/','https://deltacraft.biz/','https://teamcoresportswear.org/']) {
    const tab = await (await fetch('http://'+base.host+'/json/new?about:blank',{method:'PUT'})).json();
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
    let i = 0;
    const pending = new Map();
    let loaded;
    ws.onmessage = ({data})=>{
      const msg=JSON.parse(data);
      if (msg.id && pending.has(msg.id)) {pending.get(msg.id)(msg);pending.delete(msg.id);}
      if (msg.method==='Page.loadEventFired' && loaded) loaded();
    };
    const send=(method,params={})=>new Promise(resolve=>{
      pending.set(++i, resolve);
      ws.send(JSON.stringify({id:i,method,params}));
    });
    await send('Page.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled',{cacheDisabled:true});
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await send('Emulation.setTouchEmulationEnabled',{enabled:true});
    await send('Page.addScriptToEvaluateOnNewDocument',{source:`
      window.__seo={lcp:null,cls:0};
      new PerformanceObserver(l=>{for(const e of l.getEntries())window.__seo.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});
      new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__seo.cls+=e.value}).observe({type:'layout-shift',buffered:true});
    `});
    const waitLoad = new Promise(res=>loaded=res);
    await send('Page.navigate',{url});
    await Promise.race([waitLoad,pause(11500)]);
    await pause(1300);
    const {result,error} = await send('Runtime.evaluate',{returnByValue:true,expression:`JSON.stringify({
      url: location.href, title:document.title, state:document.readyState,
      headings:[...document.querySelectorAll('h1')].map(e=>e.innerText),
      bodyLength:document.body?.innerText?.length, frames:[...document.querySelectorAll('iframe')].map(e=>e.src),
      timing:window.__seo, fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      ttfb:performance.getEntriesByType('navigation')[0]?.responseStart,
      navigationStatus:performance.getEntriesByType('navigation')[0]?.responseStatus,
      forms:document.forms.length, images:document.images.length,
      links:[...document.querySelectorAll('a[href]')].map(e=>[e.innerText.trim(),e.href]).filter(([t,h])=>/whats|quote|design|order|contact|checkout/i.test(t+' '+h)).slice(0,20)
    })`});
    output.push({requested:url,...(result?.result?.value ? JSON.parse(result.result.value): {error:error||result})});
    ws.close();
    await fetch('http://'+base.host+'/json/close/'+tab.id).catch(()=>{});
  }
  console.log(JSON.stringify(output,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{
  chrome.kill();
  chrome.once('close',()=>{try{rmSync(profile,{force:true,recursive:true});}catch{}});
});
