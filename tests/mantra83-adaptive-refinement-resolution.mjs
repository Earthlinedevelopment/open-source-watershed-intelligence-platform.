import {chromium,webkit,devices} from 'playwright';

const label=process.env.CLIENT||'desktop-chromium';
let browserType=chromium,ctx={viewport:{width:1440,height:900}};
if(label==='desktop-webkit')browserType=webkit;
if(label==='iphone-webkit'){browserType=webkit;ctx={...devices['iPhone 13']};}
const pairs=[
 ["await loadDEM(tile16731.b,48,48,8000,'coverage-gap refinement '+tile16731.id)","await loadDEM(tile16731.b,32,32,8000,'coverage-gap refinement '+tile16731.id)"],
 ["await loadDEM(tile16741.b,96,96,8000,'late coverage-gap verification '+tile16741.id)","await loadDEM(tile16741.b,48,48,8000,'late coverage-gap verification '+tile16741.id)"]
];
const browser=await browserType.launch({headless:true});
const context=await browser.newContext(ctx);
const page=await context.newPage();
await page.route('https://earthlinedevelopment.org/',async route=>{
 const res=await route.fetch();let body=await res.text();
 for(const [a,b] of pairs){if(!body.includes(a))throw new Error('resolution owner missing '+a);body=body.replace(a,b);}
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
},before,{timeout:90000});
await page.waitForTimeout(250);
const out=await page.evaluate(t0=>{
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
 const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
 let maxSlope=-Infinity;
 for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))maxSlope=Math.max(maxSlope,n);}
 return {
   ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),
   rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
   maxSlope:Number.isFinite(maxSlope)?maxSlope:null,
   coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,
   gap:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,
   late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null,
   perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null
 };
},t0);
if(!(out.swales>0&&out.rendered>0))throw new Error('blank output');
if(out.maxSlope!==null&&out.maxSlope>4)throw new Error('slope violation '+out.maxSlope);
if(out.coverage&&out.coverage.passed!==true)throw new Error('coverage failed '+JSON.stringify(out.coverage.unresolved||[]));
console.log('M83_ADAPTIVE_RESOLUTION '+JSON.stringify({label,...out}));
await browser.close();
