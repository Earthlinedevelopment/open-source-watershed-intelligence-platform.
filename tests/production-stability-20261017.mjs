import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'https://earthlinedevelopment.org/';
const BROWSER = String(process.env.BROWSER || 'chromium').toLowerCase();
const STATE = String(process.env.STATE || 'Arizona');
const MOBILE = String(process.env.MOBILE || '0') === '1';
const VIEW = String(process.env.VIEW || 'portrait');
const REPS = Number(process.env.REPS || (MOBILE ? 1 : 3));
const TARGETS = {
  Arizona: [-111.7000,34.9500],
  'New Mexico': [-106.0000,35.2500],
  Colorado: [-105.8000,39.0000],
  Texas: [-97.6000,30.5000],
  California: [-120.8000,38.4000],
  Vermont: [-73.012909,44.513845],
  'New York': [-73.5000,42.5000]
};
if (!TARGETS[STATE]) throw new Error('Unknown state ' + STATE);
const OUT = 'artifacts/production-stability-20261017/' + BROWSER + '/' + STATE.toLowerCase().replace(/\s+/g,'-') + (MOBILE ? '-' + VIEW : '');
mkdirSync(OUT,{recursive:true});
const type = BROWSER === 'firefox' ? firefox : BROWSER === 'webkit' ? webkit : chromium;
const launch = {headless:true};
if (BROWSER === 'chrome') launch.channel = 'chrome';
if (BROWSER === 'edge') launch.channel = 'msedge';
const browser = await type.launch(launch);
const size = MOBILE ? (VIEW === 'landscape' ? {width:844,height:390} : {width:390,height:844}) : {width:1800,height:950};
const context = await browser.newContext({viewport:size,isMobile:MOBILE,hasTouch:MOBILE,deviceScaleFactor:MOBILE?2:1});
const page = await context.newPage();
const pageErrors = [];
const consoleErrors = [];
page.on('pageerror',e=>pageErrors.push({at:Date.now(),text:String(e)}));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push({at:Date.now(),text:m.text().slice(0,350)})});
let regionalCount = 0;
const rows = [];
const onboarding = {first:null,samePage:null,afterReload:null};
const visible = e => {
  if (!e) return false;
  const r=e.getBoundingClientRect(),s=getComputedStyle(e);
  return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity||1)>0;
};

async function hintSnapshot(){
  return page.evaluate(()=>{
    const e=document.getElementById('earthlineCrosshairMoveHint17093');
    if(!e)return {present:false,visible:false,text:''};
    const s=getComputedStyle(e),r=e.getBoundingClientRect();
    return {present:true,visible:r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden',text:String(e.textContent||'').replace(/\s+/g,' ').trim()};
  });
}
async function dismissHint(){
  const btn=page.locator('#earthlineCrosshairMoveHint17093 button');
  try{if(await btn.count())await btn.first().click({timeout:2500});}catch(e){return String(e)}
  return null;
}
async function openSearchMobile(){
  if(!MOBILE)return;
  try{
    const isOpen=await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'));
    if(!isOpen)await page.locator('#earthlineRailSearch16188').click({timeout:5000});
  }catch(_){}
}
async function runRegional(label){
  const t0=Date.now();
  const before=await page.evaluate(()=>String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||''));
  const row={label,started:new Date().toISOString(),beforeRunToken:before,pass:false,firstDivergence:null};
  try{
    await openSearchMobile();
    await page.locator('#searchInput').fill(STATE,{timeout:15000});
    await page.waitForTimeout(1200);
    const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
    row.suggestionCount=await opts.count();
    if(!row.suggestionCount)throw new Error('search-suggestion-missing');
    await opts.first().click({timeout:6000});
    await page.waitForTimeout(200);
    await page.locator('#runBtn').click({timeout:12000});
    await page.waitForFunction(prev=>{
      const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      if(e)return true;
      const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
      const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      return !!p && !!p.runToken && String(p.runToken)!==prev && /screening published\./i.test(s);
    },before,{timeout:140000,polling:200});
    await page.waitForTimeout(400);
    const snap=await page.evaluate(()=>({
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
      display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
      flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
      boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
      error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
    }));
    row.coreMs=snap.perf?.totalMs??null;
    row.runToken=snap.perf?.runToken??null;
    row.terrainSource=snap.perf?.terrainSource??null;
    row.generated=snap.pub?.generated??null;
    row.visible=snap.display?.swaleLines??snap.pub?.overlaySwaleLines??null;
    row.unsafe=snap.flow?.unsafeSegments??null;
    row.outside=snap.boundary?.outsideAfterClip??null;
    row.status=snap.status;
    row.error=snap.error;
    row.checks={
      published:!snap.error&&/screening published\./i.test(snap.status),
      performance:Number(row.coreMs)>0&&Number(row.coreMs)<=15000,
      visibleMatches:Number(row.generated)===Number(row.visible),
      safe:Number(row.unsafe)===0&&Number(row.outside?.swales||0)===0,
      identity:!!row.runToken&&row.runToken!==before
    };
    row.pass=Object.values(row.checks).every(Boolean);
    row.firstDivergence=Object.entries(row.checks).find(([k,v])=>!v)?.[0]||null;
  }catch(e){
    row.error=String(e);
    row.firstDivergence=/suggestion/i.test(row.error)?'search-suggestion':/Timeout/i.test(row.error)?'regional-timeout':'regional-ui';
  }
  row.elapsedMs=Date.now()-t0;
  regionalCount++;
  console.log('EARTHLINE_CERT_REGIONAL_20261017 '+JSON.stringify(row));
  return row;
}

async function propertyOneClick(label){
  const t0=Date.now();
  const [lng,lat]=TARGETS[STATE];
  const row={label,lng,lat,started:new Date().toISOString(),pass:false,firstDivergence:null};
  try{
    await dismissHint();
    if(MOBILE){
      try{await page.locator('#earthlinePanelClose16188').click({timeout:2000})}catch(_){}
    }
    // Do not inject a Property target: exercise the real crosshair/camera handoff.
    await page.locator('#map').dispatchEvent('pointerdown',{bubbles:true,clientX:Math.floor(size.width/2),clientY:Math.floor(size.height/2),pointerType:'mouse',button:0});
    await page.evaluate(({lng,lat})=>new Promise((resolve,reject)=>{
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      if(!m?.jumpTo)return reject(new Error('map-not-available'));
      let done=false;
      const finish=()=>{if(done)return;done=true;resolve(true)};
      try{m.once?.('moveend',finish);m.jumpTo({center:[lng,lat],zoom:16.78,bearing:0,pitch:0});setTimeout(finish,1800)}catch(e){reject(e)}
    }),{lng,lat});
    await page.waitForTimeout(650);
    const pre=await page.evaluate(()=>({
      serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      mapCenter:(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);const c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat}:null}catch(_){return null}})()
    }));
    row.pre=pre;
    row.targetOk=!!pre.target&&Math.abs(Number(pre.target.lng)-lng)<0.002&&Math.abs(Number(pre.target.lat)-lat)<0.002;
    row.centerOk=!!pre.mapCenter&&Math.abs(Number(pre.mapCenter.lng)-lng)<0.002&&Math.abs(Number(pre.mapCenter.lat)-lat)<0.002;
    if(!row.centerOk)throw new Error('map-center-mismatch');
    if(!row.targetOk)throw new Error('property-target-mismatch-before-click');
    let button=page.locator('#earthlineDeclareProperty16169');
    if(MOBILE){
      const mobileButton=page.locator('#earthlineMobilePropertyAction17004');
      if(await mobileButton.isVisible().catch(()=>false))button=mobileButton;
      else await openSearchMobile();
    }
    await button.waitFor({state:'visible',timeout:12000});
    row.buttonDisabled=await button.isDisabled();
    if(row.buttonDisabled)throw new Error('property-button-disabled');
    row.clickAt=new Date().toISOString();
    await button.click({timeout:15000}); // Exactly one physical click.
    try{
      await page.waitForFunction(before=>{
        const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
        return Number(a?.serial||0)>before&&a?.settled===true;
      },pre.serial,{timeout:95000,polling:250});
    }catch(e){row.waitError=String(e)}
    const snap=await page.evaluate(()=>({
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      pub:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      integrity:window.EARTHLINE_LOCATION_INTEGRITY_15801||null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      safety:(typeof M!=='undefined'?M?.safetyAudit15806:null)||null,
      lock:(typeof M!=='undefined'?M?.propertyResultLock15815:null)||null,
      swales:(typeof M!=='undefined'?Number(M?.authoritativeSafeSwales15815?.length||0):0),
      displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
      propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim(),
      staleDialogs:Array.from(document.querySelectorAll('[role="dialog"],[id*="OpportunityPanel"],[id*="RegionalPopup"],[id*="regionalPopup"]')).filter(e=>{
        const r=e.getBoundingClientRect(),s=getComputedStyle(e);
        return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&/regional|opportunity/i.test(e.id+' '+e.textContent.slice(0,160));
      }).map(e=>({id:e.id,text:e.textContent.slice(0,160)})),
      debugOverlays:Array.from(document.querySelectorAll('#earthlineWhyNotHere15803,[id*="DebugPanel"],[id*="debugOverlay"],[id*="TracePanel"]')).filter(e=>{
        const r=e.getBoundingClientRect(),s=getComputedStyle(e);
        return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';
      }).map(e=>e.id)
    }));
    row.serialAfter=Number(snap.audit?.serial||0);
    row.auditResult=snap.audit?.result??null;
    row.settled=snap.audit?.settled??null;
    row.renderVerified=snap.audit?.renderVerified??null;
    row.auditCenter=snap.audit?.center??null;
    row.targetAfter=snap.target;
    row.swales=snap.swales;
    row.safetyVerified=snap.safety?.verified??null;
    row.lockVerified=snap.lock?.safetyVerified??null;
    row.pub=snap.pub;
    row.integrity=snap.integrity;
    row.status=snap.status;
    row.staleDialogs=snap.staleDialogs;
    row.debugOverlays=snap.debugOverlays;
    row.checks={
      firstClickAdvanced:row.serialAfter===pre.serial+1,
      settled:row.settled===true&&snap.propertyState!=='running',
      result:row.auditResult===true,
      rendered:row.renderVerified===true,
      location:Math.abs(Number(snap.target?.lng)-lng)<0.002&&Math.abs(Number(snap.target?.lat)-lat)<0.002,
      safe:snap.safety?.verified===true&&snap.lock?.safetyVerified===true,
      noStaleDialog:snap.staleDialogs.length===0,
      noDebug:snap.debugOverlays.length===0
    };
    row.pass=Object.values(row.checks).every(Boolean);
    row.firstDivergence=Object.entries(row.checks).find(([k,v])=>!v)?.[0]||null;
  }catch(e){
    row.error=String(e);
    row.firstDivergence=/target/i.test(row.error)?'location-target':/center/i.test(row.error)?'map-center':/disabled/i.test(row.error)?'property-button-disabled':'property-ui';
  }
  row.elapsedMs=Date.now()-t0;
  console.log('EARTHLINE_CERT_PROPERTY_20261017 '+JSON.stringify(row));
  return row;
}

let fatal=null;
try{
  await page.goto(BASE+'?earthline_cert_20261017='+BROWSER+'_'+STATE.replace(/\s+/g,'_')+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  for(let i=1;i<=REPS;i++){
    if(i>1){
      await page.reload({waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForSelector('#searchInput',{timeout:30000});
    }
    const errStart=pageErrors.length;
    const consStart=consoleErrors.length;
    const regional=await runRegional('rep-'+i);
    let popup=null;
    if(regional.status&&/screening published/i.test(regional.status)){
      const initial=await hintSnapshot();
      await page.waitForTimeout(1000);
      const persisted=await hintSnapshot();
      const ackError=await dismissHint();
      const dismissed=await hintSnapshot();
      popup={
        appeared:initial.visible,
        text:initial.text,
        a4Style:/(?:\bA4\b|corridor|bioswale|swale|water\s*path)/i.test(initial.text),
        persistsUntilAck:persisted.visible,
        acknowledged:!dismissed.visible&&!ackError,
        ackError
      };
      if(i===1)onboarding.first=popup;
      if(i===2)onboarding.afterReload={appeared:initial.visible,text:initial.text};
    }
    const property=regional.status&&/screening published/i.test(regional.status)?await propertyOneClick('rep-'+i):{pass:false,firstDivergence:'regional-not-published',error:'Property not run: Regional did not publish'};
    const row={state:STATE,browser:BROWSER,mobile:MOBILE,view:VIEW,rep:i,regional,popup,property,errors:pageErrors.slice(errStart),consoleErrors:consoleErrors.slice(consStart),pass:false,firstDivergence:null};
    if(i===1&&!MOBILE&&regional.status&&/screening published/i.test(regional.status)){
      const again=await runRegional('same-page-after-ack');
      await page.waitForTimeout(1000);
      const secondHint=await hintSnapshot();
      onboarding.samePage={regionalPass:again.pass,reopened:secondHint.visible,text:secondHint.text};
      await dismissHint();
      row.samePageRegional=again;
    }
    row.checks={
      regional:regional.pass,
      property:property.pass,
      popupAppeared:!!popup?.appeared,
      popupInstruction:!!popup?.a4Style,
      popupPersistence:!!popup?.persistsUntilAck,
      popupAck:!!popup?.acknowledged,
      noPageErrors:row.errors.length===0,
      noConsoleErrors:row.consoleErrors.length===0
    };
    if(i===2)row.checks.popupAfterReload=!!onboarding.afterReload?.appeared;
    if(i===1&&!MOBILE)row.checks.noSamePageReopen=onboarding.samePage?.reopened===false;
    row.pass=Object.values(row.checks).every(Boolean);
    row.firstDivergence=Object.entries(row.checks).find(([k,v])=>!v)?.[0]||null;
    if(MOBILE){
      row.mobileLayout=await page.evaluate(()=>({
        documentWidth:document.documentElement.scrollWidth,
        viewportWidth:innerWidth,
        panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188'),
        propertyButtonPresent:!!document.getElementById('earthlineMobilePropertyAction17004')
      }));
      row.checks.noHorizontalOverflow=row.mobileLayout.documentWidth<=row.mobileLayout.viewportWidth+2;
      if(!row.checks.noHorizontalOverflow){row.pass=false;row.firstDivergence=row.firstDivergence||'mobile-overflow'}
    }
    rows.push(row);
    console.log('EARTHLINE_CERT_RUN_20261017 '+JSON.stringify({
      state:STATE,browser:BROWSER,mobile:MOBILE,view:VIEW,rep:i,pass:row.pass,
      firstDivergence:row.firstDivergence,regionalMs:regional.coreMs??null,
      regionalPass:regional.pass,generated:regional.generated??null,visible:regional.visible??null,
      unsafe:regional.unsafe??null,propertyPass:property.pass,propertyDivergence:property.firstDivergence,
      propertyMs:property.elapsedMs??null,popup,errors:row.errors,consoleErrors:row.consoleErrors,
      samePage:onboarding.samePage,mobileLayout:row.mobileLayout||null
    }));
    if(!row.pass||i===1)try{await page.screenshot({path:OUT+'/rep-'+i+'.png',animations:'disabled',timeout:12000})}catch(_){}
  }
}catch(e){fatal=String(e);console.log('EARTHLINE_CERT_FATAL_20261017 '+JSON.stringify({state:STATE,browser:BROWSER,mobile:MOBILE,error:fatal}));}
const summary={
  date:'2026-10-17',production:BASE,browser:BROWSER,state:STATE,mobile:MOBILE,view:VIEW,
  expected:REPS,completed:rows.length,passed:rows.filter(r=>r.pass).length,
  failed:rows.filter(r=>!r.pass).length+(REPS-rows.length),fatal,
  onboarding,regionalCount,pageErrors,consoleErrors,
  firstDivergence:rows.find(r=>!r.pass)?.firstDivergence||fatal||null
};
writeFileSync(OUT+'/results.json',JSON.stringify({summary,rows},null,2));
console.log('EARTHLINE_CERT_SUMMARY_20261017 '+JSON.stringify(summary));
await browser.close();
if(summary.failed||pageErrors.length||consoleErrors.length)process.exitCode=1;
