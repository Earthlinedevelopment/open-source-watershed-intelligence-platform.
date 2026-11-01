import {chromium} from 'playwright';
import fs from 'node:fs';

const chromePaths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=chromePaths.find(p=>fs.existsSync(p));
if(!executablePath)throw new Error('system Chrome not found');

const STATES=['Vermont','New York','Massachusetts','Maryland','Colorado','Texas','Florida','Louisiana','California','Oklahoma','Iowa','Arkansas','Nebraska','Arizona','Nevada','Alabama','Pennsylvania','Ohio','Michigan','Wisconsin','Minnesota','Missouri','Kansas','New Mexico','Utah','Oregon','Washington'];

const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(1400);

async function regional(q){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);
  const t0=Date.now();
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published'&&String(d.tier||d.mode||'').toLowerCase()==='regional';
  },before,{timeout:90000});
  await page.waitForTimeout(250);
  return await page.evaluate(t0=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    let maxSlope=-Infinity;
    for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))maxSlope=Math.max(maxSlope,n);}
    return {q:d?.query,ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),water:Number(d?.derived?.waterPaths||0),contours:Number(d?.derived?.contours||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,maxSlope:Number.isFinite(maxSlope)?maxSlope:null};
  },t0);
}
const states=[];
for(const s of STATES)states.push(await regional(s));

const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
await page.locator('#searchInput').fill('61 Sleepy Hollow Rd Essex Vermont');
const pt0=Date.now();
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(prev=>{
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
 return !!d&&String(d.runToken||'')!==String(prev||'')&&String(d.tier||d.mode||'').toLowerCase()==='property';
},before,{timeout:120000});
await page.waitForTimeout(1800);
const property=await page.evaluate(pt0=>{
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
 const m=(typeof M!=='undefined'&&M)||window.M||{};
 const safe=Array.isArray(m.authoritativeSafeSwales15815)?m.authoritativeSafeSwales15815:(Array.isArray(m.swales)?m.swales:[]);
 let elders=[];let summary=null;try{elders=window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()||[];summary=window.EARTHLINE_ELDER_TREES_V1_17097?.summary?.()||null}catch(_){}
 return {ms:Date.now()-pt0,tier:String(d?.tier||d?.mode||''),safeSwales:safe.length,analysisReady:!!m.analysisReady,elders:Array.isArray(elders)?elders.length:0,elderSummary:summary,target:window.EARTHLINE_PROPERTY_TARGET_16201||null};
},pt0);

const failures=[];
for(const r of states){
 if(r.swales<=0||r.rendered<=0)failures.push(r.q+' blank');
 if(r.maxSlope!==null&&r.maxSlope>4)failures.push(r.q+' slope '+r.maxSlope);
}
if(property.tier.toLowerCase()!=='property'||!property.analysisReady||property.safeSwales<=0)failures.push('Property failed');
if(property.elders<=0)failures.push('Property Elders zero');
if(errors.length)failures.push('page errors '+JSON.stringify(errors));

console.log('M83_LIVE_NOW '+JSON.stringify({states,property,errors,failures}));
if(failures.length)process.exitCode=2;
await browser.close();
