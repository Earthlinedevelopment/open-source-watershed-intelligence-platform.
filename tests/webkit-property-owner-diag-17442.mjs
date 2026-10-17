import { webkit } from 'playwright';

const browser=await webkit.launch({headless:false});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';

await page.goto(BASE+'?webkitOwnerDiag17442='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count())await opts.first().click();
const rb=page.locator('#runBtn');
if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});

const target={lng:-72.5778,lat:44.2601};
await page.evaluate(p=>{
 const t={lng:p.lng,lat:p.lat,source:'diag-17442',code:'',score:0,parentRunToken:'',at:new Date().toISOString()};
 if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(t,{openPanel:false});
 else window.EARTHLINE_PROPERTY_TARGET_16201=t;
},target);

await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return b&&getComputedStyle(b).display!=='none'&&!b.disabled},null,{timeout:20000,polling:100});

await page.evaluate(()=>{
 const b=document.getElementById('earthlineDeclareProperty16169');
 const log=window.__EL17442=[];
 const rec=(where,type,e)=>log.push({
   where,type,ts:performance.now(),targetTag:e.target?.tagName||null,targetId:e.target?.id||null,
   currentTag:e.currentTarget?.tagName||null,currentId:e.currentTarget?.id||null,
   armed:b.dataset.earthlinePropertyPointerArmed17441||null,
   launched:b.dataset.earthlinePropertyPointerLaunched17441||null,
   serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
   state:String(document.documentElement.dataset.earthlinePropertyRunState||'')
 });
 for(const type of ['pointerdown','pointerup','click']){
   document.addEventListener(type,e=>{if(e.target===b||b.contains(e.target))rec('document-capture',type,e)},true);
   document.addEventListener(type,e=>{if(e.target===b||b.contains(e.target))rec('document-bubble',type,e)},false);
   b.addEventListener(type,e=>rec('button-extra-capture',type,e),true);
   b.addEventListener(type,e=>rec('button-extra-bubble',type,e),false);
 }
 window.__EL17442_BEFORE={
   onpointerdown:typeof b.onpointerdown,onpointerup:typeof b.onpointerup,
   onpointercancel:typeof b.onpointercancel,onclick:typeof b.onclick,
   owner:b.dataset.earthlinePropertyClickOwner16546||null,
   downSource:String(b.onpointerdown||''),upSource:String(b.onpointerup||''),clickSource:String(b.onclick||'')
 };
});

await page.locator('#earthlineDeclareProperty16169').click({timeout:10000});
await page.waitForTimeout(800);

const out=await page.evaluate(()=>{
 const b=document.getElementById('earthlineDeclareProperty16169');
 return {
   before:window.__EL17442_BEFORE,
   log:window.__EL17442,
   after:{
    onpointerdown:typeof b?.onpointerdown,onpointerup:typeof b?.onpointerup,onclick:typeof b?.onclick,
    armed:b?.dataset?.earthlinePropertyPointerArmed17441||null,
    launched:b?.dataset?.earthlinePropertyPointerLaunched17441||null,
    serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
    state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null
   }
 };
});
console.log('EARTHLINE_WEBKIT_OWNER_DIAG_17442 '+JSON.stringify(out));
await browser.close();
