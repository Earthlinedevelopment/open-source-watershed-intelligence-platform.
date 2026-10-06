import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const COUNTRIES=['Laos','Thailand','Vietnam'];
const browser=await chromium.launch({headless:true});
const rows=[];

async function run(country){
  const context=await browser.newContext({viewport:{width:1600,height:900}});
  const page=await context.newPage();
  const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  const started=Date.now(); let fatal=null;
  try{
    await page.goto(BASE+'?sea3_audit='+encodeURIComponent(country)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:20000});
    await page.evaluate(q=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },country);
    await page.waitForFunction(()=>{
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      if(err)return true;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
      return /screening published\./i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;
    },{timeout:30000,polling:120});
  }catch(e){fatal=String(e);}
  const regional=await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
    target:(()=>{
      const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
      const f=sw.filter(x=>x?.geometry?.type==='LineString'&&x.geometry.coordinates?.length)
        .sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999))[0];
      if(!f)return null;
      const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
      return {lng:Number(c[0]),lat:Number(c[1]),code:String(f.properties?.display_code||f.properties?.grade||'A1'),score:Number(f.properties?.score||0)};
    })()
  }));
  const coreMs=Number(regional?.perf?.totalMs||0);
  const generated=regional?.pub?.generated;
  const visible=regional?.display?.swaleLines??regional?.pub?.overlaySwaleLines;
  const regionalPass=!fatal&&!regional.lastError&&/screening published\./i.test(regional.status)&&coreMs>0&&coreMs<=15000&&
    (generated==null||visible==null||Number(generated)===Number(visible))&&
    (regional?.flow?.unsafeSegments==null||Number(regional.flow.unsafeSegments)===0)&&
    (regional?.boundary?.outsideAfterClip==null||Number(regional.boundary.outsideAfterClip?.swales||0)===0)&&!!regional.target;

  let property={attempted:false,pass:false};
  if(regionalPass){
    const ps=Date.now();
    property=await page.evaluate(async t=>{
      const target={...t,source:'sea3-production-regression-audit',at:new Date().toISOString()};
      try{
        if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(target,{openPanel:false});
        else window.EARTHLINE_PROPERTY_TARGET_16201=target;
        const fn=window.earthlineDeclarePropertyAtCrosshair16169||window.earthlineDeclarePropertyAtCrosshair16173;
        if(typeof fn!=='function')return {attempted:true,error:'property owner unavailable'};
        await Promise.race([Promise.resolve(fn()),new Promise((_,rej)=>setTimeout(()=>rej(new Error('property promise timeout')),20000))]);
        return {attempted:true};
      }catch(e){return {attempted:true,error:String(e&&e.message||e)}}
    },regional.target);
    try{
      await page.waitForFunction(()=>{
        const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
        return a?.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';
      },{timeout:22000,polling:120});
    }catch(_){}
    const snap=await page.evaluate(()=>({
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      pub:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      safety:(typeof M!=='undefined'&&M?.safetyAudit15806)||null,
      lock:(typeof M!=='undefined'&&M?.propertyResultLock15815)||null,
      safe:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
      displayed:String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'').toLowerCase(),
      documentTier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),
      swales:Number((typeof M!=='undefined'&&M?.swales?.length)||0),
      safeSwales:Number((typeof M!=='undefined'&&M?.authoritativeSafeSwales15815?.length)||0)
    }));
    const wallMs=Date.now()-ps;
    const corridors=Number(snap.audit?.corridors??snap.pub?.publicationCount??snap.safeSwales??snap.swales??0);
    property={...property,wallMs,snap};
    property.pass=!property.error&&snap.audit?.settled===true&&snap.audit?.result===true&&snap.audit?.renderVerified===true&&
      snap.safety?.verified===true&&snap.lock?.safetyVerified===true&&snap.displayed==='property'&&snap.documentTier==='property'&&
      wallMs<=15000&&(corridors===0||snap.safe?.visible===true);
  }
  const row={country,elapsedMs:Date.now()-started,regional:{...regional,coreMs,generated,visible,pass:regionalPass},property,pageErrors,pass:regionalPass&&property.pass&&pageErrors.length===0};
  await context.close();
  return row;
}

for(const country of COUNTRIES){
  const row=await run(country);rows.push(row);
  console.log('EARTHLINE_SEA3 '+JSON.stringify({country:row.country,pass:row.pass,regionalPass:row.regional.pass,regionalMs:row.regional.coreMs,propertyPass:row.property.pass,propertyMs:row.property.wallMs||null,error:row.property.error||row.regional.lastError||null}));
}
await browser.close();
const summary={total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,failed:rows.filter(r=>!r.pass).map(r=>r.country)};
writeFileSync('sea3-regression-audit.json',JSON.stringify({summary,rows},null,2));
console.log('EARTHLINE_SEA3_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
