import {chromium} from 'playwright';
import fs from 'node:fs';
const paths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=paths.find(p=>fs.existsSync(p));
if(!executablePath)throw new Error('system Chrome missing');

const setter="window.EARTHLINE_PROPERTY_TARGET_16201={lng:Number(target.lng),lat:Number(target.lat),source:String(target.source||'crosshair'),code:target.code?String(target.code):'',score:Number(target.score||0),parentRunToken:parentRunToken16347||'',at:new Date().toISOString()};";
const replacement=setter+"try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}";

async function run(modified){
 const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 if(modified)await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();let body=await res.text();if(!body.includes(setter))throw new Error('setter owner missing');body=body.replaceAll(setter,replacement);await route.fulfill({response:res,body});});
 await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForTimeout(1000);
 const t0=Date.now();
 await page.locator('#searchInput').fill('61 Sleepy Hollow Rd Essex Vermont');
 await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
 await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.tier||'').toLowerCase()==='property',{timeout:90000});
 const propertyMs=Date.now()-t0;
 let elderMs=null;
 try{
   await page.waitForFunction(()=>Number(window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()?.length||0)>0,{timeout:30000});
   elderMs=Date.now()-t0;
 }catch(_){}
 const state=await page.evaluate(()=>({elderCount:Number(window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()?.length||0),elderLast:window.EARTHLINE_ELDER_TREE_LAST_17097||null}));
 await browser.close();
 return {modified,propertyMs,elderMs,afterPropertyMs:elderMs==null?null:elderMs-propertyMs,state};
}
const baseline=await run(false);
const early=await run(true);
console.log('M83_ELDER_EARLY_START '+JSON.stringify({baseline,early}));
if(!(early.state.elderCount>0))process.exitCode=2;
