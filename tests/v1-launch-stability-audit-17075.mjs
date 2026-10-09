import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE=(process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/').replace(/\/?$/,'/');
const HOSTMAP=process.env.EARTHLINE_HOSTMAP==='1';
const OUT='artifacts/v1-launch-stability-17076';
mkdirSync(OUT,{recursive:true});

const CASES=[
  {name:'desktop-1440',w:1440,h:900,mobile:false},
  {name:'tablet-1024',w:1024,h:768,mobile:false},
  {name:'tablet-768',w:768,h:1024,mobile:true},
  {name:'phone-430',w:430,h:932,mobile:true},
  {name:'phone-390',w:390,h:844,mobile:true}
];

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
        position:s.position,background:s.backgroundColor,borderRadius:s.borderRadius,
        visible:s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.02&&r.width>1&&r.height>1
      };
    };
    const ids=['earthlineRail16188','earthlineRailSearch16188','earthlinePanel16188','earthlinePanelClose16188','earthlineLanguageWrap16488','earthlineLanguage16488','searchInput','runBtn','mapboxBase'];
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
      boxes,map,
      owners:{
        language:window.earthlineLanguageOwner16890||null,
        uiEmergency:window.EARTHLINE_UI_EMERGENCY_17069||null,
        navReturn:window.EARTHLINE_NAV_RETURN_OWNER_17070||null,
        navRail:window.EARTHLINE_NAV_RAIL_EDGE_OWNER_17070||null
      }
    };
  },label);
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
    await page.goto(BASE+'?v1_stability_17076='+tc.name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
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
    row.pass.noPageErrors=row.errors.length===0;

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

    row.mapboxHttpErrors=row.httpErrors.filter(x=>/mapbox\.com/i.test(x.url));
    row.otherHttpErrors=row.httpErrors.filter(x=>!/mapbox\.com/i.test(x.url));
    row.overall=Object.values(row.pass).every(Boolean);
  }catch(e){row.fatal=String(e);row.overall=false}

  rows.push(row);
  writeFileSync(`${OUT}/${tc.name}-result.json`,JSON.stringify(row,null,2));
  console.log('EARTHLINE_V1_STABILITY_17076 '+JSON.stringify({
    case:tc.name,overall:row.overall,pass:row.pass,fatal:row.fatal||null,
    mapT0:row.snaps?.t0?.map||null,mapT12:row.snaps?.t12s?.map||null,
    mapboxHttpErrors:row.mapboxHttpErrors?.slice(0,8)||[],
    otherHttpErrors:row.otherHttpErrors?.slice(0,8)||[],
    errors:row.errors.slice(0,3)
  }));
  await context.close();
}
await browser.close();

const summary={
  total:rows.length,pass:rows.filter(r=>r.overall).length,fail:rows.filter(r=>!r.overall).length,
  failed:rows.filter(r=>!r.overall).map(r=>({case:r.case.name,pass:r.pass,fatal:r.fatal||null})),
  mapboxErrors:rows.map(r=>({case:r.case.name,count:r.mapboxHttpErrors?.length||0,sample:r.mapboxHttpErrors?.slice(0,3)||[]})),
  pageErrors:rows.filter(r=>r.errors?.length).map(r=>({case:r.case.name,errors:r.errors.slice(0,5)}))
};
writeFileSync(`${OUT}/summary.json`,JSON.stringify({summary,rows},null,2));
console.log('EARTHLINE_V1_STABILITY_17076_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
