import { firefox } from 'playwright';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8');
const launch=fs.readFileSync('earthline-launch-16872.js','utf8');
const worker=fs.readFileSync('earthline-elder-worker-17129.js','utf8');
const detector=fs.readFileSync('tools/elder_trees/chmv2_array_detector_17129.py','utf8');
const browser=await firefox.launch({headless:false});

async function newPage(){
 const context=await browser.newContext({viewport:{width:1800,height:950}});
 await context.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')
   return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-launch-16872\.js$/.test(u.pathname))
   return r.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-elder-worker-17129\.js$/.test(u.pathname))
   return r.fulfill({status:200,body:worker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/tools\/elder_trees\/chmv2_array_detector_17129\.py$/.test(u.pathname))
   return r.fulfill({status:200,body:detector,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
  return r.continue();
 });
 const page=await context.newPage();return {context,page};
}
async function waitRegional(page){await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100})}
async function regional(page,q){const i=page.locator('#searchInput');await i.fill('');await i.fill(q);await page.waitForTimeout(700);const o=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await o.count())throw new Error('no suggestion '+q);await o.first().click();await page.waitForTimeout(250);const b=page.locator('#runBtn');if(await b.isVisible()&&!await b.isDisabled())await b.click();await waitRegional(page)}

const {context,page}=await newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.addInitScript(()=>{
 window.__el38={events:[],last:''};
 const snap=(kind,e)=>{if(!e.target?.closest?.('#earthlineDeclareProperty16169'))return;const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;window.__el38.events.push({kind,t:performance.now(),target:t?{lng:+t.lng,lat:+t.lat}:null})};
 document.addEventListener('pointerup',e=>snap('pointerup',e),true);document.addEventListener('click',e=>snap('click',e),true);
 const orig=Worker.prototype.postMessage;Worker.prototype.postMessage=function(msg,...rest){try{if(msg&&String(msg.id||'').startsWith('elder-')&&!msg.warm&&!msg.warmBbox)window.__el38.events.push({kind:'post',id:String(msg.id),t:performance.now()})}catch(_){}return orig.call(this,msg,...rest)};
 const watch=()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;if(e?.state==='committed'){const sig=String(e.propertyRunIdentity||'')+'|'+String(e.at||'');if(sig&&sig!==window.__el38.last){window.__el38.last=sig;window.__el38.events.push({kind:'commit',identity:String(e.propertyRunIdentity||''),t:performance.now()})}}requestAnimationFrame(watch)};requestAnimationFrame(watch);
});
await page.goto('https://earthlinedevelopment.org/?correct17538='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const [label,q] of [['first','Essex Junction, Vermont'],['second','Rutland, Vermont']]){
 await regional(page,q);
 const c=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();await c.waitFor({state:'visible',timeout:30000});await c.click({force:true});
 await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000});
 await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
 await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000});
 await page.waitForTimeout(250);
 const before=await page.evaluate(()=>({serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),n:window.__el38.events.length}));
 await page.locator('#earthlineDeclareProperty16169').click();
 await page.waitForFunction(s=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>s,before.serial,{timeout:10000,polling:20});
 const activation=await page.evaluate(n=>window.__el38.events.slice(n).find(x=>x.kind==='pointerup')||window.__el38.events.slice(n).find(x=>x.kind==='click')||null,before.n);
 const expected=[Number(activation?.target?.lng).toFixed(6),Number(activation?.target?.lat).toFixed(6)].join('|')+'|';
 const ok=await page.waitForFunction(prefix=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;return e?.state==='committed'&&String(e.propertyRunIdentity||'').startsWith(prefix)},expected,{timeout:60000,polling:25}).then(()=>true).catch(()=>false);
 const out=await page.evaluate(({before,expected,label,q,activation,ok})=>{const ev=window.__el38.events.slice(before.n),commit=ev.find(x=>x.kind==='commit'&&String(x.identity||'').startsWith(expected))||null,a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;return {label,q,activationT:activation?.t??null,commitT:commit?.t??null,elderMs:activation&&commit?commit.t-activation.t:null,serialBefore:before.serial,serialAfter:Number(a?.serial||0),propertyResult:a?.result===true,elderState:e?.state||null,identity:e?.propertyRunIdentity||null,workerTimings:e?.workerTimings||null,events:ev,ok}}, {before,expected,label,q,activation,ok});
 rows.push(out);console.log('EARTHLINE_CORRECT_ELDER_17538 '+JSON.stringify(out));
}
console.log('EARTHLINE_CORRECT_ELDER_17538_SUMMARY '+JSON.stringify({rows,errors}));
await context.close();await browser.close();
if(errors.length||rows.some(r=>!r.ok||!r.propertyResult||r.serialAfter!==r.serialBefore+1))process.exitCode=1;