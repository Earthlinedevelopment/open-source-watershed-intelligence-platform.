import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'Alabama|Hawaii|Nevada|New Jersey|Virginia|Vermont|Texas|Alaska|New York').split('|').filter(Boolean);
const browser=await chromium.launch({headless:true});
const rows=[];

async function regional(page,stateName){
  await page.goto(URL+'?v16727='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },stateName);
  await page.waitForFunction(expected=>{
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,exact=String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase();
    const vt=String(expected).toLowerCase()==='vermont'&&String(pub?.runToken||'').toLowerCase().includes('vermont');
    return (exact||vt)&&!!pub?.runToken&&/screening published\./i.test(status);
  },stateName,{timeout:60000,polling:100});
}
async function candidates(page,stateName){
  return page.evaluate(q=>{
    const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    const parent=String(window.EARTHLINE_DISPLAYED_RUN_16151?.runToken||window.EARTHLINE_DISPLAYED_RUN_16147?.runToken||'');
    return sw.filter(x=>x?.geometry?.type==='LineString'&&x.geometry.coordinates?.length).sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999)).slice(0,8).map(f=>{
      const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
      return {lng:Number(c[0]),lat:Number(c[1]),source:'property-certification-16727',code:String(f.properties?.display_code||f.properties?.grade||''),score:Number(f.properties?.score||0),query:q,parentRunToken:parent,at:new Date().toISOString()};
    });
  },stateName);
}
async function runProperty(page,target){
  return page.evaluate(async t=>{
    window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178=null;
    window.EARTHLINE_LOCATION_INTEGRITY_15801=null;
    window.EARTHLINE_PROPERTY_DISPLAY_RECLAIM_16727=null;
    window.EARTHLINE_PROPERTY_TARGET_16201=t;
    if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(t);
    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof fn!=='function')return {ok:false,error:'property owner unavailable'};
    try{
      const out=await Promise.race([Promise.resolve(fn()),new Promise((_,rej)=>setTimeout(()=>rej(new Error('property timeout')),55000))]);
      return {ok:out!==false,out};
    }catch(e){return {ok:false,error:String(e&&e.message||e)};}
  },target);
}
async function snapshot(page){
  return page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const pa=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,ra=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,sv=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;
    return {
      displayedTier:String(d&&(d.tier||d.mode)||'').toLowerCase(),
      documentTier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),
      published:pa?.published===true,publicationCount:Number(pa?.publicationCount||0),
      stage:ra?.stage||null,settled:ra?.settled===true,result:ra?.result===true,timedOut:ra?.timedOut===true,renderVerified:ra?.renderVerified===true,
      safeVisible:sv?.visible===true,safeCount:Number(sv?.count||0),
      integrity:window.EARTHLINE_LOCATION_INTEGRITY_15801||null,
      reclaim:window.EARTHLINE_PROPERTY_DISPLAY_RECLAIM_16727||null,
      waterGate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null,
      timeoutAudit:window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178||null
    };
  });
}

for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1600,height:900}});const started=Date.now();let error=null,target=null,ret=null;
  try{
    await regional(page,stateName);const cs=await candidates(page,stateName);target=cs[0]||null;if(!target)throw new Error('no target');
    ret=await runProperty(page,target);if(!ret.ok)throw new Error(ret.error||'property returned false');
    await page.waitForTimeout(3200);
  }catch(e){error=String(e&&e.message||e);}
  const snap=await snapshot(page);
  const failures=[];if(error)failures.push(error);if(!snap.published)failures.push('not published');if(!snap.settled||!snap.result||snap.timedOut)failures.push('not settled');if(!snap.renderVerified||!snap.safeVisible)failures.push('render not verified');if(snap.displayedTier!=='property'||snap.documentTier!=='property')failures.push('tier '+snap.displayedTier+'/'+snap.documentTier);if(snap.integrity&&snap.integrity.ok!==true)failures.push('integrity '+JSON.stringify(snap.integrity.reasons));if(snap.timeoutAudit)failures.push('timeout audit');
  rows.push({state:stateName,elapsedMs:Date.now()-started,target,ret,snap,failures,pass:failures.length===0});await page.close();
}

// Missouri: a finer Property water polygon may legitimately reject a Regional screening corridor.
// Prove Property by trying the next ranked corridor only when the current one is explicitly water-gated.
{
  const stateName='Missouri',page=await browser.newPage({viewport:{width:1600,height:900}});const started=Date.now();let error=null,used=null,attempts=[];
  try{
    await regional(page,stateName);const cs=await candidates(page,stateName);
    for(const t of cs.slice(0,6)){
      const ret=await runProperty(page,t);const gate=await page.evaluate(()=>window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null);
      attempts.push({target:t,ret,waterGate:gate});
      if(ret.ok){used=t;break;}
      if(!(gate&&gate.hit===true))throw new Error(ret.error||'non-water Property failure');
    }
    if(!used)throw new Error('all tested ranked corridors were Property water-gated');
    await page.waitForTimeout(3200);
  }catch(e){error=String(e&&e.message||e);}
  const snap=await snapshot(page),failures=[];if(error)failures.push(error);if(!snap.published)failures.push('not published');if(!snap.settled||!snap.result||snap.timedOut)failures.push('not settled');if(!snap.renderVerified||!snap.safeVisible)failures.push('render not verified');if(snap.displayedTier!=='property'||snap.documentTier!=='property')failures.push('tier '+snap.displayedTier+'/'+snap.documentTier);if(snap.integrity&&snap.integrity.ok!==true)failures.push('integrity '+JSON.stringify(snap.integrity.reasons));
  rows.push({state:stateName,elapsedMs:Date.now()-started,used,attempts,snap,failures,pass:failures.length===0});await page.close();
}
await browser.close();
const failed=rows.filter(r=>!r.pass).map(r=>({state:r.state,failures:r.failures}));
const out={at:new Date().toISOString(),url:URL,rows,failed,pass:failed.length===0};
fs.writeFileSync(process.env.OUT||'lab/16727-validation.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));if(failed.length)process.exitCode=1;
