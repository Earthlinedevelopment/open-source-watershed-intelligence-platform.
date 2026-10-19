import { firefox } from 'playwright';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8');
const launch=fs.readFileSync('earthline-launch-16872.js','utf8');
const elderWorker=fs.readFileSync('earthline-elder-worker-17129.js','utf8');
const browser=await firefox.launch({headless:false});
const context=await browser.newContext({viewport:{width:1800,height:950}});
await context.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')
    return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-launch-16872\.js$/.test(u.pathname))
    return r.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-elder-worker-17129\.js$/.test(u.pathname))
    return r.fulfill({status:200,body:elderWorker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  return r.continue();
});
const page=await context.newPage();
await page.addInitScript(()=>{
  window.__elderTrace17531=[];
  const orig=Worker.prototype.postMessage;
  Worker.prototype.postMessage=function(msg,...rest){
    try{
      if(msg&&typeof msg==='object'&&String(msg.id||'').startsWith('elder-')&&!msg.warm&&!msg.warmBbox){
        const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
        window.__elderTrace17531.push({
          kind:'post',id:String(msg.id||''),t:performance.now(),bbox:Array.isArray(msg.bbox)?msg.bbox.slice():null,
          target:t?{lng:+t.lng,lat:+t.lat,source:String(t.source||''),code:String(t.code||'')}:null,
          tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
          elderState:String(window.EARTHLINE_ELDER_TREE_LAST_17097?.state||''),
          stack:String(new Error().stack||'').split('\n').slice(1,8)
        });
      }
    }catch(_){}
    return orig.call(this,msg,...rest);
  };
  const watch=()=>{
    try{
      const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      const sig=String(e?.propertyRunIdentity||'')+'|'+String(e?.at||'')+'|'+String(e?.state||'');
      if(e&&sig!==window.__elderLastSig17531){
        window.__elderLastSig17531=sig;
        window.__elderTrace17531.push({kind:'state',t:performance.now(),state:e.state||null,identity:e.propertyRunIdentity||null,at:e.at||null});
      }
    }catch(_){}
    requestAnimationFrame(watch);
  };requestAnimationFrame(watch);
});
async function regional(q){
  const i=page.locator('#searchInput');await i.fill('');await i.fill(q);await page.waitForTimeout(700);
  const o=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await o.count())throw new Error('no suggestion '+q);
  await o.first().click();await page.waitForTimeout(250);
  const b=page.locator('#runBtn');if(await b.isVisible()&&!await b.isDisabled())await b.click();
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
}
await page.goto('https://earthlinedevelopment.org/?elderTrace17531='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
for(const q of ['Essex Junction, Vermont','Rutland, Vermont']){
  await regional(q);
  const c=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();
  await c.waitFor({state:'visible',timeout:30000});await c.click({force:true});
  await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000});
  await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
  await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000});
  await page.waitForTimeout(250);
  const before=await page.evaluate(()=>({n:window.__elderTrace17531.length,serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)}));
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>s&&a?.settled===true},before.serial,{timeout:120000,polling:50});
  await page.waitForTimeout(18000);
  const rows=await page.evaluate(n=>window.__elderTrace17531.slice(n),before.n);
  console.log('EARTHLINE_ELDER_POST_TRACE_17531 '+JSON.stringify({q,rows}));
}
await context.close();await browser.close();
