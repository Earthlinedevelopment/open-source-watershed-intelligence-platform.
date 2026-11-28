import {chromium} from 'playwright';
import {readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Read tested candidate assets from this exact checkout, never from mutable public JS.
const BASE='https://earthlinedevelopment.org/';
const ROOT=process.cwd();
const expected=createHash('sha256').update(readFileSync('index.html')).digest('hex');
mkdirSync('artifacts/mobile-release',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader']});
const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const page=await ctx.newPage(), errors=[],badResponses=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin===new URL(BASE).origin)badResponses.push(r.status()+' '+r.url())});
await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==new URL(BASE).origin)return route.continue();
  let rel;
  try{rel=decodeURIComponent(url.pathname).slice(1)}catch{return route.abort()}
  if(!rel)rel='index.html';
  const local=path.resolve(ROOT,rel);
  if(local!==ROOT&&!local.startsWith(ROOT+path.sep))return route.abort();
  if(existsSync(local)&&statSync(local).isFile()){
    const ext=path.extname(local).toLowerCase();
    const mime={'.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.geojson':'application/geo+json','.html':'text/html; charset=utf-8','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
    return route.fulfill({status:200,contentType:mime[ext]||'application/octet-stream',body:readFileSync(local)});
  }
  return route.continue();
});
const state=()=>page.evaluate(()=>{
  const el=document.documentElement;
  const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;
  const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
  const safe=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;
  const viewport=window.innerWidth;
  const panel=document.getElementById('earthlinePanel16188');
  const panelRect=panel?.getBoundingClientRect();
  return {viewport,open:el.classList.contains('earthline-panel-open-16188'),panelRight:panelRect?.right??null,
    tier:el.dataset.earthlineAnalysisTier||null,regionalCount:pub?.generated??null,
    regionalRunToken:pub?.runToken||null,propertyAudit:a,propertyPublication:p,safeVisibility:safe,
    safeCount:Number((typeof M!=='undefined'&&M?.authoritativeSafeSwales15815?.features?.length)||0),
    mapLoaded:!!map?.loaded?.(),mapCenter:map?.getCenter?.()||null,
    propertyState:el.dataset.earthlinePropertyRunState||null,runState:el.dataset.earthlineRunState||null,
    propertyLaunchAudit:(window.EARTHLINE_PROPERTY_LAUNCH_AUDIT_16322||[]).slice(-8),
    waterBodyGate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null,
    mobileClickTrace:window.__earthlineMobileClickTrace||[],
    mobileMutations:window.__earthlineMobileMutations||[],
    initialButtonHandler:window.__earthlineMobileButtonState||null,
    propertyTimeout:window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178||null,
    propertyPrefetch:window.EARTHLINE_PROPERTY_PREFETCH_AUDIT_16263?{ok:window.EARTHLINE_PROPERTY_PREFETCH_AUDIT_16263.ok,cacheHit:window.EARTHLINE_PROPERTY_PREFETCH_AUDIT_16263.cacheHit,driveways:window.EARTHLINE_PROPERTY_PREFETCH_AUDIT_16263.driveways?.features?.length,buildings:window.EARTHLINE_PROPERTY_PREFETCH_AUDIT_16263.buildings?.features?.length}:null,
    propertyPhaseTrace:(window.EARTHLINE_PROPERTY_PHASE_TRACE_16319||[]).slice(-14),
    currentStage:typeof M!=='undefined'?M.currentStage||null:null,
    lastTiming:typeof M!=='undefined'?M.lastTiming||null:null,
    propertyFailure:typeof M!=='undefined'?M.propertyFailure||null:null,
    button:{busy:document.getElementById('earthlineDeclareProperty16169')?.dataset.busy||null,disabled:document.getElementById('earthlineDeclareProperty16169')?.disabled||false},
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').slice(0,300)};
});
const report={candidateSha256:expected,origin:BASE,viewport:'390x844 touch',stages:[],errors,badResponses,pass:false};
async function checkpoint(name,condition){
  const snap=await state();
  const stage={name,pass:!!condition(snap),snapshot:snap};
  report.stages.push(stage);
  console.log('EARTHLINE_MOBILE_STAGE '+JSON.stringify({name,pass:stage.pass,open:snap.open,tier:snap.tier,regionalCount:snap.regionalCount,safeCount:snap.safeCount,published:snap.propertyPublication?.published||false}));
  await page.screenshot({path:'artifacts/mobile-release/'+name+'.png'}).catch(()=>{});
  return stage.pass;
}
try{
  await page.goto(BASE+'?mobile_release_candidate='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#earthlineRailSearch16188',{timeout:30000});
  await page.waitForTimeout(1800);
  await checkpoint('01-phone-startup',s=>s.viewport<=760&&!s.open&&s.panelRight<=80);
  await page.locator('#earthlineRailSearch16188').click();
  await page.waitForFunction(()=>document.documentElement.classList.contains('earthline-panel-open-16188'));
  await checkpoint('02-rail-opens',s=>s.open);
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    if(!i||!b)throw Error('Search/Run UI unavailable');
    i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  });
  await page.waitForFunction(()=>{
    const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    return Number(p?.generated||0)>0&&document.documentElement.dataset.earthlineAnalysisTier==='regional';
  },null,{timeout:90000,polling:250});
  await page.waitForFunction(()=>!document.documentElement.classList.contains('earthline-panel-open-16188'),null,{timeout:7000,polling:150});
  await checkpoint('03-region-exposes-map',s=>!s.open&&s.regionalCount>0&&s.tier==='regional');
  const prep=await page.evaluate(async()=>{
    const lng=-73.012909,lat=44.513845;
    if(typeof M==='undefined'||typeof window.earthlineSelectedSiteFromCenter!=='function'||typeof window.applyLocation!=='function')return {ok:false,why:'location helpers missing'};
    const site=window.earthlineSelectedSiteFromCenter(M.loc||null,lng,lat,20);
    if(!site)return {ok:false,why:'site missing'};
    const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,why:'applyLocation failed'};
    await new Promise(r=>setTimeout(r,850));
    const set=window.earthlineSetPropertyTarget16201?.({lng,lat,source:'mobile-release-fixed-vt'},{openPanel:false});
    return {ok:!!set,disabled:document.getElementById('earthlineDeclareProperty16169')?.disabled};
  });
  if(!prep.ok||prep.disabled)throw Error('Property prepare failed: '+JSON.stringify(prep));
  await page.locator('#earthlineRailSearch16188').click();
  await page.waitForFunction(()=>document.documentElement.classList.contains('earthline-panel-open-16188'));
  await page.waitForFunction(()=>document.getElementById('earthlinePanel16188')?.getBoundingClientRect().right>=innerWidth-3,null,{timeout:8000,polling:100});
  await page.waitForTimeout(750); // verify settled sidebar and 44px mobile touch target
  await checkpoint('04-property-button-available',s=>s.open&&s.panelRight>=s.viewport-3);
  await page.evaluate(()=>{
    const b=document.getElementById('earthlineDeclareProperty16169'),r=b?.getBoundingClientRect();
    window.__earthlineMobileClickTrace=[];
    window.__earthlineMobileMutations=[];
    let firstTarget=null,firstButton=null;
    const snapTarget=target=>({connected:!!target?.isConnected,stillWithinButton:!!target&&b.contains(target),sameButton:document.getElementById('earthlineDeclareProperty16169')===b,buttonConnected:b.isConnected,buttonParent:b.parentElement?.id||null,buttonText:b.textContent?.slice(0,90),buttonRect:(()=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})(),scrollTop:document.getElementById('earthlinePanelBody16188')?.scrollTop||0});
    const addMutation=(label,m)=>{const rows=window.__earthlineMobileMutations;if(rows.length>=110)return;
       rows.push({label,type:m.type,added:[...m.addedNodes||[]].map(x=>x.nodeName+'#'+(x.id||'')).slice(0,8),removed:[...m.removedNodes||[]].map(x=>x.nodeName+'#'+(x.id||'')).slice(0,8),current:snapTarget(firstTarget)});
    };
    new MutationObserver(mm=>{for(const m of mm)addMutation('button-subtree',m)}).observe(b,{subtree:true,childList:true});
    new MutationObserver(mm=>{for(const m of mm)if([...m.removedNodes||[],...m.addedNodes||[]].some(x=>x===b))addMutation('button-reparent',m)}).observe(document.body,{subtree:true,childList:true});
    window.__earthlineMobileButtonState={
      onclick:String(b?.onclick).slice(0,260),
      clickOwner:b?.dataset.earthlinePropertyClickOwner16546||null,
      disabled:b?.disabled,ready:document.documentElement.classList.contains('earthline-property-ready-16188'),
      visibleClass:b?.classList.contains('visible'),style:getComputedStyle(b).display,
      pointerEvents:getComputedStyle(b).pointerEvents,rect:r&&{x:r.x,y:r.y,width:r.width,height:r.height},
      topAtButtonCenter:r&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.id||null,
      governed:typeof window.earthlineDeclarePropertyAtCrosshair16173
    };
    for(const event of ['pointerdown','pointerup','pointercancel','click'])document.addEventListener(event,e=>{
      const node=e.target?.closest?.('#earthlineDeclareProperty16169')||null;
      if(event==='pointerdown'){firstTarget=e.target;firstButton=b}
      window.__earthlineMobileClickTrace.push({event,phase:'document-capture',insideButton:!!node,targetId:e.target?.id||null,targetTag:e.target?.tagName||null,disabled:b.disabled,originalTarget:snapTarget(firstTarget),targetAtPoint:document.elementFromPoint(e.clientX||0,e.clientY||0)?.id||document.elementFromPoint(e.clientX||0,e.clientY||0)?.tagName||null});
    },true);
    b?.addEventListener('click',e=>window.__earthlineMobileClickTrace.push({event:'click',phase:'button-capture',disabled:b.disabled}),true);
  });
  await page.locator('#earthlineDeclareProperty16169').click({timeout:20000});
  await page.waitForTimeout(1500);
  const propertyLaunched=await checkpoint('05-property-action-result',s=>s.propertyState==='running'||!!s.propertyAudit||!!s.propertyPublication);
  if(!propertyLaunched)throw Error('Property button click did not launch the governed Property owner');
  await page.waitForFunction(()=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    return a?.settled===true&&p?.published===true&&document.documentElement.dataset.earthlineAnalysisTier==='property'&&document.documentElement.dataset.earthlinePropertyRunState!=='running';
  },null,{timeout:75000,polling:220});
  await page.waitForFunction(()=>!document.documentElement.classList.contains('earthline-panel-open-16188'),null,{timeout:7000,polling:150});
  await checkpoint('06-property-exposes-map',s=>!s.open&&s.tier==='property'&&s.safeCount>0&&s.propertyAudit?.result===true&&s.safeVisibility?.visible===true);
}catch(e){
  report.exception=String(e);
  report.failureSnapshot=await state().catch(error=>({error:String(error)}));
  await page.screenshot({path:'artifacts/mobile-release/99-failure.png'}).catch(()=>{});
  console.error('EARTHLINE_MOBILE_EXCEPTION '+String(e));
  console.error('EARTHLINE_MOBILE_FAILURE_STATE '+JSON.stringify(report.failureSnapshot).slice(0,11000));
}finally{
  report.pass=report.stages.length===6&&report.stages.every(s=>s.pass)&&errors.length===0&&!report.exception;
  writeFileSync('artifacts/mobile-release/results.json',JSON.stringify(report,null,2));
  console.log('EARTHLINE_MOBILE_SUMMARY '+JSON.stringify({pass:report.pass,candidateSha256:expected,stages:report.stages.map(s=>({name:s.name,pass:s.pass})),exception:report.exception||null,errors:errors.slice(0,8),badResponses:badResponses.slice(0,8)}));
  await browser.close();
}
if(!report.pass)process.exitCode=1;
