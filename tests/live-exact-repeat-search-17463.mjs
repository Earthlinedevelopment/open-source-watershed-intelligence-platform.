import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));

async function runSearch(query,label){
  const input=page.locator('#searchInput');
  await input.click();
  await input.fill('');
  await input.fill(query);
  await page.waitForTimeout(900);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  const count=await opts.count();
  if(!count)throw new Error(label+' no suggestions for '+query);
  await opts.first().click();
  await page.waitForTimeout(350);
  const rb=page.locator('#runBtn');
  await rb.click();
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
  const corridor=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();
  await corridor.waitFor({state:'visible',timeout:30000});
  await corridor.click({force:true});
  await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000,polling:100});
  await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
  await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled;},null,{timeout:30000,polling:100});
  const before=await page.evaluate(()=>({serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),target:window.EARTHLINE_PROPERTY_TARGET_16201||null,state:String(document.documentElement.dataset.earthlinePropertyRunState||''),disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled}));
  const clickAt=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  let started=false;
  try{await page.waitForFunction(s=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>s||String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running',before.serial,{timeout:3500,polling:50});started=true}catch(_){}
  const afterStart=await page.evaluate(()=>({serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),state:String(document.documentElement.dataset.earthlinePropertyRunState||''),disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null}));
  await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,b=document.getElementById('earthlineDeclareProperty16169');return !!b&&!b.disabled&&String(document.documentElement.dataset.earthlinePropertyRunState||'')==='idle'&&Number(a?.serial||0)>0;},null,{timeout:120000,polling:100}).catch(()=>{});
  return {label,query,started,startLatencyMs:Date.now()-clickAt,before,afterStart};
}

await page.goto(BASE+'?exactRepeatSearch17463='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
const first=await runSearch('Essex Junction, Vermont','first');
const second=await runSearch('Rutland, Vermont','second');
const result={first,second,errors,pass:first.started&&second.started&&!errors.length};
console.log('EARTHLINE_EXACT_REPEAT_SEARCH_17463 '+JSON.stringify(result));
await browser.close();
if(!result.pass)process.exitCode=1;
