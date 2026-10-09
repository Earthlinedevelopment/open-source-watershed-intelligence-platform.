import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE=(process.env.EARTHLINE_URL||'http://127.0.0.1:8787/').replace(/\/?$/,'/');
const OUT='artifacts/v1-launch-stability-17075';
mkdirSync(OUT,{recursive:true});

const CASES=[
  {name:'desktop-1440',w:1440,h:900,mobile:false},
  {name:'tablet-1024',w:1024,h:768,mobile:false},
  {name:'tablet-768',w:768,h:1024,mobile:true},
  {name:'phone-430',w:430,h:932,mobile:true},
  {name:'phone-390',w:390,h:844,mobile:true}
];

const browser=await chromium.launch({headless:true});
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
    const vw=innerWidth,vh=innerHeight;
    const darkBlocking=[];
    for(const el of document.querySelectorAll('body *')){
      if(el.tagName==='CANVAS'||el.closest('.mapboxgl-map,#mapboxBase'))continue;
      const s=getComputedStyle(el);
      if(!['fixed','absolute'].includes(s.position))continue;
      const r=el.getBoundingClientRect();
      const area=Math.max(0,Math.min(r.right,vw)-Math.max(r.left,0))*Math.max(0,Math.min(r.bottom,vh)-Math.max(r.top,0));
      if(area<vw*vh*.28)continue;
      const bg=s.backgroundColor||'';
      const m=bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
      if(!m)continue;
      const rgb=(Number(m[1])+Number(m[2])+Number(m[3]))/3;
      const alpha=m[4]==null?1:Number(m[4]);
      if(rgb>55||alpha<.45)continue;
      darkBlocking.push({
        id:el.id||null,cls:String(el.className||'').slice(0,180),tag:el.tagName,
        areaRatio:Number((area/(vw*vh)).toFixed(3)),bg,opacity:s.opacity,
        pointerEvents:s.pointerEvents,borderRadius:s.borderRadius,z:s.zIndex,
        text:String(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,120)
      });
    }
    const busy=[];
    for(const el of document.querySelectorAll('[aria-busy="true"],[class*="spinner" i],[id*="spinner" i],[class*="loading" i],[id*="loading" i]')){
      const b=box(el); if(b?.visible)busy.push({id:el.id||null,cls:String(el.className||'').slice(0,160),...b});
    }
    const ids=['earthlineRail16188','earthlineRailSearch16188','earthlinePanel16188','earthlinePanelClose16188','earthlineLanguageWrap16488','earthlineLanguage16488','searchInput','runBtn','mapboxBase'];
    const boxes={}; for(const id of ids)boxes[id]=box(document.getElementById(id));
    const root=document.documentElement;
    return {
      label,
      readyState:document.readyState,
      viewport:{w:vw,h:vh},
      doc:{scrollW:root.scrollWidth,clientW:root.clientWidth,scrollH:root.scrollHeight,clientH:root.clientHeight},
      panelOpen:root.classList.contains('earthline-panel-open-16188'),
      boxes,darkBlocking,busy,
      mapPresent:!!(window.earthlineMap||document.querySelector('.mapboxgl-map')),
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
  const context=await browser.newContext({viewport:{width:tc.w,height:tc.h},isMobile:tc.mobile,hasTouch:tc.mobile,deviceScaleFactor:tc.mobile?2:1});
  const page=await context.newPage();
  const row={case:tc,errors:[],consoleErrors:[],requestsFailed:[],snaps:{},pass:{}};
  page.on('pageerror',e=>row.errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(m.text())});
  page.on('requestfailed',r=>row.requestsFailed.push({url:r.url(),error:r.failure()?.errorText||''}));
  try{
    const t0=Date.now();
    await page.goto(BASE+'?v1_stability_17075='+tc.name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('#searchInput',{state:'attached',timeout:15000});
    row.domReadyMs=Date.now()-t0;

    for(const [label,delay] of [['t0',0],['t1s',1000],['t3s',2000],['t7s',4000]]){
      if(delay)await page.waitForTimeout(delay);
      row.snaps[label]=await snap(page,label);
      await page.screenshot({path:`${OUT}/${tc.name}-${label}.png`,fullPage:false});
    }

    const s=row.snaps.t7s;
    const search=s.boxes.earthlineRailSearch16188;
    const languageWrap=s.boxes.earthlineLanguageWrap16488;
    const languageSelect=s.boxes.earthlineLanguage16488;
    row.pass.noBlockingDark=s.darkBlocking.length===0;
    row.pass.noPersistentBusy=s.busy.length===0;
    row.pass.searchVisible=!!search?.visible&&search.x>=-1&&search.x+search.w<=tc.w+1&&search.pointerEvents!=='none';
    row.pass.languageHidden=(!languageWrap||!languageWrap.visible)&&(!languageSelect||!languageSelect.visible);
    row.pass.noHorizontalOverflow=s.doc.scrollW<=tc.w+2;
    row.pass.no17070Owners=!s.owners.navReturn&&!s.owners.navRail;

    const before=s.panelOpen;
    await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
    await page.waitForTimeout(350);
    row.afterSearch=await snap(page,'after-search');
    row.pass.searchTogglesPanel=row.afterSearch.panelOpen!==before;

    const close=await page.locator('#earthlinePanelClose16188').count();
    if(close){
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

    row.pass.noPageErrors=row.errors.length===0;
    row.overall=Object.values(row.pass).every(Boolean);
  }catch(e){
    row.fatal=String(e);row.overall=false;
  }
  rows.push(row);
  writeFileSync(`${OUT}/${tc.name}-result.json`,JSON.stringify(row,null,2));
  console.log('EARTHLINE_V1_STABILITY_17075 '+JSON.stringify({case:tc.name,overall:row.overall,pass:row.pass,fatal:row.fatal||null,errors:row.errors.slice(0,3),consoleErrors:row.consoleErrors.slice(0,3)}));
  await context.close();
}
await browser.close();

const summary={
  total:rows.length,
  pass:rows.filter(r=>r.overall).length,
  fail:rows.filter(r=>!r.overall).length,
  failed:rows.filter(r=>!r.overall).map(r=>({case:r.case.name,pass:r.pass,fatal:r.fatal||null})),
  blackStartup:rows.filter(r=>Object.values(r.snaps||{}).some(s=>s.darkBlocking?.length)).map(r=>r.case.name),
  persistentBusy:rows.filter(r=>r.snaps?.t7s?.busy?.length).map(r=>r.case.name),
  pageErrors:rows.filter(r=>r.errors?.length).map(r=>({case:r.case.name,errors:r.errors.slice(0,5)}))
};
writeFileSync(`${OUT}/summary.json`,JSON.stringify({summary,rows},null,2));
console.log('EARTHLINE_V1_STABILITY_17075_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
