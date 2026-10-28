import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';
const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const cases=[
 {label:'MONTANA',query:'Montana',lng:-111.90265,lat:46.13312},
 {label:'NORTH-CAROLINA',query:'North Carolina',lng:-83.48049,lat:35.21261}
];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831}});
await installCandidateOrigin(context);
const page=await context.newPage();
const rows=[];
for(const c of cases){
 await page.goto(BASE+'?zero_diag='+encodeURIComponent(c.label)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
   await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click()); await page.waitForTimeout(150);
 }
 await page.locator('#searchInput').fill(c.query); await page.waitForTimeout(700);
 const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:new RegExp(c.query,'i')}).first();
 if(await opt.count()) await opt.click().catch(()=>{});
 await page.evaluate(()=>document.getElementById('runBtn')?.click());
 await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:150});
 await page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.59});try{m.fire?.('dragend')}catch(_){}},c);
 await page.waitForFunction(t=>{const p=window.EARTHLINE_PROPERTY_TARGET_16201||null;return !!p&&Math.abs(Number(p.lng)-t.lng)<.00008&&Math.abs(Number(p.lat)-t.lat)<.00008},c,{timeout:15000,polling:100});
 const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
 await page.locator('#earthlineDeclareProperty16169').click();
 await page.waitForFunction(prev=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>prev,before,{timeout:90000,polling:120});
 await page.waitForTimeout(1200);
 rows.push(await page.evaluate(label=>{
   const md=(typeof M!=='undefined'&&M)||window.M||{}, d=md.swaleDiagnostics||{}, st=d.stage||{}, lf=d.levelGenerator||{};
   const reasons={}; for(const x of (md.flowFirstPlacement15836?.unserved||[])) reasons[x.reason]=(reasons[x.reason]||0)+1;
   return {label,
     zeroReason:md.prescriptionZeroReason15870||null,
     swales:Number(md.authoritativeSafeSwales15815?.features?.length||0),
     usable:Number(d.usable||0), slopeSafe:Number(d.slopeSafe||0), noBuild:Number(d.noBuild||0),
     stage:st, levelGenerator:lf,
     flow:{eligible:Number(md.flowFirstPlacement15836?.eligiblePaths||0),served:Number(md.flowFirstPlacement15836?.pathsServed||0),unserved:Number(md.flowFirstPlacement15836?.unserved?.length||0),reasons},
     meta:md.swaleMeta||null
   };
 },c.label));
}
console.log('EARTHLINE_ZERO_RUNTIME_DIAG '+JSON.stringify(rows));
await browser.close();
