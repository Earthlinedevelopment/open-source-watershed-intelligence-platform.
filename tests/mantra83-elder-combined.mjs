import {chromium} from 'playwright';
import fs from 'node:fs';
const paths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=paths.find(p=>fs.existsSync(p));
if(!executablePath)throw new Error('system Chrome missing');

const setter="window.EARTHLINE_PROPERTY_TARGET_16201={lng:Number(target.lng),lat:Number(target.lat),source:String(target.source||'crosshair'),code:target.code?String(target.code):'',score:Number(target.score||0),parentRunToken:parentRunToken16347||'',at:new Date().toISOString()};";
const setterNew=setter+"try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}";
const workerOld='if(aspect>=1){ow=1024;oh=Math.max(32,Math.round(1024/aspect))}\n  else{oh=1024;ow=Math.max(32,Math.round(1024*aspect))}';
const workerNew='if(aspect>=1){ow=512;oh=Math.max(32,Math.round(512/aspect))}\n  else{oh=512;ow=Math.max(32,Math.round(512*aspect))}';

const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:900}});
await context.route('https://earthlinedevelopment.org/',async route=>{
 const res=await route.fetch();let body=await res.text();if(!body.includes(setter))throw new Error('setter missing');body=body.replaceAll(setter,setterNew);await route.fulfill({response:res,body});
});
await context.route('**/earthline-elder-worker-17129.js*',async route=>{
 const res=await route.fetch();let body=await res.text();if(!body.includes(workerOld))throw new Error('worker raster owner missing');body=body.replace(workerOld,workerNew);await route.fulfill({response:res,body});
});
const page=await context.newPage();
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(800);
const t0=Date.now();
await page.locator('#searchInput').fill('61 Sleepy Hollow Rd Essex Vermont');
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.tier||'').toLowerCase()==='property',{timeout:90000});
const propertyMs=Date.now()-t0;
let elderAtPublish=await page.evaluate(()=>Number(window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()?.length||0));
let elderMs=null;
if(elderAtPublish<=0){
 await page.waitForFunction(()=>Number(window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()?.length||0)>0,{timeout:20000});
 elderMs=Date.now()-t0;
}else elderMs=propertyMs;
const state=await page.evaluate(()=>({count:Number(window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()?.length||0),last:window.EARTHLINE_ELDER_TREE_LAST_17097||null}));
console.log('M83_ELDER_COMBINED '+JSON.stringify({propertyMs,elderAtPublish,elderMs,afterPropertyMs:elderMs-propertyMs,state}));
if(state.count<12)process.exitCode=2;
if(elderMs-propertyMs>7000)process.exitCode=3;
await browser.close();
