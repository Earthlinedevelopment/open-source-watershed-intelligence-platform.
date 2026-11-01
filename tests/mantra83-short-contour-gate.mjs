import {chromium} from 'playwright';
import fs from 'node:fs';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw new Error('system Chrome missing');

const OLD16="const coords=f.geometry.coordinates;if(coords.length<16)continue;";
const NEW8="const coords=f.geometry.coordinates;if(coords.length<8)continue;";
const OLD12="for(const f of lines){const coords=f.geometry.coordinates;if(coords.length<12)continue;";
const NEW12="for(const f of lines){const coords=f.geometry.coordinates;if(coords.length<8)continue;";

async function suite(modified){
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 if(modified)await page.route('https://earthlinedevelopment.org/',async route=>{
   const res=await route.fetch();let body=await res.text();
   const n16=body.split(OLD16).length-1;if(n16<2)throw new Error('short-contour 16-point owners missing '+n16);
   body=body.replaceAll(OLD16,NEW8);
   if(!body.includes(OLD12))throw new Error('short-contour relaxed owner missing');
   body=body.replace(OLD12,NEW12);
   await route.fulfill({response:res,body});
 });
 await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForTimeout(800);
 const out={};
 for(const q of ['Vermont','California','Arizona','Texas']){
   const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
   await page.locator('#searchInput').fill(q);
   await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
   await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});
   await page.waitForTimeout(150);
   out[q]=await page.evaluate(()=>{
     const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
     const a=window.EARTHLINE_STANDARD_AUDIT_16784||null;
     const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
     const c=a?.rankedCauses?.find(x=>x.id==='candidate-generation')?.metrics||{};
     const land=a?.rankedCauses?.find(x=>x.id==='land-water-exclusions')||{};
     return {
       swales:Number(d?.derived?.swaleOpportunityLines||0),
       maxSlope:Math.max(0,...fs.map(f=>Number(f?.properties?.slope_pct)||0)),
       candidateCells:Number(c.candidateCells||0),
       opportunityCells:Number(c.opportunityCells||0),
       missing:Number(c.missingCandidateCells||0),
       unsafe:Number(land?.metrics?.unsafeSegments||0),
       auditPass:a?.pass===true
     };
   });
 }
 await browser.close();return out;
}
const base=await suite(false),candidate=await suite(true);
for(const q of Object.keys(base)){
 const b=base[q],c=candidate[q];
 if(c.maxSlope>4||c.unsafe!==0)throw new Error(q+' science safety regression '+JSON.stringify(c));
 if(c.candidateCells<b.candidateCells)throw new Error(q+' candidate coverage worsened');
 if(c.missing>b.missing)throw new Error(q+' missing opportunity coverage worsened');
}
if(!(candidate.California.candidateCells>base.California.candidateCells))throw new Error('California candidate coverage did not improve');
if(!(candidate.Texas.candidateCells>base.Texas.candidateCells))throw new Error('Texas candidate coverage did not improve');
console.log('M83_SHORT_CONTOUR_GATE '+JSON.stringify({base,candidate}));
