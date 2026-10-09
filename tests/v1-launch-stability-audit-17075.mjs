import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE=(process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/').replace(/\/?$/,'/');
const HOSTMAP=process.env.EARTHLINE_HOSTMAP==='1';
const OUT='artifacts/v1-launch-stability-17077';
mkdirSync(OUT,{recursive:true});

const CASES=[
  {name:'desktop-1440',w:1440,h:900,mobile:false},
  {name:'tablet-1024',w:1024,h:768,mobile:false},
  {name:'tablet-768',w:768,h:1024,mobile:true},
  {name:'phone-430',w:430,h:932,mobile:true},
  {name:'phone-390',w:390,h:844,mobile:true}
];

// Fixed regression area only. This is NOT an address-based Property launch.
// The map is moved here, then physically dragged so Earthline's existing
// dragend/moveend crosshair owners create the Property target.
const REGRESSION_CENTER={lng:-73.012909,lat:44.513845};

const launchArgs=HOSTMAP?['--host-resolver-rules=MAP earthlinedevelopment.org 127.0.0.1']:[];
const browser=await chromium.launch({headless:true,args:launchArgs});
const rows=[];

async function snap(page,label){
  return await page.evaluate(label=>{
    const box=el=>{
      if(!el)return null;
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      return {
        x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
        display:s.display,visibility:s.visibility,opacity:s.opacity,pointerEvents:s.pointerEvents,
        position:s.position,background:s.backgroundColor,borderRadius:s.borderRadius,zIndex:s.zIndex,
        visible:s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.02&&r.width>1&&r.height>1
      };
    };
    const ids=['earthlineRail16188','earthlineRailSearch16188','earthlinePanel16188','earthlinePanelClose16188','earthlineLanguageWrap16488','earthlineLanguage16488','searchInput','runBtn','mapboxBase','map','earthlineDeclareProperty16169','earthlineWhyNotHere15803'];
    const boxes={};for(const id of ids)boxes[id]=box(document.getElementById(id));
    let map=null;
    try{
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      if(m){
        map={
          exists:true,
          loaded:typeof m.loaded==='function'?m.loaded():null,
          styleLoaded:typeof m.isStyleLoaded==='function'?m.isStyleLoaded():null,
          tilesLoaded:typeof m.areTilesLoaded==='function'?m.areTilesLoaded():null,
          zoom:typeof m.getZoom==='function'?m.getZoom():null,
          center:typeof m.getCenter==='function'?m.getCenter():null,
          projection:typeof m.getProjection==='function'?m.getProjection():null
        };
      }
    }catch(e){map={exists:true,error:String(e)}}
    return {
      label,readyState:document.readyState,
      viewport:{w:innerWidth,h:innerHeight},
      doc:{scrollW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth},
      panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188'),
      analysisTier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
      propertyRunState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      boxes,map,
      propertyTarget:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      propertyRun:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      propertyPublication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      propertySafety:(typeof M!=='undefined'&&M)?M.safetyAudit15806||null:null,
      safeSwales:(typeof M!=='undefined'&&M)?Number(M.authoritativeSafeSwales15815?.length||0):0,
      owners:{
        language:window.earthlineLanguageOwner16890||null,
        uiEmergency:window.EARTHLINE_UI_EMERGENCY_17069||null,
        navReturn:window.EARTHLINE_NAV_RETURN_OWNER_17070||null,
        navRail:window.EARTHLINE_NAV_RAIL_EDGE_OWNER_17070||null
      }
    };
  },label);
}

async function runRegional(page){
  if(!await page.locator('#searchInput').count()||!await page.locator('#runBtn').count())return {ok:false,reason:'regional controls missing'};
  if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
    await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
    await page.waitForTimeout(250);
  }
  const started=Date.now();
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value='Vermont';
    i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));
    b.click();
  });
  try{
    await page.waitForFunction(()=>{
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
      return !!err||/screening published\./i.test(s);
    },{timeout:25000,polling:120});
  }catch(_){}
  return await page.evaluate(started=>({
    ok:/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),
    wallMs:Date.now()-started,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
  }),started);
}

async function moveCrosshairByRealDrag(page){
  // Camera navigation is allowed; Property target is NOT directly assigned.
  await page.evaluate(center=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m)throw new Error('map unavailable');
    m.jumpTo({center:[center.lng,center.lat],zoom:16.2,bearing:0,pitch:0});
  },REGRESSION_CENTER);
  await page.waitForTimeout(500);

  const canvas=page.locator('.mapboxgl-canvas').first();
  const b=await canvas.boundingBox();
  if(!b)throw new Error('map canvas unavailable for crosshair drag');

  // Physical drag reproduces the user's crosshair workflow and fires dragend.
  const x=b.x+b.width*0.55, y=b.y+b.height*0.55;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x+24,y+12,{steps:6});
  await page.mouse.up();
  await page.waitForTimeout(700);

  return await page.evaluate(()=>({
    center:(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);return m?.getCenter?.()||null}catch(_){return null}})(),
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    buttonText:String(document.getElementById('earthlineDeclareProperty16169')?.textContent||'').replace(/\s+/g,' ').trim(),
    buttonDisabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled
  }));
}

async function runCrosshairProperty(page){
  const moved=await moveCrosshairByRealDrag(page);
  const source=String(moved.target?.source||'');
  const targetIsCrosshair=source==='crosshair'||source.startsWith('crosshair-user-drag');
  if(!targetIsCrosshair)return {ok:false,stage:'target',moved,reason:'drag did not create crosshair target'};

  if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
    await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
    await page.waitForTimeout(250);
  }

  const started=Date.now();
  // Click the existing Property control. Do not call direct-address or target setters.
  await page.evaluate(()=>{
    const b=document.getElementById('earthlineDeclareProperty16169');
    if(!b)throw new Error('Property button missing');
    b.click();
  });

  try{
    await page.waitForFunction(()=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      return !!(a&&a.settled===true);
    },{timeout:22000,polling:150});
  }catch(_){}

  return await page.evaluate(({started,moved})=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const s=(typeof M!=='undefined'&&M)?M.safetyAudit15806||null:null;
    const lock=(typeof M!=='undefined'&&M)?M.propertyResultLock15815||null:null;
    const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return {
      ok:!!(a?.settled===true&&a?.result===true),
      wallMs:Date.now()-started,
      moved,
      target,
      targetSource:String(target?.source||''),
      run:a,
      publication:p,
      safety:s,
      lock,
      safeSwales:(typeof M!=='undefined'&&M)?Number(M.authoritativeSafeSwales15815?.length||0):0,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
    };
  },{started,moved});
}

for(const tc of CASES){
  const context=await browser.newContext({
    viewport:{width:tc.w,height:tc.h},
    isMobile:tc.mobile,hasTouch:tc.mobile,deviceScaleFactor:tc.mobile?2:1,
    ignoreHTTPSErrors:true
  });
  const page=await context.newPage();
  const row={case:tc,errors:[],consoleErrors:[],failedRequests:[],httpErrors:[],snaps:{},pass:{}};

  await page.route('https://ccucaqwbdsskcwxxbqiz.supabase.co/functions/v1/earthline-telemetry',route=>route.fulfill({status:204,body:''}));
  page.on('pageerror',e=>row.errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(m.text())});
  page.on('requestfailed',r=>row.failedRequests.push({url:r.url(),error:r.failure()?.errorText||''}));
  page.on('response',r=>{if(r.status()>=400)row.httpErrors.push({status:r.status(),url:r.url()})});

  try{
    const t0=Date.now();
    await page.goto(BASE+'?v1_stability_17077='+tc.name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('#searchInput',{state:'attached',timeout:15000});
    row.domReadyMs=Date.now()-t0;

    let elapsed=0;
    for(const [label,target] of [['t0',0],['t1s',1000],['t3s',3000],['t7s',7000],['t12s',12000]]){
      const wait=Math.max(0,target-elapsed); if(wait)await page.waitForTimeout(wait); elapsed=target;
      row.snaps[label]=await snap(page,label);
      await page.screenshot({path:`${OUT}/${tc.name}-${label}.png`,fullPage:false});
    }

    const s=row.snaps.t12s;
    const search=s.boxes.earthlineRailSearch16188;
    const languageWrap=s.boxes.earthlineLanguageWrap16488;
    const languageSelect=s.boxes.earthlineLanguage16488;

    row.pass.searchVisible=!!search?.visible&&search.x>=-1&&search.x+search.w<=tc.w+1&&search.pointerEvents!=='none';
    row.pass.languageHidden=(!languageWrap||!languageWrap.visible)&&(!languageSelect||!languageSelect.visible);
    row.pass.noHorizontalOverflow=s.doc.scrollW<=tc.w+2;
    row.pass.no17070Owners=!s.owners.navReturn&&!s.owners.navRail;
    row.pass.mapObjectPresent=!!s.map?.exists;
    row.pass.mapStyleLoaded=s.map?.styleLoaded!==false;
    row.pass.noPageErrorsAtStartup=row.errors.length===0;

    const before=s.panelOpen;
    await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
    await page.waitForTimeout(350);
    row.afterSearch=await snap(page,'after-search');
    row.pass.searchTogglesPanel=row.afterSearch.panelOpen!==before;

    if(await page.locator('#earthlinePanelClose16188').count()){
      await page.evaluate(()=>document.getElementById('earthlinePanelClose16188')?.click());
      await page.waitForTimeout(350);
      row.afterClose=await snap(page,'after-close');
      row.pass.panelCloses=row.afterClose.panelOpen===false;
      const sr=row.afterClose.boxes.earthlineRailSearch16188;
      row.pass.searchSurvivesClose=!!sr?.visible&&sr.x>=-1&&sr.x+sr.w<=tc.w+1;
    }else{
      row.pass.panelCloses=!row.afterSearch.panelOpen;
      row.pass.searchSurvivesClose=row.pass.searchVisible;
    }

    row.regional=await runRegional(page);
    row.pass.regionalPublished=row.regional.ok===true;
    row.pass.regionalUnder15=Number(row.regional?.perf?.totalMs||0)>0&&Number(row.regional?.perf?.totalMs||0)<=15000;

    row.crosshairProperty=await runCrosshairProperty(page);
    row.pass.crosshairTarget=/^crosshair(?:-user-drag)?/.test(String(row.crosshairProperty?.targetSource||''));
    row.pass.propertyPublished=row.crosshairProperty.ok===true;
    row.pass.propertyUnder15=Number(row.crosshairProperty?.wallMs||0)>0&&Number(row.crosshairProperty?.wallMs||0)<=15000;
    row.pass.safeSwales=Number(row.crosshairProperty?.safeSwales||0)>0;
    row.pass.propertySafety=row.crosshairProperty?.safety?.verified===true&&row.crosshairProperty?.lock?.safetyVerified===true;

    row.afterProperty=await snap(page,'after-property');
    await page.screenshot({path:`${OUT}/${tc.name}-after-property.png`,fullPage:false});

    row.mapboxHttpErrors=row.httpErrors.filter(x=>/mapbox\.com/i.test(x.url));
    row.otherHttpErrors=row.httpErrors.filter(x=>!/mapbox\.com/i.test(x.url));
    row.pass.noPageErrors=row.errors.length===0;
    row.overall=Object.values(row.pass).every(Boolean);
  }catch(e){row.fatal=String(e);row.overall=false}

  rows.push(row);
  writeFileSync(`${OUT}/${tc.name}-result.json`,JSON.stringify(row,null,2));
  console.log('EARTHLINE_V1_STABILITY_17077 '+JSON.stringify({
    case:tc.name,overall:row.overall,pass:row.pass,fatal:row.fatal||null,
    regional:{ok:row.regional?.ok||false,coreMs:row.regional?.perf?.totalMs||null,error:row.regional?.error||null},
    crosshairProperty:{ok:row.crosshairProperty?.ok||false,source:row.crosshairProperty?.targetSource||null,wallMs:row.crosshairProperty?.wallMs||null,safeSwales:row.crosshairProperty?.safeSwales||0},
    mapboxHttpErrors:row.mapboxHttpErrors?.slice(0,5)||[],
    errors:row.errors.slice(0,3)
  }));
  await context.close();
}
await browser.close();

const summary={
  total:rows.length,pass:rows.filter(r=>r.overall).length,fail:rows.filter(r=>!r.overall).length,
  failed:rows.filter(r=>!r.overall).map(r=>({case:r.case.name,pass:r.pass,fatal:r.fatal||null})),
  workflows:rows.map(r=>({
    case:r.case.name,
    regionalOk:r.regional?.ok||false,
    regionalCoreMs:r.regional?.perf?.totalMs||null,
    crosshairSource:r.crosshairProperty?.targetSource||null,
    propertyOk:r.crosshairProperty?.ok||false,
    propertyWallMs:r.crosshairProperty?.wallMs||null,
    safeSwales:r.crosshairProperty?.safeSwales||0
  })),
  pageErrors:rows.filter(r=>r.errors?.length).map(r=>({case:r.case.name,errors:r.errors.slice(0,5)}))
};
writeFileSync(`${OUT}/summary.json`,JSON.stringify({summary,rows},null,2));
console.log('EARTHLINE_V1_STABILITY_17077_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
