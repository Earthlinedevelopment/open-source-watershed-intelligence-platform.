import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const js=readFileSync('earthline-launch-16872.js');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:950}});
await page.route('https://earthlinedevelopment.org/earthline-launch-16872.js*',r=>r.fulfill({status:200,body:js,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}}));
await page.goto('https://earthlinedevelopment.org/?onepress-launch-17266='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.locator('#searchInput').fill('australia country');await page.waitForTimeout(1200);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!(await opts.count()))throw new Error('no Australia suggestion');
await opts.first().click();const run=page.locator('#runBtn');if(await run.isEnabled())await run.click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:150000,polling:100});
const lng=135.93355,lat=-32.40049;
await page.locator('#map').dispatchEvent('pointerdown',{bubbles:true,clientX:900,clientY:420,pointerType:'mouse',button:0});
await page.evaluate(({lng,lat})=>new Promise((resolve,reject)=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);if(!m?.jumpTo)return reject(new Error('map unavailable'));let done=false;const f=()=>{if(done)return;done=true;resolve()};m.once?.('moveend',f);m.jumpTo({center:[lng,lat],zoom:16.78,bearing:0,pitch:0});setTimeout(f,1800)}),{lng,lat});
await page.waitForTimeout(250);
const before=await page.evaluate(()=>{
  const b=document.getElementById('earthlineDeclareProperty16169');
  window.__EARTHLINE_CLICK_DIAG_17266={events:[],sameButton:true};
  window.__EARTHLINE_CLICK_DIAG_BUTTON_17266=b;
  const rec=(phase,e)=>window.__EARTHLINE_CLICK_DIAG_17266.events.push({phase,type:e.type,targetId:e.target?.id||'',closestId:e.target?.closest?.('button')?.id||'',at:performance.now()});
  document.addEventListener('pointerdown',e=>{if(e.target?.closest?.('#earthlineDeclareProperty16169'))rec('document-capture',e)},true);
  for(const type of ['pointerdown','pointerup','pointercancel','mousedown','mouseup','click']){
    document.addEventListener(type,e=>{if(e.target?.closest?.('#earthlineDeclareProperty16169'))rec('document-capture',e)},true);
    b?.addEventListener(type,e=>rec('button-capture',e),true);
    b?.addEventListener(type,e=>rec('button-bubble',e),false);
  }
  const mo=new MutationObserver(ms=>{for(const m of ms)window.__EARTHLINE_CLICK_DIAG_17266.events.push({phase:'mutation',type:m.attributeName||m.type,disabled:!!b?.disabled,busy:b?.dataset?.busy||null,at:performance.now()})});
  if(b)mo.observe(b,{attributes:true,attributeFilter:['disabled','data-busy','data-state','style','class']});
  return Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0);
});
const prop=page.locator('#earthlineDeclareProperty16169');
const box=await prop.boundingBox();if(!box)throw new Error('Property button has no box');
const x=box.x+box.width/2,y=box.y+box.height/2;
await page.mouse.move(x,y);
await page.mouse.down();
await page.waitForTimeout(120);
const afterDown=await page.evaluate(({x,y})=>{const b=document.getElementById('earthlineDeclareProperty16169'),e=document.elementFromPoint(x,y);return {disabled:!!b?.disabled,busy:b?.dataset?.busy||null,state:b?.dataset?.state||null,topId:e?.id||'',topClosest:e?.closest?.('button')?.id||'',sameButton:b===window.__EARTHLINE_CLICK_DIAG_BUTTON_17266,rect:b?.getBoundingClientRect?.().toJSON?.()||null}}, {x,y});
await page.mouse.up();
await page.waitForTimeout(1500);
const snap=await page.evaluate(()=>({
 audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
 launchAudit:window.EARTHLINE_PROPERTY_LAUNCH_AUDIT_16322||null,
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
 repair:window.EARTHLINE_PROPERTY_ONE_PRESS_17266||null,
 runState:document.documentElement.dataset.earthlinePropertyRunState||'',
 waterGate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null,
 handoff:window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null,
 displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
 status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),
 button:{
   disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,
   busy:document.getElementById('earthlineDeclareProperty16169')?.dataset?.busy||null,
   onclickSource:String(document.getElementById('earthlineDeclareProperty16169')?.onclick||'').slice(0,700),
   sameButton:document.getElementById('earthlineDeclareProperty16169')===window.__EARTHLINE_CLICK_DIAG_BUTTON_17266,
   count:document.querySelectorAll('#earthlineDeclareProperty16169').length
 },
 globalOwnerSource:String(window.earthlineDeclarePropertyAtCrosshair16173||'').slice(0,700),
 mapCenter:(()=>{try{const c=(window.earthlineMap||earthlineMap).getCenter();return {lng:Number(c.lng),lat:Number(c.lat)}}catch(_){return null}})(),
 clickDiag:window.__EARTHLINE_CLICK_DIAG_17266||null
}));
const targetOk=Math.abs(Number(snap.target?.lng)-lng)<0.002&&Math.abs(Number(snap.target?.lat)-lat)<0.002;
const launched=Number(snap.audit?.serial||0)>before;
console.log('EARTHLINE_ONE_PRESS_LAUNCH_17266 '+JSON.stringify({before,afterDown,launched,targetOk,...snap}));
await browser.close();
if(!(launched&&targetOk))process.exitCode=1;

// rerun after deferred authoritative-owner bind
