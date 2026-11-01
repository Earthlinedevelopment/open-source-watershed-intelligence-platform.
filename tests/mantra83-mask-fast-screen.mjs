import {chromium,webkit,devices} from 'playwright';

const label=process.env.CLIENT||'desktop-chromium';
let browserType=chromium,ctx={viewport:{width:1440,height:900}};
if(label==='desktop-webkit')browserType=webkit;
if(label==='iphone-webkit'){browserType=webkit;ctx={...devices['iPhone 13']};}

const oldScreen="function screenJurisdictionCandidate16539(candidate16539){\n      if(focusMode||!jurisdictionGeometry16539)return candidate16539;";
const newScreen="function screenJurisdictionCandidate16539(candidate16539){\n      if(focusMode||!jurisdictionGeometry16539)return candidate16539;\n      if(hy&&hy.earthlineLocalJurisdictionMask16539){\n        const seg16539=Array.isArray(candidate16539&&candidate16539.segment)?candidate16539.segment:[];\n        const mask16539=hy.earthlineLocalJurisdictionMask16539;\n        const inside16539=p16539=>{const g16539=llGrid(hy,p16539);if(!g16539||!Number.isFinite(g16539.x)||!Number.isFinite(g16539.y))return false;const x16539=Math.max(0,Math.min(hy.w-1,Math.round(g16539.x))),y16539=Math.max(0,Math.min(hy.h-1,Math.round(g16539.y)));return mask16539[y16539*hy.w+x16539]===1;};\n        for(let i16539=0;i16539<seg16539.length;i16539++){if(!inside16539(seg16539[i16539]))return null;if(i16539){const a16539=seg16539[i16539-1],b16539=seg16539[i16539];for(const t16539 of [.25,.5,.75])if(!inside16539([a16539[0]+(b16539[0]-a16539[0])*t16539,a16539[1]+(b16539[1]-a16539[1])*t16539]))return null;}}\n        if(seg16539.length<2)return null;const mid16539=seg16539[Math.floor((seg16539.length-1)/2)],grid16539=llGrid(hy,mid16539);if(!grid16539)return null;return Object.assign({},candidate16539,{x:Math.max(1,Math.min(hy.w-2,Math.round(grid16539.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(grid16539.y))),jurisdiction_screened:true,jurisdiction_mask_screened:true});\n      }";

const oldH31="const h16731=await hydrology(d16731,g16731.mask);h16731.outsideLandMask16632=g16731.outsideLandMask16632||null;";
const newH31="const h16731=await hydrology(d16731,g16731.mask);h16731.earthlineLocalJurisdictionMask16539=g16731.mask;h16731.outsideLandMask16632=g16731.outsideLandMask16632||null;";
const oldH41="const h16741=await hydrology(d16741,g16741.mask);h16741.outsideLandMask16632=g16741.outsideLandMask16632||null;";
const newH41="const h16741=await hydrology(d16741,g16741.mask);h16741.earthlineLocalJurisdictionMask16539=g16741.mask;h16741.outsideLandMask16632=g16741.outsideLandMask16632||null;";

const browser=await browserType.launch({headless:true});
const context=await browser.newContext(ctx);
const page=await context.newPage();
await page.route('https://earthlinedevelopment.org/',async route=>{
 const res=await route.fetch();let body=await res.text();
 for(const [a,b] of [[oldScreen,newScreen],[oldH31,newH31],[oldH41,newH41]]){if(!body.includes(a))throw new Error('owner missing '+a.slice(0,100));body=body.replace(a,b);}
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
console.log('M83_MASK_FAST_SCREEN '+JSON.stringify({label,rows}));
await browser.close();
