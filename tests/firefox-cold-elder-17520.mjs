import { firefox } from 'playwright';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8'),launch=fs.readFileSync('earthline-launch-16872.js','utf8');
const browser=await firefox.launch({headless:false});
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
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.addInitScript(()=>{
  window.__el17520={events:[],last:''};
  const snap=(kind,e)=>{if(!e.target?.closest?.('#earthlineDeclareProperty16169'))return;try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.(),t=window.EARTHLINE_PROPERTY_TARGET_16201||null;window.__el17520.events.push({kind,t:performance.now(),target:t?{lng:+t.lng,lat:+t.lat}:null,center:c?{lng:+c.lng,lat:+c.lat}:null})}catch(_){}};
  document.addEventListener('pointerup',e=>snap('pointerup',e),true);
  const watch=()=>{try{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;if(e?.state==='committed'){const sig=String(e.propertyRunIdentity||'')+'|'+String(e.at||'');if(sig!==window.__el17520.last){window.__el17520.last=sig;window.__el17520.events.push({kind:'commit',t:performance.now(),identity:String(e.propertyRunIdentity||'')})}}}catch(_){};requestAnimationFrame(watch)};requestAnimationFrame(watch);
});
await page.goto('https://earthlinedevelopment.org/?ffcold17520='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
const i=page.locator('#searchInput');await i.fill('Essex Junction, Vermont');await page.waitForTimeout(700);
const o=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await o.count())throw new Error('no suggestion');
await o.first().click();await page.waitForTimeout(250);
const rb=page.locator('#runBtn');const regionalStart=Date.now();if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
const regionalMs=Date.now()-regionalStart;
const c=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();await c.waitFor({state:'visible',timeout:30000});await c.click({force:true});
await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000});
await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000});
await page.waitForTimeout(250);
const before=await page.evaluate(()=>({serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),n:window.__el17520.events.length}));
await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(n=>window.__el17520.events.slice(n).some(x=>x.kind==='pointerup'),before.n,{timeout:3000,polling:20});
const activation=await page.evaluate(n=>window.__el17520.events.slice(n).find(x=>x.kind==='pointerup')||null,before.n);
const prefix=[Number(activation?.target?.lng).toFixed(6),Number(activation?.target?.lat).toFixed(6)].join('|')+'|';
const elderOk=await page.waitForFunction(p=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;return e?.state==='committed'&&String(e.propertyRunIdentity||'').startsWith(p)},prefix,{timeout:12000,polling:25}).then(()=>true).catch(()=>false);
const propertyOk=await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>s&&a?.settled===true&&a?.result===true},before.serial,{timeout:120000,polling:50}).then(()=>true).catch(()=>false);
await page.waitForTimeout(100);
const out=await page.evaluate(({before,prefix,activation})=>{const ev=window.__el17520.events.slice(before.n),commit=ev.find(x=>x.kind==='commit'&&String(x.identity||'').startsWith(prefix))||null,a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;const same=!!activation?.target&&!!a?.center&&Math.abs(+activation.target.lng-+a.center.lng)<0.0008&&Math.abs(+activation.target.lat-+a.center.lat)<0.0008;return {activationT:activation?.t??null,commitT:commit?.t??null,elderMs:activation&&commit?commit.t-activation.t:null,sameTarget:same,serialBefore:before.serial,serialAfter:+(a?.serial||0),propertyResult:a?.result===true,elderState:e?.state||null,identity:e?.propertyRunIdentity||null,workerTimings:e?.workerTimings||null,events:ev}}, {before,prefix,activation});
const pass=elderOk&&propertyOk&&out.elderMs!=null&&out.elderMs<=12000&&out.sameTarget&&out.serialAfter===out.serialBefore+1&&!errors.length;
console.log('EARTHLINE_FIREFOX_COLD_17520 '+JSON.stringify({attempt:process.env.ATTEMPT||'',pass,regionalMs,...out,errors}));
await context.close();await browser.close();if(!pass)process.exitCode=1;
