import {chromium,webkit,devices} from 'playwright';

const label=process.env.CLIENT||'desktop-chromium';
let browserType=chromium,ctx={viewport:{width:1440,height:900}};
if(label==='desktop-webkit')browserType=webkit;
if(label==='iphone-webkit'){browserType=webkit;ctx={...devices['iPhone 13']};}

const replacements=[
 ["if(!focusMode){\n      let supplementalAnchorAttempts16786=0,supplementalAnchorCandidates16786=0;",
  "if(!focusMode&&!hy.earthlineRefinementTile16731){\n      let supplementalAnchorAttempts16786=0,supplementalAnchorCandidates16786=0;"],
 ["const h16731=await hydrology(d16731,g16731.mask);h16731.outsideLandMask16632=g16731.outsideLandMask16632||null;",
  "const h16731=await hydrology(d16731,g16731.mask);h16731.earthlineRefinementTile16731=true;h16731.outsideLandMask16632=g16731.outsideLandMask16632||null;"],
 ["const h16741=await hydrology(d16741,g16741.mask);h16741.outsideLandMask16632=g16741.outsideLandMask16632||null;",
  "const h16741=await hydrology(d16741,g16741.mask);h16741.earthlineRefinementTile16731=true;h16741.outsideLandMask16632=g16741.outsideLandMask16632||null;"],
 ["if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();",
  "if((++yieldCount16661%12)===0&&!hy.earthlineRefinementTile16731)await earthlineCooperativeYield16661();"],
 ["if((++finalScreenYield16661%12)===0)await earthlineCooperativeYield16661();",
  "if((++finalScreenYield16661%12)===0&&!hy.earthlineRefinementTile16731)await earthlineCooperativeYield16661();"]
];

const browser=await browserType.launch({headless:true});
const context=await browser.newContext(ctx);
const page=await context.newPage();
await page.route('https://earthlinedevelopment.org/',async route=>{
 const res=await route.fetch();let body=await res.text();
 for(const [a,b] of replacements){if(!body.includes(a))throw new Error('owner missing '+a.slice(0,100));body=body.replace(a,b);}
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
   return {q,ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,maxSlope:Number.isFinite(maxSlope)?maxSlope:null,gap:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null};
 },{q,t0});
 if(!(row.swales>0&&row.rendered>0))throw new Error(q+' blank');
 if(row.maxSlope!==null&&row.maxSlope>4)throw new Error(q+' slope');
 rows.push(row);
}
console.log('M83_REFINEMENT_LIGHTWEIGHT '+JSON.stringify({label,rows}));
await browser.close();
