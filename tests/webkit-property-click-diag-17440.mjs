import { webkit } from 'playwright';

const browser=await webkit.launch({headless:false});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const events=[];
page.on('pageerror',e=>events.push({type:'pageerror',msg:String(e)}));

await page.goto(BASE+'?webkitClickDiag17440='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
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
  const t={lng:p.lng,lat:p.lat,source:'webkit-click-diag-17440',code:'',score:0,parentRunToken:'',at:new Date().toISOString()};
  if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(t,{openPanel:false});
  else window.EARTHLINE_PROPERTY_TARGET_16201=t;
},target);

await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return b&&getComputedStyle(b).display!=='none'&&!b.disabled},null,{timeout:20000,polling:100});

await page.evaluate(()=>{
  const log=window.__EARTHLINE_CLICK_DIAG_17440=[];
  const rec=(name,e)=>{
    const b=document.getElementById('earthlineDeclareProperty16169');
    log.push({
      name,ts:performance.now(),targetId:e?.target?.id||null,
      sameNode:!!(b&&e?.target===b),connected:!!b?.isConnected,parent:b?.parentElement?.id||null,
      onclick:typeof b?.onclick,owner:b?.dataset?.earthlinePropertyClickOwner16546||null,
      rect:b?(()=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})():null,
      state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)
    });
  };
  const b=document.getElementById('earthlineDeclareProperty16169');
  window.__EARTHLINE_BUTTON_NODE_17440=b;
  for(const ev of ['pointerdown','mousedown','pointerup','mouseup','click']){
    document.addEventListener(ev,e=>{if(e.target===b||e.target?.closest?.('#earthlineDeclareProperty16169'))rec('capture:'+ev,e)},true);
    document.addEventListener(ev,e=>{if(e.target===b||e.target?.closest?.('#earthlineDeclareProperty16169'))rec('bubble:'+ev,e)},false);
  }
  const mo=new MutationObserver(ms=>{
    const cur=document.getElementById('earthlineDeclareProperty16169');
    for(const m of ms){
      const touched=[...m.addedNodes,...m.removedNodes].some(n=>n===b||n?.contains?.(b)||n===cur||n?.contains?.(cur));
      if(touched)log.push({name:'mutation',ts:performance.now(),sameNode:cur===b,connected:!!cur?.isConnected,parent:cur?.parentElement?.id||null,onclick:typeof cur?.onclick,owner:cur?.dataset?.earthlinePropertyClickOwner16546||null});
    }
  });
  mo.observe(document.body,{childList:true,subtree:true});
  window.__EARTHLINE_CLICK_DIAG_MO_17440=mo;
});

const before=await page.evaluate(()=>{
 const b=document.getElementById('earthlineDeclareProperty16169');
 const r=b.getBoundingClientRect();
 const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
 return {
   sameNode:b===window.__EARTHLINE_BUTTON_NODE_17440,
   connected:b.isConnected,parent:b.parentElement?.id||null,onclick:typeof b.onclick,
   owner:b.dataset.earthlinePropertyClickOwner16546||null,
   hitId:hit?.id||null,hitClosest:hit?.closest?.('button')?.id||null,
   rect:{x:r.x,y:r.y,w:r.width,h:r.height},
   serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)
 };
});

await page.locator('#earthlineDeclareProperty16169').click({timeout:10000});
await page.waitForTimeout(1200);

const afterPhysical=await page.evaluate(()=>({
  log:window.__EARTHLINE_CLICK_DIAG_17440||[],
  serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
  audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
  currentSameNode:document.getElementById('earthlineDeclareProperty16169')===window.__EARTHLINE_BUTTON_NODE_17440,
  parent:document.getElementById('earthlineDeclareProperty16169')?.parentElement?.id||null,
  onclick:typeof document.getElementById('earthlineDeclareProperty16169')?.onclick
}));

let directStarted=false;
if(!afterPhysical.serial){
  await page.evaluate(()=>document.getElementById('earthlineDeclareProperty16169')?.click());
  try{
    await page.waitForFunction(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>0,null,{timeout:3000,polling:50});
    directStarted=true;
  }catch(_){}
}
const final=await page.evaluate(()=>({
 serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
 audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
 state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
 log:window.__EARTHLINE_CLICK_DIAG_17440||[]
}));

console.log('EARTHLINE_WEBKIT_CLICK_DIAG_17440 '+JSON.stringify({before,afterPhysical,directStarted,final,events}));
await browser.close();
