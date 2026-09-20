import { chromium } from 'playwright';
import fs from 'node:fs';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'Vermont|Hawaii|Texas|Alaska|New York').split('|').filter(Boolean);
const browser=await chromium.launch({headless:true});
const rows=[];
for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  let error=null,target=null;const started=Date.now();
  try{
    await page.goto(URL+'?v16726='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
    await page.waitForFunction(expected=>{
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,exact=String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase();
      const vt=String(expected).toLowerCase()==='vermont'&&String(pub?.runToken||'').toLowerCase().includes('vermont');
      return (exact||vt)&&!!pub?.runToken&&/screening published\./i.test(status);
    },stateName,{timeout:60000,polling:100});
    target=await page.evaluate(q=>{
      const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
      const f=sw.filter(x=>x?.geometry?.type==='LineString'&&x.geometry.coordinates?.length).sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999))[0];
      if(!f)return null;const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
      return {lng:Number(c[0]),lat:Number(c[1]),source:'property-handoff-16726',code:String(f.properties?.display_code||f.properties?.grade||''),score:Number(f.properties?.score||0),query:q,at:new Date().toISOString()};
    },stateName);
    if(!target)throw new Error('no corridor target');
    const result=await page.evaluate(async t=>{
      window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178=null;
      window.EARTHLINE_PROPERTY_TARGET_16201=t;
      if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(t);
      const fn=window.earthlineDeclarePropertyAtCrosshair16173;if(typeof fn!=='function')throw new Error('property owner unavailable');
      return await Promise.race([Promise.resolve(fn()),new Promise((_,rej)=>setTimeout(()=>rej(new Error('property timeout')),55000))]);
    },target);
    if(result===false)throw new Error('property returned false');
    await page.waitForTimeout(3200); // deliberately allow late Regional context to finish and try to race
  }catch(e){error=String(e&&e.message||e);}
  const snap=await page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const pa=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,ra=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,sv=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,ctx=window.EARTHLINE_REGIONAL_CONTEXT_16198||null;
    return {displayedTier:String(d&&(d.tier||d.mode)||'').toLowerCase(),documentTier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),published:pa?.published===true,publicationCount:Number(pa?.publicationCount||0),stage:ra?.stage||null,settled:ra?.settled===true,result:ra?.result===true,timedOut:ra?.timedOut===true,renderVerified:ra?.renderVerified===true,safeVisible:sv?.visible===true,safeCount:Number(sv?.count||0),contextSuppressed:ctx?.displaySuppressedForProperty===true,timeoutAudit:window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178||null};
  });
  const failures=[];if(error)failures.push(error);if(!snap.published||snap.publicationCount<=0)failures.push('property not published');if(!snap.settled||!snap.result||snap.timedOut)failures.push('property run not settled');if(!snap.renderVerified||!snap.safeVisible||snap.safeCount<=0)failures.push('property render not verified');if(snap.displayedTier!=='property'||snap.documentTier!=='property')failures.push('late Regional context reclaimed tier '+snap.displayedTier+'/'+snap.documentTier);if(snap.timeoutAudit)failures.push('timeout audit present');
  rows.push({state:stateName,elapsedMs:Date.now()-started,target,snap,failures,pass:failures.length===0});await page.close();
}
await browser.close();
const failed=rows.filter(r=>!r.pass).map(r=>({state:r.state,failures:r.failures}));
const out={at:new Date().toISOString(),url:URL,rows,failed,pass:failed.length===0};fs.writeFileSync(process.env.OUT||'lab/16726-validation.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));if(failed.length)process.exitCode=1;
