import { chromium, firefox, webkit } from 'playwright';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';

async function openPage(browser){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'?property17382='+Date.now()+Math.random(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{state:'attached',timeout:30000});
  if(!(await page.locator('#searchInput').isVisible())){
    await page.evaluate(()=>{
      try{
        document.documentElement.classList.add('earthline-panel-open-16188');
        window.earthlineReconcilePanel16188?.();
        document.getElementById('earthlineRailSearch16188')?.click?.();
        window.earthlineReconcilePanel16188?.();
      }catch(_){}
    });
  }
  await page.waitForSelector('#searchInput',{state:'visible',timeout:15000});
  return {context,page,errors};
}
async function runVermontRegional(page){
  await page.locator('#searchInput').fill('Vermont');
  await page.waitForTimeout(700);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(await opts.count()) await opts.first().click();
  const rb=page.locator('#runBtn');
  if(await rb.isVisible()) await rb.click();
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:90000,polling:100});
}
const browser=await launcher.launch({headless});

/* Gate 1: one physical click must synchronously enter the authoritative Property owner.
   Scientific completion is deliberately not required here because DEM transport is a
   separate gate and must not mask the click lifecycle verdict. */
const a=await openPage(browser);
await runVermontRegional(a.page);
const pt={lng:-72.5778,lat:44.2601};
await a.page.evaluate(p=>new Promise(resolve=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(!m?.jumpTo)return resolve();
  let done=false;const f=()=>{if(done)return;done=true;resolve()};
  m.once?.('moveend',f);m.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});setTimeout(f,1200);
}),pt);
await a.page.evaluate(()=>{try{window.earthlineSyncPropertyTargetFromMap16201?.()}catch(_){}});
await a.page.waitForFunction(p=>{
  const b=document.getElementById('earthlineDeclareProperty16169'),t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  return b&&getComputedStyle(b).display!=='none'&&!b.disabled&&Math.abs(Number(t?.lng)-p.lng)<0.002&&Math.abs(Number(t?.lat)-p.lat)<0.002;
},pt,{timeout:15000,polling:100});
const before=await a.page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
const propertyClickAt=Date.now();
await a.page.locator('#earthlineDeclareProperty16169').click();
let oneClickStarted=false;
try{
  await a.page.waitForFunction(pre=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>pre||String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running',before,{timeout:3000,polling:50});
  oneClickStarted=true;
}catch(_){}
let elderSettled=false;
try{
  await a.page.waitForFunction(()=>{
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    return !!e&&(!!e.visibleAt||['committed','failed'].includes(String(e.state||'')));
  },null,{timeout:15000,polling:100});
  elderSettled=true;
}catch(_){}
const clickSnap=await a.page.evaluate(()=>({
  audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  runState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
  elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
  center:(()=>{try{const c=(window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null))?.getCenter?.();return c?{lng:Number(c.lng),lat:Number(c.lat)}:null}catch(_){return null}})()
}));
const elderMs=Date.now()-propertyClickAt;
const elderPass=elderSettled&&clickSnap.elder?.state!=='failed'&&!!(clickSnap.elder?.visibleAt||clickSnap.elder?.state==='committed')&&elderMs<=15000;
const targetOk=!!clickSnap.center&&Math.abs(Number(clickSnap.target?.lng)-Number(clickSnap.center.lng))<0.002&&Math.abs(Number(clickSnap.target?.lat)-Number(clickSnap.center.lat))<0.002;
await a.context.close();

/* Gate 2: renderer state must be independent of warm/cold history.
   Use verified fixture geometry only to exercise presentation ownership; this does
   not alter or substitute Earthline science and is never published to users. */
const b=await openPage(browser);
await b.page.waitForFunction(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);return !!m&&typeof window.earthlineSyncPropertyTexture16169==='function'&&(!m.isStyleLoaded||m.isStyleLoaded());},null,{timeout:30000,polling:100});
const fixtureReady=await b.page.evaluate(async()=>{
  try{
    const m=(typeof M!=='undefined'?M:null),s=window.earthlineRegional15778||(window.earthlineRegional15778={});
    if(!m)return {ok:false,error:'model unavailable'};
    s.mode='property';s.active=false;m.analysisReady=true;
    m.propertyResultLock15815={safetyVerified:true};
    m.safetyAudit15806={verified:true};
    m.authoritativeSafeSwales15815={type:'FeatureCollection',features:[{
      type:'Feature',id:'renderer-gate',
      properties:{rawIndex:17382},
      geometry:{type:'LineString',coordinates:[[-72.5780,44.2600],[-72.5768,44.2604],[-72.5758,44.2608]]}
    }]};
    window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221={count:1,visible:true};
    await window.earthlineSyncPropertyTexture16169('fixture-first-force');
    await new Promise(r=>setTimeout(r,650));
    await window.earthlineSyncPropertyTexture16169('natural-settle-force');
    return {ok:true};
  }catch(e){return {ok:false,error:String(e)}}
});
try{await b.page.waitForFunction(()=>!!window.EARTHLINE_PROPERTY_RENDER_STYLE_17382,null,{timeout:5000,polling:50})}catch(_){}
const style1=await b.page.evaluate(()=>window.EARTHLINE_PROPERTY_RENDER_STYLE_17382||null);
await b.page.evaluate(()=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const edits=[
    ['earthline-property-swale-natural-casing-16174','line-opacity',.11],
    ['earthline-property-swale-natural-up-16174','line-opacity',.19],
    ['earthline-property-swale-natural-flip-16174','line-opacity',.23],
    ['earthline-property-swale-neutral-16177','line-opacity',.27]
  ];
  for(const [id,p,v] of edits)try{if(mp?.getLayer?.(id))mp.setPaintProperty(id,p,v)}catch(_){}
});
await b.page.evaluate(async()=>{
  await window.earthlineSyncPropertyTexture16169('fixture-repeat-force');
  await new Promise(r=>setTimeout(r,650));
  await window.earthlineSyncPropertyTexture16169('natural-settle-force');
});
const style2=await b.page.evaluate(()=>window.EARTHLINE_PROPERTY_RENDER_STYLE_17382||null);
await b.context.close();
await browser.close();

const canonical=s=>JSON.stringify({
  upOpacity:s?.upOpacity??null,flipOpacity:s?.flipOpacity??null,
  upPattern:s?.upPattern??null,flipPattern:s?.flipPattern??null,
  casingOpacity:s?.casingOpacity??null,neutralOpacity:s?.neutralOpacity??null,
  safeWaterOpacity:s?.safeWaterOpacity??null
});
const blueConsistent=!!style1&&!!style2&&canonical(style1)===canonical(style2);
const pass=oneClickStarted&&targetOk&&elderPass&&fixtureReady.ok&&blueConsistent;
console.log('EARTHLINE_PROPERTY_17386 '+JSON.stringify({
  browser:BROWSER,pass,oneClickStarted,targetOk,elderPass,elderMs,fixtureReady,blueConsistent,
  style1,style2,clickSnap,errors:[...a.errors,...b.errors]
}));
if(!pass)process.exitCode=1;
