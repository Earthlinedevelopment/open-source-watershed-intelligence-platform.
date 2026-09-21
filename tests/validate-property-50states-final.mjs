import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
const OUT=process.env.OUT||'property50.json';
if(!STATES.length)throw new Error('STATES required');
const browser=await chromium.launch({headless:true});
const rows=[];

async function runRegional(page,stateName){
  await page.goto(URL+'?property50v16728='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const started=Date.now();
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },stateName);
  await page.waitForFunction(expected=>{
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const audit=window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null;
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    const exact=String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase();
    const vt=String(expected).toLowerCase()==='vermont'&&String(pub?.runToken||'').toLowerCase().includes('vermont');
    const generated=Number(pub?.generated??0),visible=Number(disp?.swaleLines??0);
    return (exact||vt)&& (!!err|| (!!audit&&generated>0&&visible===generated));
  },stateName,{timeout:60000,polling:100});
  const err=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  if(err)throw new Error('regional '+JSON.stringify(err));
  return Date.now()-started;
}

async function rankedTargets(page,stateName){
  return page.evaluate(q=>{
    const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    const parent=String(window.EARTHLINE_DISPLAYED_RUN_16151?.runToken||window.EARTHLINE_DISPLAYED_RUN_16147?.runToken||'');
    return sw.filter(x=>x?.geometry?.type==='LineString'&&x.geometry.coordinates?.length)
      .sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999))
      .slice(0,8).map(f=>{
        const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
        return {lng:Number(c[0]),lat:Number(c[1]),source:'property-50-state-certification-16728',code:String(f.properties?.display_code||f.properties?.grade||''),score:Number(f.properties?.score||0),query:q,parentRunToken:parent,at:new Date().toISOString()};
      });
  },stateName);
}

async function propertyAttempt(page,target){
  return page.evaluate(async t=>{
    window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178=null;
    window.EARTHLINE_LOCATION_INTEGRITY_15801=null;
    window.EARTHLINE_PROPERTY_DISPLAY_RECLAIM_16727=null;
    window.EARTHLINE_PROPERTY_TARGET_16201=t;
    if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(t);
    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof fn!=='function')return {ok:false,error:'property owner unavailable',gate:null};
    try{
      const out=await Promise.race([Promise.resolve(fn()),new Promise((_,rej)=>setTimeout(()=>rej(new Error('property promise timeout')),55000))]);
      return {ok:out!==false,out,gate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null};
    }catch(e){
      return {ok:false,error:String(e&&e.message||e),gate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null};
    }
  },target);
}

async function snap(page){
  return page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const pa=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,ra=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,sv=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;
    return {
      displayedTier:String(d&&(d.tier||d.mode)||'').toLowerCase(),
      documentTier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),
      published:pa?.published===true,
      publicationCount:Number(pa?.publicationCount||0),
      stage:ra?.stage||null,settled:ra?.settled===true,result:ra?.result===true,timedOut:ra?.timedOut===true,renderVerified:ra?.renderVerified===true,
      runError:ra?.error||null,stageTimings:ra?.stageTimings||null,
      publicationBlock:window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||null,
      handoff:window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null,
      corridors:Number(ra?.corridors??pa?.publicationCount??0),
      safeVisible:sv?.visible===true,safeCount:Number(sv?.count||0),
      integrity:window.EARTHLINE_LOCATION_INTEGRITY_15801||null,
      reclaim:window.EARTHLINE_PROPERTY_DISPLAY_RECLAIM_16727||null,
      timeoutAudit:window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178||null
    };
  });
}

for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  const started=Date.now();let regionalMs=null,propertyMs=null,error=null,usedTarget=null;const attempts=[];
  try{
    regionalMs=await runRegional(page,stateName);
    const targets=await rankedTargets(page,stateName);
    if(!targets.length)throw new Error('no published Regional corridor target');
    const ps=Date.now();
    for(const target of targets.slice(0,6)){
      const a=await propertyAttempt(page,target);
      attempts.push({target,ok:a.ok,error:a.error||null,waterGate:a.gate||null});
      if(a.ok){usedTarget=target;break;}
      if(!(a.gate&&a.gate.hit===true))throw new Error(a.error||'Property failed without a mapped-water gate');
    }
    propertyMs=Date.now()-ps;
    if(!usedTarget)throw new Error('top six Regional corridors were all rejected by finer Property water evidence');
    await page.waitForTimeout(3200);
  }catch(e){error=String(e&&e.message||e);}
  const s=await snap(page).catch(e=>({snapshotError:String(e)}));
  const failures=[];
  if(error)failures.push(error);
  if(s.snapshotError)failures.push('snapshot '+s.snapshotError);
  if(!s.published)failures.push('Property not published');
  if(!s.settled||!s.result||s.timedOut)failures.push('Property run not settled successfully'+(s.runError?' — '+s.runError:''));
  if(!s.renderVerified)failures.push('Property render not verified');
  if(Number(s.corridors)>0&&!s.safeVisible)failures.push('safe Property corridors not visible');
  if(s.displayedTier!=='property'||s.documentTier!=='property')failures.push('canonical tier '+s.displayedTier+'/'+s.documentTier);
  if(s.integrity&&s.integrity.ok!==true)failures.push('location integrity '+JSON.stringify(s.integrity.reasons||[]));
  if(s.timeoutAudit)failures.push('Property timeout audit present');
  if(propertyMs!=null&&propertyMs>55000)failures.push('Property wall '+propertyMs);
  rows.push({state:stateName,elapsedMs:Date.now()-started,regionalMs,propertyMs,usedTarget,attempts,snap:s,failures,pass:failures.length===0});
  await page.close();
}
await browser.close();
const failed=rows.filter(r=>!r.pass).map(r=>({state:r.state,failures:r.failures}));
const out={at:new Date().toISOString(),url:URL,rows,failed,pass:failed.length===0};
fs.writeFileSync(OUT,JSON.stringify(out,null,2));console.log(JSON.stringify(out));
if(failed.length)process.exitCode=1;
