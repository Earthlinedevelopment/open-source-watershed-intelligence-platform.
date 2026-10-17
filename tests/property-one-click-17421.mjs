import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?oneclick17421='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{state:'attached',timeout:30000});
if(!(await page.locator('#searchInput').isVisible())){
  await page.evaluate(()=>{try{document.documentElement.classList.add('earthline-panel-open-16188');window.earthlineReconcilePanel16188?.();document.getElementById('earthlineRailSearch16188')?.click?.();window.earthlineReconcilePanel16188?.()}catch(_){}});
}
await page.waitForSelector('#searchInput',{state:'visible',timeout:15000});
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count())await opts.first().click();
const rb=page.locator('#runBtn');
if(await rb.isVisible())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:90000,polling:100});
await page.waitForFunction(()=>typeof window.earthlineFocusRunEngine16158==='function',null,{timeout:15000,polling:100});
const pt={lng:-72.9726,lat:43.6106};
await page.evaluate(async p=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(mp?.jumpTo)mp.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});
  await window.earthlineFocusRunEngine16158({center:{lng:p.lng,lat:p.lat},sizeM:3000,label:'One click gate'});
},pt);
await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'').toLowerCase()==='focus',null,{timeout:90000,polling:100});
await page.evaluate(p=>new Promise(resolve=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(!mp?.jumpTo)return resolve();
  let done=false;const f=()=>{if(done)return;done=true;resolve()};
  mp.once?.('moveend',f);mp.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});setTimeout(f,1200);
}),pt);
await page.evaluate(()=>{try{window.earthlineSyncPropertyTargetFromMap16201?.()}catch(_){}});
await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return b&&getComputedStyle(b).display!=='none'&&!b.disabled},null,{timeout:20000,polling:100});
const before=await page.evaluate(()=>({
  serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
  btnOwner:document.getElementById('earthlineDeclareProperty16169')?.dataset?.earthlinePropertyClickOwner16546||null
}));
await page.locator('#earthlineDeclareProperty16169').click();
let started=false;
try{
  await page.waitForFunction(pre=>{
    const serial=Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0);
    const state=String(document.documentElement.dataset.earthlinePropertyRunState||'');
    return serial>pre.serial||state==='running'||document.documentElement.classList.contains('earthline-property-running-16233');
  },before,{timeout:3500,polling:50});
  started=true;
}catch(_){}
const after=await page.evaluate(()=>({
  serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
  runAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  btnOwner:document.getElementById('earthlineDeclareProperty16169')?.dataset?.earthlinePropertyClickOwner16546||null,
  rebound:window.EARTHLINE_REGIONAL_PROPERTY_PARENT_REBIND_17016?.last||null
}));
await browser.close();
console.log('EARTHLINE_ONE_CLICK_17421 '+JSON.stringify({pass:started,started,before,after,errors}));
if(!started)process.exitCode=1;
