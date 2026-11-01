import {chromium} from 'playwright';
import fs from 'node:fs';
const paths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=paths.find(p=>fs.existsSync(p));
if(!executablePath)throw new Error('system Chrome missing');

async function run(size){
 const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 if(size!==1024){
   await context.route('**/earthline-elder-worker-17129.js*',async route=>{
     const res=await route.fetch();let body=await res.text();
     const old='if(aspect>=1){ow=1024;oh=Math.max(32,Math.round(1024/aspect))}\n  else{oh=1024;ow=Math.max(32,Math.round(1024*aspect))}';
     const neu='if(aspect>=1){ow='+size+';oh=Math.max(32,Math.round('+size+'/aspect))}\n  else{oh='+size+';ow=Math.max(32,Math.round('+size+'*aspect))}';
     if(!body.includes(old))throw new Error('screen raster owner missing');
     body=body.replace(old,neu);
     await route.fulfill({response:res,body});
   });
 }
 const page=await context.newPage();
 await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForTimeout(1000);
 const t0=Date.now();
 await page.locator('#searchInput').fill('61 Sleepy Hollow Rd Essex Vermont');
 await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
 await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.tier||'').toLowerCase()==='property',{timeout:90000});
 const propertyMs=Date.now()-t0;
 await page.waitForFunction(()=>Number(window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()?.length||0)>0,{timeout:30000});
 const elderMs=Date.now()-t0;
 const result=await page.evaluate(()=>({features:(window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()||[]).map(f=>({lng:f.geometry?.coordinates?.[0],lat:f.geometry?.coordinates?.[1],h:f.properties?.height_m,confidence:f.properties?.elder_tree_confidence_pct,cohort:f.properties?.elder_cohort})),last:window.EARTHLINE_ELDER_TREE_LAST_17097||null}));
 await browser.close();
 return {size,propertyMs,elderMs,afterPropertyMs:elderMs-propertyMs,count:result.features.length,last:result.last,features:result.features};
}
const baseline=await run(1024);
const candidate=await run(512);
console.log('M83_ELDER_SCREEN512 '+JSON.stringify({baseline:{size:baseline.size,propertyMs:baseline.propertyMs,elderMs:baseline.elderMs,afterPropertyMs:baseline.afterPropertyMs,count:baseline.count},candidate:{size:candidate.size,propertyMs:candidate.propertyMs,elderMs:candidate.elderMs,afterPropertyMs:candidate.afterPropertyMs,count:candidate.count,last:candidate.last}}));
if(candidate.count<12)throw new Error('candidate Elder count too low '+candidate.count);
if(candidate.elderMs>=baseline.elderMs*.8)throw new Error('candidate did not materially improve Elder time');
