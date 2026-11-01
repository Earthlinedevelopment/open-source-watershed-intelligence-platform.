import {chromium,webkit,devices} from 'playwright';

const label=process.env.CLIENT||'desktop-chromium';
let browserType=chromium,ctx={viewport:{width:1440,height:900}};
if(label==='desktop-webkit')browserType=webkit;
if(label==='iphone-webkit'){browserType=webkit;ctx={...devices['iPhone 13']};}
const OLD="async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();if(typeof MessageChannel==='function')return new Promise(r=>{const ch=new MessageChannel();ch.port1.onmessage=()=>{try{ch.port1.close();ch.port2.close()}catch(_){}r()};ch.port2.postMessage(0)});return Promise.resolve();}";
const NEW="async function earthlineCooperativeYield16661(){return Promise.resolve();}";

const browser=await browserType.launch({headless:true});
const context=await browser.newContext(ctx);
const page=await context.newPage();
await page.route('https://earthlinedevelopment.org/',async route=>{
  const res=await route.fetch();let body=await res.text();
  if(!body.includes(OLD))throw new Error('current yield owner missing');
  body=body.replace(OLD,NEW);
  await route.fulfill({response:res,body});
});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(700);
await page.locator('#searchInput').fill('Vermont');
const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
const t0=Date.now();
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(prev=>{
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
 return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
},before,{timeout:60000});
await page.waitForTimeout(250);
const out=await page.evaluate(t0=>{
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
 const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
 const sig=fs.map(f=>{const c=f.geometry?.coordinates||[],m=c[Math.floor((c.length-1)/2)]||[];return [Number(m[0]||0).toFixed(5),Number(m[1]||0).toFixed(5),Number(f.properties?.slope_pct||0).toFixed(2)].join(',')}).sort();
 return {ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,signature:sig,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null};
},t0);
if(out.swales!==81||out.rendered!==324)throw new Error('output count changed '+JSON.stringify({label,swales:out.swales,rendered:out.rendered}));
console.log('M83_ZERO_TASK_YIELD '+JSON.stringify({label,ms:out.ms,swales:out.swales,rendered:out.rendered,signature:out.signature,perf:out.perf}));
await browser.close();
