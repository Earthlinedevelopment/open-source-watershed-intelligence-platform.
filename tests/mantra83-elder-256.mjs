import {chromium} from 'playwright';
import fs from 'node:fs';
const paths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=paths.find(p=>fs.existsSync(p));
if(!executablePath)throw new Error('system Chrome missing');

const workerOld='if(aspect>=1){ow=1024;oh=Math.max(32,Math.round(1024/aspect))}\n  else{oh=1024;ow=Math.max(32,Math.round(1024*aspect))}';
function workerNew(size){return 'if(aspect>=1){ow='+size+';oh=Math.max(32,Math.round('+size+'/aspect))}\n  else{oh='+size+';ow=Math.max(32,Math.round('+size+'*aspect))}'}
async function run(size){
 const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 if(size!==1024)await context.route('**/earthline-elder-worker-17129.js*',async route=>{const res=await route.fetch();let body=await res.text();if(!body.includes(workerOld))throw new Error('worker owner missing');body=body.replace(workerOld,workerNew(size));await route.fulfill({response:res,body});});
 const page=await context.newPage();await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForTimeout(700);
 const t0=Date.now();await page.locator('#searchInput').fill('61 Sleepy Hollow Rd Essex Vermont');await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
 await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.tier||'').toLowerCase()==='property',{timeout:90000});
 const propertyMs=Date.now()-t0;await page.waitForFunction(()=>Number(window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()?.length||0)>0,{timeout:30000});const elderMs=Date.now()-t0;
 const features=await page.evaluate(()=>(window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()||[]).map(f=>({lng:f.geometry?.coordinates?.[0],lat:f.geometry?.coordinates?.[1],confidence:f.properties?.elder_tree_confidence_pct,h:f.properties?.height_m})));
 await browser.close();return {size,propertyMs,elderMs,count:features.length,features};
}
function hav(a,b){const R=6371008.8,p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180,dp=(b.lat-a.lat)*Math.PI/180,dl=(b.lng-a.lng)*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))}
const base=await run(512),small=await run(256);
const nearest=base.features.map(a=>Math.min(...small.features.map(b=>hav(a,b)))).sort((a,b)=>a-b);
const match={medianM:nearest[Math.floor(nearest.length/2)]||0,p95M:nearest[Math.floor(nearest.length*.95)]||0,maxM:nearest.at(-1)||0};
console.log('M83_ELDER_256 '+JSON.stringify({base:{size:base.size,propertyMs:base.propertyMs,elderMs:base.elderMs,count:base.count},small:{size:small.size,propertyMs:small.propertyMs,elderMs:small.elderMs,count:small.count},match}));
if(small.count<12)throw new Error('too few candidates '+small.count);
if(match.medianM>20||match.p95M>60)throw new Error('locations diverged '+JSON.stringify(match));
