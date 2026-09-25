import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const CAND=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const BATCH=process.env.BATCH||'priority-point';
const OUTDIR=process.env.OUTDIR||`out-16849-${BATCH}`;
const SPECS=(process.env.POINTS||'').split('|').map(s=>s.trim()).filter(Boolean).map(s=>{
  const [label,latS,lngS,cc='']=s.split('=');
  const lat=Number(latS),lng=Number(lngS);
  if(!label||!Number.isFinite(lat)||!Number.isFinite(lng))throw new Error('bad POINTS item '+s);
  return {label,lat,lng,countryCode:cc.toLowerCase()};
});
if(!SPECS.length)throw new Error('POINTS required');
fs.mkdirSync(OUTDIR,{recursive:true});
const safe=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const browser=await chromium.launch({headless:true});
const rows=[];

for(const spec of SPECS){
  const p=await browser.newPage({viewport:{width:1700,height:900}});
  let harnessError=null,timeoutError=null; const started=Date.now();
  const q=`${spec.lat.toFixed(6)}, ${spec.lng.toFixed(6)}`;
  try{
    await p.goto(CAND+`?point-property-16849=${encodeURIComponent(spec.label)}-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:60000});
    await p.waitForSelector('#searchInput',{timeout:30000});
    await p.evaluate(({q,spec})=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220=null;
      window.EARTHLINE_TEST_LOCATION_16845={
        query:q,name:spec.label,placeType:'address',countryCode:spec.countryCode,
        lat:spec.lat,lng:spec.lng,center:[spec.lng,spec.lat],bbox:null,zoom:18
      };
      const i=document.getElementById('searchInput');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));
      document.getElementById('runBtn').click();
    },{q,spec});
    try{
      await p.waitForFunction(()=>{
        const a=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
        const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
        return !!a||!!e;
      },{timeout:45000,polling:100});
    }catch(e){timeoutError=String(e?.message||e);}
    await p.waitForTimeout(300);
  }catch(e){harnessError=String(e?.message||e);}

  const snap=await p.evaluate(()=>{
    const a=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const pp=d?.propertyPublication||{};
    const target=window.EARTHLINE_PROPERTY_TARGET_16201||{};
    const decl=window.EARTHLINE_PROPERTY_DECLARATION_16169||{};
    const ev=(typeof window.earthlineGetExclusionEvidence16516==='function'?window.earthlineGetExclusionEvidence16516():null)||{};
    return {
      audit:a,error:e,
      published:a?.published===true,reason:String(a?.reason||''),
      engineCount:Number(a?.engineCount??NaN),safeCount:Number(a?.safeCount??NaN),publicationCount:Number(a?.publicationCount??NaN),
      tier:String(d?.tier||d?.mode||''),query:String(d?.query||''),displayedSwales:Number(d?.derived?.swaleOpportunityLines??NaN),
      safetyVerified:pp.safetyVerified===true,committed:pp.committed===true,
      center:d?.center||null,declarationCenter:decl?.center||null,
      targetCenter:(Number.isFinite(Number(target?.lng))&&Number.isFinite(Number(target?.lat)))?{lng:Number(target.lng),lat:Number(target.lat)}:null,
      exclusionLabel:String(ev?.label||''),exclusionSourceTier:String(ev?.sourceTier||''),
      analysisTier:String(document.documentElement.dataset.earthlineAnalysisTier||''),propertyRunState:String(document.documentElement.dataset.earthlinePropertyRunState||'')
    };
  }).catch(()=>({}));

  const failures=[];
  if(harnessError)failures.push('harness');
  if(timeoutError)failures.push('timeout');
  if(snap.error)failures.push('engine error');
  if(!snap.published)failures.push('not published');
  if(snap.tier!=='property')failures.push('tier');
  if(snap.published&&(!snap.safetyVerified||!snap.committed))failures.push('safety/commit');
  if(snap.published&&Number.isFinite(snap.safeCount)&&Number.isFinite(snap.publicationCount)&&snap.safeCount!==snap.publicationCount)failures.push('safe/publication mismatch');
  if(snap.published&&Number.isFinite(snap.displayedSwales)&&Number.isFinite(snap.publicationCount)&&snap.displayedSwales!==snap.publicationCount)failures.push('display/publication mismatch');
  const swaleGenerationPossible=snap.published===true&&Number(snap.publicationCount)>0;
  try{await p.screenshot({path:path.join(OUTDIR,`${safe(spec.label)}.jpg`),type:'jpeg',quality:45,fullPage:false});}catch{}
  const row={...spec,q,totalMs:Date.now()-started,harnessError,timeoutError,snap,swaleGenerationPossible,failures,pass:failures.length===0};
  rows.push(row);console.log(JSON.stringify(row));await p.close();
}
await browser.close();
const summary={at:new Date().toISOString(),batch:BATCH,rows,technicalPass:rows.every(r=>r.pass),swalePossible:rows.filter(r=>r.swaleGenerationPossible).map(r=>r.label),swaleNotPossible:rows.filter(r=>!r.swaleGenerationPossible).map(r=>r.label)};
fs.writeFileSync(path.join(OUTDIR,'audit.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({batch:BATCH,technicalPass:summary.technicalPass,swalePossible:summary.swalePossible,swaleNotPossible:summary.swaleNotPossible,count:rows.length}));
if(!summary.technicalPass)process.exitCode=1;
