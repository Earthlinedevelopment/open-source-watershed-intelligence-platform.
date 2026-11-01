import {chromium,webkit,devices} from 'playwright';

const label=process.env.CLIENT||'desktop-chromium';
let browserType=chromium,ctx={viewport:{width:1440,height:900}};
if(label==='desktop-webkit')browserType=webkit;
if(label==='iphone-webkit'){browserType=webkit;ctx={...devices['iPhone 13']};}

const oldA="const g16731=earthlineLandValidityMask16584(d16731,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16731;\n            const h16731=await hydrology(d16731,g16731.mask);";
const newA="const g16731=earthlineLandValidityMask16584(d16731,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16731;\n            if(swaleJurisdictionGeometry16539){const bb16731=d16731.bounds;for(let yy16731=0;yy16731<d16731.h;yy16731++)for(let xx16731=0;xx16731<d16731.w;xx16731++){const ii16731=yy16731*d16731.w+xx16731;if(g16731.mask[ii16731]!==1)continue;const ll16731=[bb16731[0]+(xx16731/(d16731.w-1))*(bb16731[2]-bb16731[0]),bb16731[3]-(yy16731/(d16731.h-1))*(bb16731[3]-bb16731[1])];if(!earthlinePointInJurisdiction16539(ll16731,swaleJurisdictionGeometry16539))g16731.mask[ii16731]=0;}}\n            const h16731=await hydrology(d16731,g16731.mask);";
const oldB="const c16731=await makeContours(h16731,true,levels16731),s16731=await makeSwales(h16731,c16731,false,swaleJurisdictionGeometry16539,null);";
const newB="const c16731=await makeContours(h16731,true,levels16731),s16731=await makeSwales(h16731,c16731,false,null,null);";

const oldC="const g16741=earthlineLandValidityMask16584(d16741,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16741;\n            const h16741=await hydrology(d16741,g16741.mask);";
const newC="const g16741=earthlineLandValidityMask16584(d16741,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16741;\n            if(swaleJurisdictionGeometry16539){const bb16741=d16741.bounds;for(let yy16741=0;yy16741<d16741.h;yy16741++)for(let xx16741=0;xx16741<d16741.w;xx16741++){const ii16741=yy16741*d16741.w+xx16741;if(g16741.mask[ii16741]!==1)continue;const ll16741=[bb16741[0]+(xx16741/(d16741.w-1))*(bb16741[2]-bb16741[0]),bb16741[3]-(yy16741/(d16741.h-1))*(bb16741[3]-bb16741[1])];if(!earthlinePointInJurisdiction16539(ll16741,swaleJurisdictionGeometry16539))g16741.mask[ii16741]=0;}}\n            const h16741=await hydrology(d16741,g16741.mask);";
const oldD="const c16741=await makeContours(h16741,true,levels16741),s16741=await makeSwales(h16741,c16741,false,swaleJurisdictionGeometry16539,null);";
const newD="const c16741=await makeContours(h16741,true,levels16741),s16741=await makeSwales(h16741,c16741,false,null,null);";

const browser=await browserType.launch({headless:true});
const context=await browser.newContext(ctx);
const page=await context.newPage();
await page.route('https://earthlinedevelopment.org/',async route=>{
 const res=await route.fetch();let body=await res.text();
 for(const [a,b] of [[oldA,newA],[oldB,newB],[oldC,newC],[oldD,newD]]){if(!body.includes(a))throw new Error('mask owner missing '+a.slice(0,100));body=body.replace(a,b);}
 await route.fulfill({response:res,body});
});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(700);

const rows=[];
for(const q of ['Vermont','Arizona']){
 const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
 await page.locator('#searchInput').fill(q);
 const t0=Date.now();
 await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
 await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:120000});
 await page.waitForTimeout(250);
 const row=await page.evaluate(({q,t0})=>{
   const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
   const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
   let maxSlope=-Infinity;for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))maxSlope=Math.max(maxSlope,n);}
   return {q,ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,maxSlope:Number.isFinite(maxSlope)?maxSlope:null,gap:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null,coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null};
 },{q,t0});
 if(!(row.swales>0&&row.rendered>0))throw new Error(q+' blank');
 if(row.maxSlope!==null&&row.maxSlope>4)throw new Error(q+' slope');
 rows.push(row);
}
console.log('M83_LOCAL_MASK_REFINEMENT '+JSON.stringify({label,rows}));
await browser.close();
