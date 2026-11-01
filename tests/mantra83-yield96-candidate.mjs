import {chromium,webkit} from 'playwright';
import fs from 'node:fs';

const chromePaths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const chromePath=chromePaths.find(p=>fs.existsSync(p));
if(!chromePath)throw new Error('system Chrome missing');

const OLD1="if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();";
const NEW1="if((++yieldCount16661%96)===0)await earthlineCooperativeYield16661();";
const OLD2="if((++finalScreenYield16661%12)===0)await earthlineCooperativeYield16661();";
const NEW2="if((++finalScreenYield16661%96)===0)await earthlineCooperativeYield16661();";

function patch(body){
 if(!body.includes(OLD1)||!body.includes(OLD2))throw new Error('yield owners missing');
 return body.replace(OLD1,NEW1).replace(OLD2,NEW2);
}

async function run(type,label,launch){
 const browser=await type.launch(launch);
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();await route.fulfill({response:res,body:patch(await res.text())});});
 await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForTimeout(1000);
 const rows=[];
 for(const q of ['Vermont','Arizona']){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);const t0=Date.now();
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});
  await page.waitForTimeout(250);
  const row=await page.evaluate(t0=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];let max=-Infinity;for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))max=Math.max(max,n);}return {q:d?.query,ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,maxSlope:Number.isFinite(max)?max:null};},t0);
  rows.push(row);
  if(row.swales<=0||row.rendered<=0)throw new Error(label+' '+q+' blank');
  if(row.maxSlope!==null&&row.maxSlope>4)throw new Error(label+' '+q+' slope '+row.maxSlope);
 }
 await browser.close();return {label,rows};
}

const chrome=await run(chromium,'chromium',{headless:true,executablePath:chromePath,args:['--no-sandbox']});
const wk=await run(webkit,'webkit',{headless:true});
console.log('M83_YIELD96_PASS '+JSON.stringify({chrome,wk}));
if(wk.rows.some(r=>r.ms>60000))throw new Error('WebKit still exceeds 60s '+JSON.stringify(wk.rows));
