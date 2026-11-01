import {chromium,webkit,devices} from 'playwright';
const OLD="async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();return new Promise(r=>setTimeout(r,0));}";
const NEW="async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();if(typeof MessageChannel==='function')return new Promise(r=>{const ch=new MessageChannel();ch.port1.onmessage=()=>{try{ch.port1.close();ch.port2.close()}catch(_){}r()};ch.port2.postMessage(0)});return Promise.resolve();}";

async function run(browserType,label,contextOpts){
  const browser=await browserType.launch({headless:true});
  const context=await browser.newContext(contextOpts);
  const page=await context.newPage();
  await page.route('https://earthlinedevelopment.org/',async route=>{
    const res=await route.fetch(); let body=await res.text();
    if(!body.includes(OLD))throw new Error('yield helper owner missing');
    body=body.replace(OLD,NEW);
    await route.fulfill({response:res,body});
  });
  await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForTimeout(900);
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill('Vermont');
  const t0=Date.now();
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
  },before,{timeout:60000});
  await page.waitForTimeout(300);
  const r=await page.evaluate(t0=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    const sig=fs.map(f=>{const c=f.geometry?.coordinates||[],m=c[Math.floor((c.length-1)/2)]||[];return [Number(m[0]||0).toFixed(5),Number(m[1]||0).toFixed(5),Number(f.properties?.slope_pct||0).toFixed(2)].join(',')}).sort();
    return {ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,signature:sig};
  },t0);
  await browser.close();
  return {label,...r};
}
const rows=[];
rows.push(await run(chromium,'desktop-chromium',{viewport:{width:1440,height:900}}));
rows.push(await run(webkit,'desktop-webkit',{viewport:{width:1440,height:900}}));
rows.push(await run(webkit,'iphone-webkit',{...devices['iPhone 13']}));
for(const r of rows){if(r.swales!==81||r.rendered!==324)throw new Error(r.label+' output changed '+JSON.stringify(r));}
if(JSON.stringify(rows[0].signature)!==JSON.stringify(rows[1].signature)||JSON.stringify(rows[0].signature)!==JSON.stringify(rows[2].signature))throw new Error('cross-browser science signature changed');
console.log('M83_MESSAGECHANNEL_YIELD_PASS '+JSON.stringify(rows.map(({signature,...x})=>x)));
