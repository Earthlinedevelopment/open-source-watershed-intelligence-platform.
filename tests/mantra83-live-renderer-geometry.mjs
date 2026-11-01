import {chromium} from 'playwright';
import fs from 'node:fs';
const chromePath=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
if(!chromePath)throw new Error('system Chrome missing');
const browser=await chromium.launch({headless:true,executablePath:chromePath,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(500);
const out={};
for(const q of ['Arizona','Texas','Florida']){
 const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
 await page.locator('#searchInput').fill(q);
 await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
 await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});
 await page.waitForTimeout(100);
 out[q]=await page.evaluate(()=>{
   const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
   const cores=[...document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path.earthline-swale-core-16168')];
   const lens=cores.map(p=>{try{return p.getTotalLength()}catch(_){return 0}}).sort((a,b)=>a-b);
   const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
   let maxSlope=-Infinity;for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))maxSlope=Math.max(maxSlope,n);}
   return {scienceCount:Number(d?.derived?.swaleOpportunityLines||0),renderedCoreCount:cores.length,maxPx:Number((lens.at(-1)||0).toFixed(1)),p95Px:Number((lens[Math.floor(lens.length*.95)]||0).toFixed(1)),maxSlope:Number.isFinite(maxSlope)?maxSlope:null};
 });
 if(out[q].scienceCount!==out[q].renderedCoreCount)throw new Error(q+' count mismatch');
 if(out[q].maxSlope!==null&&out[q].maxSlope>4)throw new Error(q+' slope '+out[q].maxSlope);
 if(out[q].maxPx>6)throw new Error(q+' visible corridor still too long '+out[q].maxPx);
}
console.log('M83_LIVE_RENDERER_GEOMETRY_PASS '+JSON.stringify(out));
await browser.close();
