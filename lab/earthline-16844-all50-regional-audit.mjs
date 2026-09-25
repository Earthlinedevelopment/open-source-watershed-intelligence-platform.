import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
const BATCH=process.env.BATCH||'batch';
const OUTDIR=process.env.OUTDIR||`out-16844-${BATCH}`;
if(!STATES.length) throw new Error('STATES required');
fs.mkdirSync(OUTDIR,{recursive:true});

const safeName=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const browser=await chromium.launch({headless:true});
const rows=[];

for(const state of STATES){
  const page=await browser.newPage({viewport:{width:1800,height:900}});
  const started=Date.now(); let error=null, timedOut=false;
  try{
    await page.goto(URL+`?all50-16844=${encodeURIComponent(state)}-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const marker=await page.evaluate(()=>document.documentElement.innerHTML.includes('EARTHLINE 16844 — FINAL FINE-SUPPORT REGIONAL CAPACITY'));
    if(!marker) throw new Error('public page is not 16844');
    await page.evaluate(q=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731=null;
      const i=document.getElementById('searchInput'), b=document.getElementById('runBtn');
      i.value=q; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); b.click();
    },state);
    await page.waitForFunction(expected=>{
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      const exact=String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase();
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
      const cap=window.EARTHLINE_SUPPORTED_CAPACITY_16843||null;
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      return exact && (err || (cap?.build==='EARTHLINE 16844' && Number(pub?.generated||0)>0 && Number(disp?.swaleLines||0)>0));
    },state,{timeout:110000,polling:100});
    await page.waitForTimeout(500);
    error=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  } catch(e){ timedOut=String(e?.message||e).includes('Timeout'); error=error||String(e?.message||e); }

  const snap=await page.evaluate(()=>{
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{};
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{};
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{};
    const land=window.EARTHLINE_LAND_VALIDITY_16584||{};
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||{};
    const dr=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||{};
    const cap=window.EARTHLINE_SUPPORTED_CAPACITY_16843||{};
    const local=window.EARTHLINE_STATEWIDE_SUPERTILE_16839||{};
    const fine=window.EARTHLINE_FINE_DISPERSION_REBALANCE_16778||{};
    const spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||{};
    const coverage=window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||{};
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||{};
    const outsideObj=boundary?.outsideAfterClip||null;
    const outsidePub=Number(pub?.outsideJurisdiction??pub?.outside??pub?.outsideCount??0);
    return {
      build:cap.build||null,
      packageState:String(pkg?.identity?.name||''),
      generated:Number(pub?.generated||0), visible:Number(disp?.swaleLines||0),
      waterPaths:Number(dr?.derived?.waterPaths??disp?.waterPaths??0),
      unsafe:Number(flow?.unsafeSegments??NaN), outsidePub, outsideObj,
      waterReady:Array.isArray(land?.waterParts), waterParts:Array.isArray(land?.waterParts)?land.waterParts.length:null,
      aquiferReady:!!dr?.aquifers && typeof dr.aquifers.status==='string', aquiferStatus:String(dr?.aquifers?.status||''),
      slopeReady:!!dr?.terrain?.source && Number.isFinite(Number(dr?.recharge?.components?.slope)),
      totalMs:Number(perf?.totalMs??NaN),
      coveragePassed:coverage?.passed===true, unresolved:coverage?.unresolved??null,
      fineSupportCells:Number(cap?.fineSupportCells||0), baseCapacity:Number(cap?.base||0), supportExtra:Number(cap?.extra||0), supportedCapacity:Number(cap?.capacity||0),
      localAdded:Number(local?.added||0), localFailed:Number(local?.failed||0),
      fineCandidateCells:Number(fine?.candidateCells||0), fineFinalCells:Number(fine?.finalChosenCells||0),
      spreadCandidateCells:Number(spread?.candidateCells||0), spreadFinalCells:Number(spread?.finalCells||0)
    };
  }).catch(()=>({}));

  const failures=[];
  if(error) failures.push('runtime/error');
  if(snap.build!=='EARTHLINE 16844') failures.push('wrong build');
  if(!(snap.generated>0)) failures.push('zero swales');
  if(snap.generated!==snap.visible) failures.push('generated/visible mismatch');
  if(!Number.isFinite(snap.totalMs)||snap.totalMs>15000) failures.push('runtime >15s');
  if(snap.unsafe!==0) failures.push('unsafe segments');
  if(snap.outsidePub!==0) failures.push('outside jurisdiction');
  if(snap.outsideObj&&Object.values(snap.outsideObj).some(v=>Number(v||0)!==0)) failures.push('boundary outside');
  if(!snap.waterReady) failures.push('water sidecar');
  if(!(snap.waterPaths>0)) failures.push('water paths');
  if(!snap.slopeReady) failures.push('slope owner');
  if(!snap.aquiferReady) failures.push('aquifer owner');
  if(!snap.coveragePassed) failures.push('coverage audit');
  if(snap.localFailed!==0) failures.push('local generation failures');
  const review=[];
  if(snap.totalMs>13000 && snap.totalMs<=15000) review.push('runtime headroom <2s');
  if(snap.generated<100) review.push('low displayed corridor count');
  if(snap.fineSupportCells>0 && snap.generated/snap.fineSupportCells<0.45) review.push('low corridor-to-fine-support ratio');
  if(snap.localAdded===0 && snap.fineSupportCells>180) review.push('high fine support with no local additions');

  try{await page.screenshot({path:path.join(OUTDIR,`${safeName(state)}.jpg`),type:'jpeg',quality:48,fullPage:false});}catch{}
  rows.push({state,elapsedMs:Date.now()-started,timedOut,error,snap,failures,review,pass:failures.length===0});
  console.log(JSON.stringify(rows.at(-1)));
  await page.close();
}
await browser.close();
const failed=rows.filter(r=>!r.pass).map(r=>({state:r.state,failures:r.failures}));
const review=rows.filter(r=>r.review.length).map(r=>({state:r.state,review:r.review}));
const summary={at:new Date().toISOString(),batch:BATCH,url:URL,build:'EARTHLINE 16844',pass:failed.length===0,failed,review,rows};
fs.writeFileSync(path.join(OUTDIR,'audit.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({batch:BATCH,pass:summary.pass,failed,review,states:rows.length}));
if(failed.length) process.exitCode=1;
