import { chromium, firefox, webkit } from 'playwright';
import { readFileSync } from 'node:fs';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const ROOT='https://earthlinedevelopment.org/';
const TARGET={lng:-73.012909,lat:44.513845};
const browser=await launcher.launch({headless});
const context=await browser.newContext({viewport:{width:1600,height:950}});
const index=readFileSync('index.html');
const launch=readFileSync('earthline-launch-16872.js');
const worker=readFileSync('earthline-elder-worker-17129.js');
const detector=readFileSync('tools/elder_trees/chmv2_array_detector_17129.py');
await context.route('https://earthlinedevelopment.org/?*',r=>r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}}));
await context.route('https://earthlinedevelopment.org/earthline-launch-16872.js*',r=>r.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}}));
await context.route('https://earthlinedevelopment.org/earthline-elder-worker-17129.js*',r=>r.fulfill({status:200,body:worker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}}));
await context.route('https://earthlinedevelopment.org/tools/elder_trees/chmv2_array_detector_17129.py*',r=>r.fulfill({status:200,body:detector,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}}));
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));

await page.goto(ROOT+'?finalE2E17413='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count())await opts.first().click();
const rb=page.locator('#runBtn');
if(await rb.isVisible()){
  const busy=await rb.evaluate(b=>b.dataset.busy==='1'||b.disabled);
  if(!busy)await rb.click();
}
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  return String(d?.tier||d?.mode||'').toLowerCase()==='regional'&&/vermont/i.test(String(d?.query||''));
},null,{timeout:120000,polling:100});

async function focusTarget(){
  await page.evaluate(async t=>{
    if(typeof window.earthlineRestoreRegional16158==='function')try{window.earthlineRestoreRegional16158('final-e2e-17413')}catch(_){}
    if(typeof window.earthlineFocusRunEngine16158!=='function')throw new Error('focus owner unavailable');
    await window.earthlineFocusRunEngine16158({center:{lng:t.lng,lat:t.lat},sizeM:3000,label:'Vermont final E2E'});
  },TARGET);
  await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'').toLowerCase()==='focus',null,{timeout:120000,polling:100});
  await page.evaluate(t=>new Promise(resolve=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m?.jumpTo)return resolve();
    let done=false;const f=()=>{if(done)return;done=true;resolve()};
    m.once?.('moveend',f);m.jumpTo({center:[t.lng,t.lat],zoom:16.78,bearing:0,pitch:0});setTimeout(f,1600);
  }),TARGET);
  await page.evaluate(t=>{
    window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;
    window.EARTHLINE_COUNTRY_TARGET_USER_UNLOCKED_17240=true;
    return window.earthlineSetPropertyTarget16201({lng:t.lng,lat:t.lat,source:'final-e2e-17413',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
  },TARGET);
  await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return b&&getComputedStyle(b).display!=='none'&&!b.disabled},null,{timeout:20000,polling:100});
}

async function runProperty(label){
  await focusTarget();
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  let started=false,startMs=null;
  try{
    await page.waitForFunction(pre=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>pre,before,{timeout:3000,polling:50});
    started=true;startMs=Date.now()-t0;
  }catch(_){}
  let propertySettled=false,propertyMs=null;
  try{
    await page.waitForFunction(pre=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      return Number(a?.serial||0)>pre&&a?.settled===true;
    },before,{timeout:90000,polling:100});
    propertySettled=true;propertyMs=Date.now()-t0;
  }catch(_){}
  let elderCommitted=false,elderMs=null;
  try{
    await page.waitForFunction(()=>{
      const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      return e?.state==='committed'&&String(e?.propertyRunIdentity||'').length>0;
    },null,{timeout:30000,polling:100});
    elderCommitted=true;elderMs=Date.now()-t0;
  }catch(_){}
  await page.evaluate(async()=>{
    try{if(typeof window.earthlineSyncPropertyTexture16169==='function')await window.earthlineSyncPropertyTexture16169('final-e2e-blue-force')}catch(_){}
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  });
  const snap=await page.evaluate(()=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const ids={footprint:'earthline-property-swale-footprint-16174',casing:'earthline-property-swale-natural-casing-16174',up:'earthline-property-swale-natural-up-16174',flip:'earthline-property-swale-natural-flip-16174',neutral:'earthline-property-swale-neutral-16177'};
    const safe=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
    const paint=(id,p)=>{try{return mp?.getLayer?.(id)?mp.getPaintProperty(id,p):null}catch(_){return null}};
    const layout=(id,p)=>{try{return mp?.getLayer?.(id)?mp.getLayoutProperty(id,p):null}catch(_){return null}};
    const src=mp?.getSource?.('earthline-property-swale-texture-16174');
    return {
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
      textureAudit:window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null,
      sourceFeatures:Array.isArray(src?._data?.features)?src._data.features.length:0,
      style:{
        footprint:{opacity:paint(ids.footprint,'fill-opacity'),visibility:layout(ids.footprint,'visibility')},
        casing:{color:paint(ids.casing,'line-color'),opacity:paint(ids.casing,'line-opacity'),width:paint(ids.casing,'line-width'),visibility:layout(ids.casing,'visibility')},
        up:{pattern:paint(ids.up,'line-pattern'),opacity:paint(ids.up,'line-opacity'),width:paint(ids.up,'line-width'),visibility:layout(ids.up,'visibility')},
        flip:{pattern:paint(ids.flip,'line-pattern'),opacity:paint(ids.flip,'line-opacity'),width:paint(ids.flip,'line-width'),visibility:layout(ids.flip,'visibility')},
        neutral:{color:paint(ids.neutral,'line-color'),opacity:paint(ids.neutral,'line-opacity'),width:paint(ids.neutral,'line-width'),visibility:layout(ids.neutral,'visibility')},
        safe:Object.fromEntries(safe.map(id=>[id,{opacity:paint(id,'line-opacity'),visibility:layout(id,'visibility')}])),
        images:{up:!!mp?.hasImage?.('earthline-swale-natural-uphill-16174'),flip:!!mp?.hasImage?.('earthline-swale-natural-uphill-flipped-16174')}
      }
    };
  });
  return {label,started,startMs,propertySettled,propertyMs,elderCommitted,elderMs,...snap};
}

const first=await runProperty('first');
const second=await runProperty('repeat');
const key=v=>JSON.stringify(v);
const fallbackZero=r=>Object.values(r.style.safe).every(x=>Number(x.opacity)===0);
const naturalReady=r=>r.style.images.up&&r.style.images.flip&&r.sourceFeatures>0&&r.textureAudit?.imagesReady===true;
const propertyPass=r=>r.started&&r.propertySettled&&r.audit?.result===true;
const elderPass=r=>r.elderCommitted&&r.elderMs!==null&&r.elderMs<=15000&&r.elder?.state==='committed';
const bluePass=naturalReady(first)&&naturalReady(second)&&fallbackZero(first)&&fallbackZero(second)&&key(first.style)===key(second.style);
const pass=propertyPass(first)&&propertyPass(second)&&elderPass(first)&&elderPass(second)&&bluePass;
console.log('EARTHLINE_FINAL_E2E_17412 '+JSON.stringify({browser:BROWSER,pass,bluePass,sameStyle:key(first.style)===key(second.style),first,second,errors}));
await context.close();await browser.close();
if(!pass)process.exitCode=1;
