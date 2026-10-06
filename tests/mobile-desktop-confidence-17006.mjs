// FINAL deployed-state mobile confidence 17010
// post-deploy mobile chrome verification 17007
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const TARGET={lng:-73.012909,lat:44.513845,label:'61 Sleepy Hollow Rd, Essex, Vermont, USA'};
const CASES=[
  {name:'iphone-se-ish',w:360,h:800,mobile:true},
  {name:'iphone-regular',w:390,h:844,mobile:true},
  {name:'iphone-large',w:430,h:932,mobile:true},
  {name:'phone-landscape',w:844,h:390,mobile:false,landscape:true},
  {name:'desktop-control',w:1440,h:900,mobile:false,desktop:true}
];
const OUT='artifacts/mobile-desktop-confidence-17006';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];

function visibleBoxExpr(){
  return `el=>{if(!el)return null;const s=getComputedStyle(el),r=el.getBoundingClientRect();return {display:s.display,visibility:s.visibility,opacity:s.opacity,pointerEvents:s.pointerEvents,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bg:s.backgroundColor,z:s.zIndex,visible:s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&r.width>1&&r.height>1}}`;
}

for(const tc of CASES){
  const context=await browser.newContext({viewport:{width:tc.w,height:tc.h},isMobile:tc.mobile,hasTouch:tc.mobile,deviceScaleFactor:tc.mobile?2:1});
  const page=await context.newPage();
  const errors=[]; const consoleErrors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  const row={case:tc,steps:{},errors,consoleErrors};
  try{
    const started=Date.now();
    await page.goto(BASE+'?mobile_desktop_confidence_17006='+tc.name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{state:'attached',timeout:20000});
    await page.waitForTimeout(1400);
    row.steps.loadMs=Date.now()-started;

    const audit=async label=>{
      const x=await page.evaluate(()=>{
        const box=el=>{if(!el)return null;const s=getComputedStyle(el),r=el.getBoundingClientRect();return {display:s.display,visibility:s.visibility,opacity:s.opacity,pointerEvents:s.pointerEvents,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bg:s.backgroundColor,z:s.zIndex,visible:s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&r.width>1&&r.height>1}};
        const ids=['earthlineRail16188','earthlinePanel16188','earthlinePanelClose16188','runBtn','earthlineDeclareProperty16169','earthlineSwaleLegend16050','earthlineAquiferLegend16070','earthlineDiagramLegend16080','earthlineWhyNotHere15803','earthlineLaunchFallbackRail16872','earthlineRechargeDataPanel16488','earthlineVermontReportPanel16149'];
        const map={}; for(const id of ids)map[id]=box(document.getElementById(id));
        for(const [i,e] of [...document.querySelectorAll('.scalebar')].entries())map['scalebar'+i]=box(e);
        return {
          inner:{w:innerWidth,h:innerHeight},
          doc:{scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,clientW:document.documentElement.clientWidth,clientH:document.documentElement.clientHeight},
          viewport:document.querySelector('meta[name="viewport"]')?.content||null,
          panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188'),
          mobileAudit:window.earthlineMobileAudit17003?.()||null,
          mobileStack:window.EARTHLINE_MOBILE_PANEL_STACK_17004||null,
          publicCoverage:window.EARTHLINE_PUBLIC_COVERAGE_UI_17005||null,
          boxes:map
        };
      });
      writeFileSync(`${OUT}/${tc.name}-${label}.json`,JSON.stringify(x,null,2));
      return x;
    };

    row.steps.initial=await audit('01-initial');
    await page.screenshot({path:`${OUT}/${tc.name}-01-initial.png`,fullPage:true});

    if(tc.mobile){
      if(!row.steps.initial.panelOpen){
        await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
        await page.waitForTimeout(350);
      }
      row.steps.panelOpened=await audit('02-panel-open');
      await page.screenshot({path:`${OUT}/${tc.name}-02-panel-open.png`,fullPage:true});
      const rail=row.steps.panelOpened.boxes.earthlineRail16188;
      const panel=row.steps.panelOpened.boxes.earthlinePanel16188;
      row.steps.panelPriority=!!(panel?.visible && panel.w>=tc.w-2 && (!rail?.visible || rail.pointerEvents==='none'));
      await page.evaluate(()=>document.getElementById('earthlinePanelClose16188')?.click());
      await page.waitForTimeout(500);
      row.steps.afterClose=await audit('03-after-close');
      await page.screenshot({path:`${OUT}/${tc.name}-03-after-close.png`,fullPage:true});
    }

    // Real Regional run through the public controls.
    await page.evaluate(()=>{
      const open=document.documentElement.classList.contains('earthline-panel-open-16188');
      if(!open)document.getElementById('earthlineRailSearch16188')?.click();
    });
    await page.waitForTimeout(250);
    const regionalStarted=Date.now();
    await page.evaluate(()=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.focus(); i.value='Vermont'; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); b.click();
    });
    try{
      await page.waitForFunction(()=>{
        const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(err)return true;
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;
      },{timeout:30000,polling:120});
    }catch(_){}
    await page.waitForTimeout(500);
    row.steps.regional=await page.evaluate(()=>({
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
      flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
      boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
      lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
      panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188')
    }));
    row.steps.regional.wallMs=Date.now()-regionalStarted;
    row.steps.postRegional=await audit('04-post-regional');
    await page.screenshot({path:`${OUT}/${tc.name}-04-post-regional.png`,fullPage:true});

    // Real fixed-site Property run through the authoritative Property owner.
    const prep=await page.evaluate(async target=>{
      try{
        const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
        const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
        if(!applied)return {ok:false,reason:'applyLocation rejected'};
        await new Promise(r=>setTimeout(r,1000));
        const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source:'mobile-confidence-17006'},{openPanel:false});
        return {ok:!!set,ready:document.documentElement.classList.contains('earthline-property-ready-16188')};
      }catch(e){return {ok:false,reason:String(e)}}
    },TARGET);
    row.steps.propertyPrep=prep;
    const propStarted=Date.now();
    let propCall=null,propError=null;
    if(prep.ok){
      try{propCall=await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());}catch(e){propError=String(e)}
    }
    row.steps.propertyWallMs=Date.now()-propStarted;
    row.steps.property=await page.evaluate(()=>({
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      safety:M?.safetyAudit15806||null,
      lock:M?.propertyResultLock15815||null,
      boundary:window.EARTHLINE_PROPERTY_BOUNDARY_AUDIT_16178||null,
      swales:Number(M?.swales?.length||0),
      safeSwales:Number(M?.authoritativeSafeSwales15815?.length||0),
      recharge:Number(M?.rechZones?.length||0),
      state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
      debugVisible:(()=>{const e=document.getElementById('earthlineWhyNotHere15803');if(!e)return false;const c=getComputedStyle(e),r=e.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&r.width>1&&r.height>1})()
    }));
    row.steps.property.call=propCall; row.steps.property.callError=propError;
    row.steps.postProperty=await audit('05-post-property');
    await page.screenshot({path:`${OUT}/${tc.name}-05-post-property.png`,fullPage:true});

    // Zoom/camera interaction must not destroy controls or results.
    await page.evaluate(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null); if(m?.getZoom&&m?.zoomTo)m.zoomTo(m.getZoom()+0.7,{duration:0});}catch(_){}});
    await page.waitForTimeout(500);
    row.steps.afterZoom=await audit('06-after-zoom');

    // Report surface opens after Property.
    row.steps.report={attempted:false,opened:false};
    const reportExists=await page.locator('#earthlineVermontReport16149').count();
    if(reportExists){
      row.steps.report.attempted=true;
      await page.evaluate(()=>document.getElementById('earthlineVermontReport16149')?.click());
      await page.waitForTimeout(500);
      row.steps.report.opened=await page.evaluate(()=>{const e=document.getElementById('earthlineVermontReportPanel16149');if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>20&&r.height>20});
      await page.screenshot({path:`${OUT}/${tc.name}-07-report.png`,fullPage:true});
    }

    // Final pass criteria.
    const reg=row.steps.regional;
    const prop=row.steps.property;
    const regCore=Number(reg?.perf?.totalMs||0);
    const regPublished=/screening published\./i.test(reg?.status||'');
    const unsafe=reg?.flow?.unsafeSegments;
    const outside=reg?.boundary?.outsideAfterClip;
    const regionalPass=!reg?.lastError&&regPublished&&regCore>0&&regCore<=15000&&(unsafe==null||Number(unsafe)===0)&&(outside==null||Number(outside?.swales||0)===0);
    const corridors=Number(prop?.audit?.corridors??prop?.safeSwales??prop?.swales??0);
    const propertyPass=!propError&&prep.ok&&prop?.audit?.result===true&&prop?.audit?.settled===true&&corridors>0&&prop?.safety?.verified===true&&prop?.lock?.safetyVerified===true&&!prop?.debugVisible&&row.steps.propertyWallMs<=15000;
    const overflowPass=row.steps.initial.doc.scrollW<=tc.w+2;
    const panelPass=!tc.mobile||row.steps.panelPriority===true;
    const chromeIds=['earthlineSwaleLegend16050','earthlineAquiferLegend16070','earthlineDiagramLegend16080','scalebar0'];
    const mobileChromePass=!tc.mobile||chromeIds.every(id=>!row.steps.afterClose?.boxes?.[id]?.visible)&&chromeIds.every(id=>!row.steps.postRegional?.boxes?.[id]?.visible);
    const reportPass=row.steps.report.attempted===true&&row.steps.report.opened===true;
    row.pass={regionalPass,propertyPass,overflowPass,panelPass,mobileChromePass,reportPass,noPageErrors:errors.length===0};
    row.overall=Object.values(row.pass).every(Boolean);
  }catch(e){
    row.fatal=String(e); row.overall=false;
  }
  rows.push(row);
  writeFileSync(`${OUT}/${tc.name}-summary.json`,JSON.stringify(row,null,2));
  console.log('EARTHLINE_MOBILE_DESKTOP_17006 '+JSON.stringify({case:tc.name,overall:row.overall,pass:row.pass,fatal:row.fatal||null,regionalCoreMs:row.steps?.regional?.perf?.totalMs??null,propertyWallMs:row.steps?.propertyWallMs??null,errors:row.errors?.slice(0,3)}));
  await context.close();
}
await browser.close();

const summary={total:rows.length,pass:rows.filter(r=>r.overall).length,fail:rows.filter(r=>!r.overall).length,failed:rows.filter(r=>!r.overall).map(r=>({case:r.case.name,pass:r.pass,fatal:r.fatal||null}))};
writeFileSync(`${OUT}/summary.json`,JSON.stringify({summary,rows},null,2));
console.log('EARTHLINE_MOBILE_DESKTOP_17006_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
