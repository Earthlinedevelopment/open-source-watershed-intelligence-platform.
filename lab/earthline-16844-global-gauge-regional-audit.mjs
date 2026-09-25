import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const TARGETS=(process.env.TARGETS||'').split('|').map(s=>s.trim()).filter(Boolean);
const BATCH=process.env.BATCH||'batch';
const OUTDIR=process.env.OUTDIR||`out-16844-global-${BATCH}`;
if(!TARGETS.length) throw new Error('TARGETS required');
fs.mkdirSync(OUTDIR,{recursive:true});

const safeName=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const browser=await chromium.launch({headless:true});
const rows=[];

for(const target of TARGETS){
  const page=await browser.newPage({viewport:{width:1800,height:900}});
  const started=Date.now(); let error=null, timedOut=false;
  try{
    await page.goto(URL+`?global-audit-16844=${encodeURIComponent(target)}-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const marker=await page.evaluate(()=>document.documentElement.innerHTML.includes('EARTHLINE 16844 — FINAL FINE-SUPPORT REGIONAL CAPACITY'));
    if(!marker) throw new Error('public page is not 16844');
    await page.evaluate(q=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970=null;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },target);
    await page.waitForFunction(expected=>{
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
      const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
      const query=String(d?.query||'').trim().toLowerCase();
      return !!err || (!!d && query===String(expected).trim().toLowerCase() && Number.isFinite(Number(perf?.totalMs)));
    },target,{timeout:95000,polling:100});
    await page.waitForTimeout(700);
    error=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  }catch(e){timedOut=String(e?.message||e).includes('Timeout');error=error||String(e?.message||e);}

  const snap=await page.evaluate(()=>{
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{};
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{};
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{};
    const land=window.EARTHLINE_LAND_VALIDITY_16584||{};
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||{};
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||{};
    const cap=window.EARTHLINE_SUPPORTED_CAPACITY_16843||{};
    const local=window.EARTHLINE_STATEWIDE_SUPERTILE_16839||{};
    const coverage=window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||{};
    const r=d?.recharge||window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.recharge||{};
    const components=r?.components||{};
    const weights=r?.weights||{};
    const climate=r?.climate||{};
    const gaugeText=document.getElementById('earthlineRechargePotentialValue16488')?.textContent||'';
    const gaugePct=Number(String(gaugeText).replace(/[^0-9.\-]/g,''));
    const outsideObj=boundary?.outsideAfterClip||null;
    return {
      query:String(d?.query||''),tier:String(d?.tier||d?.mode||''),
      build:cap.build||null,
      generated:Number(pub?.generated||0),visible:Number(disp?.swaleLines||0),
      waterPaths:Number(d?.derived?.waterPaths??disp?.waterPaths??0),
      unsafe:Number(flow?.unsafeSegments??NaN),
      outsidePub:Number(pub?.outsideJurisdiction??pub?.outside??pub?.outsideCount??0),outsideObj,
      waterReady:Array.isArray(land?.waterParts),waterParts:Array.isArray(land?.waterParts)?land.waterParts.length:null,
      totalMs:Number(perf?.totalMs??NaN),coveragePassed:coverage?.passed===true,
      localAdded:Number(local?.added||0),localFailed:Number(local?.failed||0),
      score:Number(r?.score??NaN),rainfallIn:Number(r?.rainfallIn??NaN),mode:String(r?.mode||''),basis:String(r?.basis||''),
      components:{aquifer:Number(components?.aquifer??NaN),soil:Number(components?.soil??NaN),slope:Number(components?.slope??NaN),flow:Number(components?.flow??NaN)},
      weights:{aquifer:Number(weights?.aquifer??NaN),soil:Number(weights?.soil??NaN),slope:Number(weights?.slope??NaN),flow:Number(weights?.flow??NaN),climate:Number(weights?.climate??NaN)},
      climate:{need:Number(climate?.need??NaN),multiplier:Number(climate?.multiplier??NaN),baseTerm:Number(climate?.baseTerm??NaN)},
      gaugePct:Number.isFinite(gaugePct)?gaugePct:null,
      aquiferStatus:String(d?.aquifers?.status||''),aquiferFeatures:Number(d?.aquifers?.features??0),contextFailures:Array.isArray(d?.failures)?d.failures:[]
    };
  }).catch(()=>({}));

  const c=snap.components||{},w=snap.weights||{},cl=snap.climate||{};
  const neutralBase=(Number(c.aquifer)/100)*Number(w.aquifer)+(Number(c.soil)/100)*Number(w.soil)+(Number(c.slope)/100)*Number(w.slope)+(Number(c.flow)/100)*Number(w.flow)+0.5*Number(w.climate);
  const neutralScore=Number.isFinite(neutralBase)?Math.round(Math.max(0,Math.min(1,neutralBase))*100):null;
  const climateDelta=(Number.isFinite(snap.score)&&Number.isFinite(neutralScore))?snap.score-neutralScore:null;
  const realism=[];
  if(snap.mode==='regional-model-fallback') realism.push('regional-model-fallback');
  if(c.aquifer===45) realism.push('fixed-aquifer-45');
  if(c.soil===55) realism.push('fixed-soil-55');
  if(Number.isFinite(cl.multiplier)&&cl.multiplier<0.999&&Number(snap.rainfallIn)>=45) realism.push('high-rainfall-penalty');
  if(Number.isFinite(cl.multiplier)&&cl.multiplier>1.001) realism.push('dryness-boost');
  if(Number.isFinite(climateDelta)&&Math.abs(climateDelta)>=4) realism.push(`climate-shift-${climateDelta>0?'plus':'minus'}${Math.abs(climateDelta)}`);
  if(Number.isFinite(snap.gaugePct)&&Number.isFinite(snap.score)&&Math.abs(snap.gaugePct-snap.score)>0.51) realism.push('gauge-display-score-mismatch');

  const failures=[];
  if(error) failures.push('runtime/error');
  if(!(snap.generated>0)) failures.push('zero swales');
  if(snap.generated!==snap.visible) failures.push('generated/visible mismatch');
  if(!Number.isFinite(snap.totalMs)||snap.totalMs>15000) failures.push('runtime >15s');
  if(Number.isFinite(snap.unsafe)&&snap.unsafe!==0) failures.push('unsafe segments');
  if(Number.isFinite(snap.outsidePub)&&snap.outsidePub!==0) failures.push('outside jurisdiction');
  if(snap.outsideObj&&Object.values(snap.outsideObj).some(v=>Number(v||0)!==0)) failures.push('boundary outside');
  if(!snap.waterReady) failures.push('water sidecar');
  if(!(snap.waterPaths>0)) failures.push('water paths');
  if(snap.localFailed!==0) failures.push('local generation failures');
  if(!Number.isFinite(snap.score)) failures.push('gauge score missing');

  const review=[];
  if(snap.totalMs>13000&&snap.totalMs<=15000) review.push('runtime headroom <2s');
  if(snap.generated<100) review.push('low displayed corridor count');
  if(realism.length) review.push(...realism.map(x=>'gauge:'+x));
  if((snap.contextFailures||[]).length) review.push(...snap.contextFailures.map(x=>'context:'+x));

  try{await page.screenshot({path:path.join(OUTDIR,`${safeName(target)}.jpg`),type:'jpeg',quality:45,fullPage:false});}catch{}
  const row={target,elapsedMs:Date.now()-started,timedOut,error,snap,neutralScore,climateDelta,realism,failures,review,enginePass:failures.length===0,gaugeRealismPass:realism.length===0};
  rows.push(row);console.log(JSON.stringify(row));
  await page.close();
}
await browser.close();
const failed=rows.filter(r=>!r.enginePass).map(r=>({target:r.target,failures:r.failures}));
const gaugeCompromised=rows.filter(r=>!r.gaugeRealismPass).map(r=>({target:r.target,score:r.snap.score,rainfallIn:r.snap.rainfallIn,neutralScore:r.neutralScore,climateDelta:r.climateDelta,realism:r.realism}));
const summary={at:new Date().toISOString(),batch:BATCH,url:URL,build:'EARTHLINE 16844',enginePass:failed.length===0,gaugeRealismPass:gaugeCompromised.length===0,failed,gaugeCompromised,rows};
fs.writeFileSync(path.join(OUTDIR,'audit.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({batch:BATCH,enginePass:summary.enginePass,gaugeRealismPass:summary.gaugeRealismPass,failed,gaugeCompromised:gaugeCompromised.length,targets:rows.length}));
if(failed.length) process.exitCode=1;
