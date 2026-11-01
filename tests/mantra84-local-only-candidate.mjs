import {chromium,webkit} from 'playwright';

const REPS=[
  ["const gaps16839=rows16839.filter(r16839=>r16839.valid>=4&&r16839.opp>=3&&(r16839.opp/Math.max(1,r16839.valid))>=.45&&r16839.swales===0),groups16839=new Map();",
   "const gaps16839=rows16839.filter(r16839=>r16839.valid>=4&&r16839.opp>=3&&(r16839.opp/Math.max(1,r16839.valid))>=.18&&r16839.swales===0),groups16839=new Map();"],
  ["for(const cand16839 of arr16839.slice(0,2)){","for(const cand16839 of arr16839.slice(0,3)){"],
  ["if(selected16780.length){\n        const savedLandAudit16780=","if(false&&selected16780.length){\n        const savedLandAudit16780="],
  ["if(selected16731.length){\n        const savedLandAudit16731=","if(false&&selected16731.length){\n        const savedLandAudit16731="],
  ["if(unresolved16731.length){\n        const lateBins16741=","if(false&&unresolved16731.length){\n        const lateBins16741="]
];
async function one(bt,label,q){
 const browser=await bt.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();let body=await res.text();for(const [a,b] of REPS){if(!body.includes(a))throw new Error('owner missing '+a.slice(0,80));body=body.replace(a,b);}await route.fulfill({response:res,body});});
 await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForTimeout(900);await page.locator('#searchInput').fill(q);
 const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));const t=Date.now();
 await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
 await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:60000});
 await page.waitForTimeout(250);
 const r=await page.evaluate(t=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];let max=-Infinity;for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))max=Math.max(max,n)}return{ms:Date.now()-t,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,maxSlope:Number.isFinite(max)?max:null,supertile:window.EARTHLINE_STATEWIDE_SUPERTILE_16839||null,coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,gap:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null};},t);
 await browser.close();return{label,q,...r,errors};
}
const rows=[];
for(const q of ['Vermont','Arizona']){rows.push(await one(chromium,'chromium',q));rows.push(await one(webkit,'webkit',q));}
const failures=[];
for(const r of rows){if(!r.swales||!r.rendered)failures.push(r.label+' '+r.q+' blank');if(r.maxSlope!==null&&r.maxSlope>4)failures.push(r.label+' '+r.q+' slope');if(!r.coverage?.passed)failures.push(r.label+' '+r.q+' coverage '+JSON.stringify(r.coverage?.unresolved||[]));if(r.label==='webkit'&&r.ms>45000)failures.push(r.label+' '+r.q+' slow '+r.ms);if(r.errors.length)failures.push(r.label+' '+r.q+' errors '+JSON.stringify(r.errors));}
console.log('M84_LOCAL_ONLY '+JSON.stringify({rows,failures}));if(failures.length)process.exitCode=2;
