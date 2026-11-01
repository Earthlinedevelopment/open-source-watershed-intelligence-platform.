import {webkit} from 'playwright';
const q=process.env.Q||'Vermont',r1=Number(process.env.R1||44),r2=Number(process.env.R2||80);
const pairs=[
 ["await loadDEM(tile16731.b,48,48,8000,'coverage-gap refinement '+tile16731.id)","await loadDEM(tile16731.b,"+r1+","+r1+",8000,'coverage-gap refinement '+tile16731.id)"],
 ["await loadDEM(tile16741.b,96,96,8000,'late coverage-gap verification '+tile16741.id)","await loadDEM(tile16741.b,"+r2+","+r2+",8000,'late coverage-gap verification '+tile16741.id)"]
];
const browser=await webkit.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();let body=await res.text();for(const [a,b] of pairs){if(!body.includes(a))throw new Error('resolution owner missing '+a);body=body.replace(a,b);}await route.fulfill({response:res,body});});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForTimeout(700);await page.locator('#searchInput').fill(q);
const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));const t0=Date.now();
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:180000});
await page.waitForTimeout(250);
const out=await page.evaluate(t0=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];let max=-Infinity;for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))max=Math.max(max,n);}const cov=window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null;return{ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,maxSlope:Number.isFinite(max)?max:null,unresolved:Array.isArray(cov?.unresolved)?cov.unresolved.length:null,passed:cov?.passed===true,gap:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null};},t0);
console.log('M84_RESOLUTION_SWEEP '+JSON.stringify({q,r1,r2,...out,errors}));await browser.close();if(!out.swales||!out.rendered||out.maxSlope>4||errors.length)process.exitCode=2;
