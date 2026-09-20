import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
const OUT=process.env.OUT||'property50.json';
if(!STATES.length)throw new Error('STATES required');
const browser=await chromium.launch({headless:true});
const rows=[];

for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  const started=Date.now();let regionalError=null,propertyError=null,propertyReturn=null,target=null,regionalMs=null,propertyMs=null;
  try{
    await page.goto(URL+'?prop50='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const rs=Date.now();
    await page.evaluate(q=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },stateName);
    await page.waitForFunction(expected=>{
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      const exact=String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase();
      const vt=String(expected).toLowerCase()==='vermont'&&String(pub?.runToken||'').toLowerCase().includes('vermont');
      return (exact||vt)&& (!!err|| (!!pub?.runToken&&/screening published\./i.test(status)));
    },stateName,{timeout:60000,polling:100});
    regionalMs=Date.now()-rs;
    regionalError=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
    if(regionalError)throw new Error('regional '+JSON.stringify(regionalError));
    target=await page.evaluate(q=>{
      const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
      const ranked=sw.filter(x=>x?.geometry?.type==='LineString'&&Array.isArray(x.geometry.coordinates)&&x.geometry.coordinates.length).sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999));
      const f=ranked[0];if(!f)return null;
      const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
      return {lng:Number(c[0]),lat:Number(c[1]),source:'property-50-state-certification-16725',code:String(f.properties?.display_code||f.properties?.grade||''),score:Number(f.properties?.score||0),query:q,at:new Date().toISOString()};
    },stateName);
    if(!target)throw new Error('no published corridor target');
    const ps=Date.now();
    propertyReturn=await page.evaluate(async t=>{
      try{
        window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178=null;
        window.EARTHLINE_PROPERTY_TARGET_16201=t;
        if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(t);
        const fn=window.earthlineDeclarePropertyAtCrosshair16173;
        if(typeof fn!=='function')return {ok:false,error:'property owner unavailable'};
        const timeout=new Promise((_,rej)=>setTimeout(()=>rej(new Error('property promise timeout')),55000));
        const out=await Promise.race([Promise.resolve(fn()),timeout]);
        return {ok:out!==false,outType:typeof out};
      }catch(e){return {ok:false,error:String(e&&e.message||e)};}
    },target);
    propertyMs=Date.now()-ps;
    if(!propertyReturn?.ok)propertyError=propertyReturn?.error||'property returned false';
  }catch(e){propertyError=propertyError||String(e&&e.message||e);}
  await page.waitForTimeout(400);
  const snap=await page.evaluate(()=>{
    const displayed=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const timeout=window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178||null;
    const active=window.EARTHLINE_PROPERTY_ACTIVE_STAGE_16178||null;
    const keys={};
    for(const k of Object.keys(window).filter(k=>/EARTHLINE_.*PROPERTY/i.test(k)).sort()){
      let v;try{v=window[k];}catch(_){continue;}
      if(v==null||typeof v==='function')continue;
      try{const s=JSON.stringify(v);if(s&&s.length<5000)keys[k]=v;}catch(_){}
    }
    return {
      tier:String(displayed&&(displayed.tier||displayed.mode)||'').toLowerCase(),
      displayed:displayed&&{tier:displayed.tier||displayed.mode||null,query:displayed.query||null,runToken:displayed.runToken||null},
      timeout,active,keys,
      analysisTier:document.documentElement.dataset.earthlineAnalysisTier||null,
      propertyRunState:document.documentElement.dataset.earthlinePropertyRunState||null,
      runState:document.documentElement.dataset.earthlineRunState||null
    };
  }).catch(e=>({snapshotError:String(e)}));
  const failures=[];
  if(regionalError)failures.push('regional error');
  if(propertyError)failures.push('property '+propertyError);
  if(!target)failures.push('no target');
  if(!propertyReturn?.ok)failures.push('property not published');
  if(snap.snapshotError)failures.push('snapshot '+snap.snapshotError);
  if(snap.timeout)failures.push('property timeout audit '+JSON.stringify(snap.timeout));
  if(snap.tier!=='property')failures.push('displayed tier '+(snap.tier||'none'));
  if(propertyMs!=null&&propertyMs>55000)failures.push('property wall '+propertyMs);
  rows.push({state:stateName,elapsedMs:Date.now()-started,regionalMs,propertyMs,target,propertyReturn,propertyError,snap,failures,pass:failures.length===0});
  await page.close();
}
await browser.close();
const failed=rows.filter(r=>!r.pass).map(r=>({state:r.state,failures:r.failures}));
const out={at:new Date().toISOString(),url:URL,rows,failed,pass:failed.length===0};
fs.writeFileSync(OUT,JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
if(failed.length)process.exitCode=1;
