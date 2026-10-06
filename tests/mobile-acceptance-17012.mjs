import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const cases=[
 {name:'phone-small',w:360,h:800,mobile:true},
 {name:'phone-regular',w:390,h:844,mobile:true},
 {name:'phone-large',w:430,h:932,mobile:true},
 {name:'phone-landscape',w:844,h:390,mobile:true},
 {name:'desktop',w:1440,h:900,mobile:false}
];
const rows=[];
for(const tc of cases){
 const context=await browser.newContext({viewport:{width:tc.w,height:tc.h},isMobile:tc.mobile,hasTouch:tc.mobile,deviceScaleFactor:tc.mobile?2:1});
 const page=await context.newPage(),errors=[]; page.on('pageerror',e=>errors.push(String(e)));
 const row={name:tc.name};
 try{
  await page.goto('https://earthlinedevelopment.org/?accept17012='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:20000}); await page.waitForTimeout(1200);
  const snap=async()=>page.evaluate(()=>{const b=id=>{const e=document.getElementById(id);if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),visible:s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0.01,pe:s.pointerEvents}};return{rail:b('earthlineRail16188'),panel:b('earthlinePanel16188'),login:b('earthlineLaunchLogin16872'),donate:b('earthlineLaunchDonate16872'),merch:b('earthlineLaunchMerch16872'),docW:document.documentElement.scrollWidth,panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188')}});

  let tapOk=true;
  if(tc.mobile){
    const s0=await snap();
    if(!s0.panelOpen){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(250);}
    row.open=await snap();
    await page.locator('#searchInput').fill('61 Sle'); await page.waitForTimeout(700);
    const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').first();
    tapOk=false;
    if(await opt.count()){await opt.tap({timeout:8000});await page.waitForTimeout(250);tapOk=/61 Sleepy Hollow/i.test(await page.locator('#searchInput').inputValue());}
    await page.evaluate(()=>document.getElementById('earthlinePanelClose16188')?.click()); await page.waitForTimeout(250);
  }
  row.closed=await snap();

  const regStart=Date.now();
  await page.evaluate(()=>{if(!document.documentElement.classList.contains('earthline-panel-open-16188'))document.getElementById('earthlineRailSearch16188')?.click()});
  await page.waitForTimeout(150);
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click()});
  await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||''))||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:30000,polling:120}).catch(()=>{});
  row.regional=await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')}));
  row.regional.wallMs=Date.now()-regStart;

  const prep=await page.evaluate(async()=>{const t={lng:-73.012909,lat:44.513845};const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,t.lng,t.lat,20);const ok=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});if(!ok)return false;await new Promise(r=>setTimeout(r,700));return !!window.earthlineSetPropertyTarget16201({lng:t.lng,lat:t.lat,source:'accept17012'},{openPanel:false})});
  const p0=Date.now(); let pErr=null;
  if(prep){try{await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169())}catch(e){pErr=String(e)}}
  row.property=await page.evaluate(()=>({audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,safety:M?.safetyAudit15806||null,lock:M?.propertyResultLock15815||null,safe:Number(M?.authoritativeSafeSwales15815?.length||0)}));
  row.property.wallMs=Date.now()-p0; row.property.error=pErr;

  let report=false; if(await page.locator('#earthlineVermontReport16149').count()){await page.evaluate(()=>document.getElementById('earthlineVermontReport16149')?.click());await page.waitForTimeout(300);report=await page.evaluate(()=>document.getElementById('earthlineVermontReportPanel16149')?.classList.contains('open')||false)}
  const railXs=[row.open,row.closed].filter(Boolean).map(s=>[s.rail?.x,s.login?.x,s.donate?.x,s.merch?.x]);
  const railStable=!tc.mobile||railXs.every(v=>JSON.stringify(v)===JSON.stringify(railXs[0]));
  const sheet=!tc.mobile||!!(row.open?.panel?.visible&&row.open.panel.x>=52&&row.open.panel.x<=56&&row.open.panel.y>0&&row.open.panel.h<tc.h&&row.open.rail?.visible);
  const regMs=Number(row.regional?.perf?.totalMs||0);
  const regionalPass=!row.regional.error&&/screening published\./i.test(row.regional.status)&&regMs>0&&regMs<=15000;
  const propertyPass=prep&&!pErr&&row.property.audit?.settled===true&&row.property.audit?.result===true&&row.property.safe>0&&row.property.safety?.verified===true&&row.property.lock?.safetyVerified===true&&row.property.wallMs<=15000;
  row.pass={tapOk,railStable,sheet,overflow:row.closed.docW<=tc.w+2,regionalPass,propertyPass,report,noErrors:errors.length===0};
  row.overall=Object.values(row.pass).every(Boolean);
 }catch(e){row.fatal=String(e);row.overall=false}
 rows.push(row); console.log('EARTHLINE_ACCEPT17012 '+JSON.stringify({name:row.name,overall:row.overall,pass:row.pass,regionalMs:row.regional?.perf?.totalMs||null,propertyMs:row.property?.wallMs||null,fatal:row.fatal||null}));
 await context.close();
}
await browser.close();
const summary={total:rows.length,pass:rows.filter(r=>r.overall).length,fail:rows.filter(r=>!r.overall).length};
console.log('EARTHLINE_ACCEPT17012_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;