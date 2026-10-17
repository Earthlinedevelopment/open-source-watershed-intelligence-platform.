import { chromium, webkit } from 'playwright';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?eventtrace17425='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{state:'attached',timeout:30000});
if(!(await page.locator('#searchInput').isVisible()))await page.evaluate(()=>{try{document.documentElement.classList.add('earthline-panel-open-16188');window.earthlineReconcilePanel16188?.();document.getElementById('earthlineRailSearch16188')?.click?.();window.earthlineReconcilePanel16188?.()}catch(_){}});
await page.waitForSelector('#searchInput',{state:'visible',timeout:15000});
await page.locator('#searchInput').fill('Vermont');await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(await opts.count())await opts.first().click();
const rb=page.locator('#runBtn');if(await rb.isVisible())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:90000,polling:100});
await page.waitForFunction(()=>typeof window.earthlineFocusRunEngine16158==='function',null,{timeout:20000,polling:100});
const pt={lng:-72.9726,lat:43.6106};
await page.evaluate(async p=>{const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);mp?.jumpTo?.({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});await window.earthlineFocusRunEngine16158({center:{lng:p.lng,lat:p.lat},sizeM:3000,label:'event trace'});},pt);
await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'').toLowerCase()==='focus',null,{timeout:90000,polling:100});
await page.evaluate(p=>new Promise(resolve=>{const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);if(!mp?.jumpTo)return resolve();let done=false;const f=()=>{if(done)return;done=true;resolve()};mp.once?.('moveend',f);mp.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});setTimeout(f,1200)}),pt);
await page.evaluate(()=>{try{window.earthlineSyncPropertyTargetFromMap16201?.()}catch(_){}});
await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return b&&getComputedStyle(b).display!=='none'&&!b.disabled},null,{timeout:20000,polling:100});

await page.evaluate(()=>{
  window.__EL_TRACE_17425=[];
  const push=(label,e)=>window.__EL_TRACE_17425.push({
    label,type:e.type,phase:e.eventPhase,target:e.target?.id||e.target?.tagName,
    current:e.currentTarget?.id||e.currentTarget===document?'DOCUMENT':e.currentTarget===window?'WINDOW':e.currentTarget?.tagName,
    trusted:e.isTrusted,defaultPrevented:e.defaultPrevented,
    cancelBubble:e.cancelBubble
  });
  const b=document.getElementById('earthlineDeclareProperty16169');
  const slot=document.getElementById('earthlinePropertySlot16188');
  for(const type of ['pointerdown','mousedown','pointerup','mouseup','click']){
    window.addEventListener(type,e=>push('window-capture',e),true);
    document.addEventListener(type,e=>push('document-capture',e),true);
    slot?.addEventListener(type,e=>push('slot-capture',e),true);
    b?.addEventListener(type,e=>push('button-capture',e),true);
    b?.addEventListener(type,e=>push('button-bubble',e),false);
    slot?.addEventListener(type,e=>push('slot-bubble',e),false);
    document.addEventListener(type,e=>push('document-bubble',e),false);
    window.addEventListener(type,e=>push('window-bubble',e),false);
  }
});
const b=page.locator('#earthlineDeclareProperty16169');
const box=await b.boundingBox();
const point={x:box.x+box.width/2,y:box.y+box.height/2};
const pre=await page.evaluate(({x,y})=>{
  const el=document.elementFromPoint(x,y),btn=document.getElementById('earthlineDeclareProperty16169');
  return {
    hit:{id:el?.id||null,tag:el?.tagName||null,cls:el?.className||null,insideButton:!!(el&&btn?.contains(el))},
    button:{disabled:btn?.disabled,pe:getComputedStyle(btn).pointerEvents,visibility:getComputedStyle(btn).visibility,display:getComputedStyle(btn).display,opacity:getComputedStyle(btn).opacity,owner:btn?.dataset?.earthlinePropertyClickOwner16546,onclick:!!btn?.onclick},
    serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)
  };
},point);
await page.mouse.click(point.x,point.y);
await page.waitForTimeout(700);
const postPhysical=await page.evaluate(()=>({
  serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
  state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
  tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
  trace:window.__EL_TRACE_17425||[]
}));
if(postPhysical.serial===pre.serial){
  await page.evaluate(()=>document.getElementById('earthlineDeclareProperty16169')?.click());
  await page.waitForTimeout(700);
}
const postDom=await page.evaluate(()=>({
  serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
  state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
  tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
  trace:window.__EL_TRACE_17425||[]
}));
console.log('EARTHLINE_EVENT_TRACE_17425 '+JSON.stringify({point,pre,postPhysical,postDom,errors}));
await browser.close();
if(postDom.serial<=pre.serial)process.exitCode=1;
