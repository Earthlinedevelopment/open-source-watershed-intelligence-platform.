import { chromium } from 'playwright';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8'), launch=fs.readFileSync('earthline-launch-16872.js','utf8');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:950}});
await context.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')
    return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-launch-16872\.js$/.test(u.pathname))
    return r.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  return r.continue();
});
const page=await context.newPage();
await page.addInitScript(()=>{
  window.__userTiming17510={events:[]};
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#earthlineDeclareProperty16169')){
      window.__userTiming17510.events.push({kind:'actual-click',t:performance.now()});
    }
  },true);
  const orig=Worker.prototype.postMessage;
  Worker.prototype.postMessage=function(msg,...rest){
    try{
      if(msg&&typeof msg==='object'&&String(msg.id||'').startsWith('elder-')&&!msg.warm&&!msg.warmBbox){
        window.__userTiming17510.events.push({kind:'elder-worker-post',id:String(msg.id||''),t:performance.now()});
      }
    }catch(_){}
    return orig.call(this,msg,...rest);
  };
});
async function regional(q){
  const i=page.locator('#searchInput');await i.fill('');await i.fill(q);await page.waitForTimeout(700);
  const o=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await o.count())throw new Error('no suggestion '+q);
  await o.first().click();await page.waitForTimeout(250);const b=page.locator('#runBtn');if(await b.isVisible()&&!await b.isDisabled())await b.click();
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
}
async function one(q,label){
  await regional(q);
  const c=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();
  await c.waitFor({state:'visible',timeout:30000});await c.click({force:true});
  await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000});
  await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
  await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000});
  await page.waitForTimeout(300);
  const before=await page.evaluate(()=>({serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),eventCount:window.__userTiming17510.events.length}));
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(s=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>s,before.serial,{timeout:15000,polling:50});
  await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>s&&a?.settled===true},before.serial,{timeout:120000,polling:100});
  await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed',null,{timeout:18000,polling:50});
  const out=await page.evaluate(({label,q,before})=>{
    const ev=window.__userTiming17510.events.slice(before.eventCount);
    const click=ev.find(x=>x.kind==='actual-click')||null;
    const worker=click?ev.find(x=>x.kind==='elder-worker-post'&&x.t>=click.t):null;
    const now=performance.now();
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    return {
      label,q,
      actualClickT:click?.t??null,
      workerPostT:worker?.t??null,
      clickToWorkerMs:click&&worker?worker.t-click.t:null,
      clickToCommitObservedMs:click?now-click.t:null,
      serialBefore:before.serial,
      serialAfter:Number(a?.serial||0),
      settled:a?.settled===true,
      result:a?.result===true,
      elderState:elder?.state||null,
      workerTimings:elder?.workerTimings||null,
      identity:elder?.propertyRunIdentity||null,
      events:ev
    };
  },{label,q,before});
  console.log('EARTHLINE_USER_TIMING_17510 '+JSON.stringify(out));
  return out;
}
await page.goto('https://earthlinedevelopment.org/?userTiming17510='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
const first=await one('Essex Junction, Vermont','first');
const second=await one('Rutland, Vermont','second');
const pass=[first,second].every(x=>x.actualClickT!=null&&x.serialAfter===x.serialBefore+1&&x.settled&&x.result&&x.elderState==='committed'&&x.clickToCommitObservedMs<=12000);
console.log('EARTHLINE_USER_TIMING_17510_SUMMARY '+JSON.stringify({pass,first,second}));
await context.close();await browser.close();if(!pass)process.exitCode=1;