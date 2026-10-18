import { chromium } from 'playwright';
import fs from 'node:fs';
const patchedJS=fs.readFileSync('earthline-launch-16872.js','utf8');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
await context.route('https://earthlinedevelopment.org/earthline-launch-16872.js*',r=>r.fulfill({status:200,body:patchedJS,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}}));
const page=await context.newPage({viewport:{width:1800,height:950}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));

async function run(query,label){
  const input=page.locator('#searchInput');await input.click();await input.fill('');await input.fill(query);await page.waitForTimeout(800);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await opts.count())throw new Error('no suggestion '+query);
  await opts.first().click();await page.waitForTimeout(250);await page.locator('#runBtn').click();
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
  const labelEl=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();await labelEl.waitFor({state:'visible',timeout:30000});await labelEl.click({force:true});
  await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000});
  await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
  await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000});
  await page.waitForTimeout(300);
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const clickAt=Date.now();await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(s=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>s,before,{timeout:30000,polling:50});
  const started=await page.evaluate(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.startedAt||null);
  const startLatencyMs=started?Date.parse(started)-clickAt:null;
  await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>s&&a?.settled===true},before,{timeout:120000,polling:100});
  let elderMs=null,elder=null;
  const elderStart=Date.now();
  try{await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed',null,{timeout:20000,polling:100});elderMs=Date.now()-clickAt;elder=await page.evaluate(()=>window.EARTHLINE_ELDER_TREE_LAST_17097||null)}catch(_){elderMs=Date.now()-clickAt}
  return {label,query,startLatencyMs,elderMs,elder};
}
await page.goto('https://earthlinedevelopment.org/?fastProp17469='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
const first=await run('Essex Junction, Vermont','first');
const second=await run('Rutland, Vermont','second');
const result={first,second,errors,pass:[first,second].every(x=>x.startLatencyMs!=null&&x.startLatencyMs<1500&&x.elderMs<12000)&&!errors.length};
console.log('EARTHLINE_PROPERTY_FAST_17469 '+JSON.stringify(result));
await browser.close();if(!result.pass)process.exitCode=1;
