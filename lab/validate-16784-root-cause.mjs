import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'Vermont').split('|').filter(Boolean);
const browser=await chromium.launch({headless:true});
const rows=[];
for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const started=Date.now(); let timedOut=false,error=null;
  try{
    await page.goto(URL+'?m4516784='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },stateName);
    await page.waitForFunction(expected=>{
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      const spatial=window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null;
      const audit=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      const identityMatches=String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase();
      const generated=Number(pub?.generated??0),visible=Number(disp?.swaleLines??0);
      return identityMatches && (!!err || (spatial?.build==='EARTHLINE 16783'&&audit?.build==='EARTHLINE 16784'&&audit?.stage==='core-published'&&generated>0&&visible===generated));
    },stateName,{timeout:70000,polling:100});
    error=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  }catch(e){timedOut=true;error=error||String(e&&e.message||e);}
  await page.waitForTimeout(200);
  const snap=await page.evaluate(()=>{
    const spatial=window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||{};
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{};
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{};
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{};
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178||{};
    const order=window.EARTHLINE_REGIONAL_SCORE_ORDER_16717||{};
    const land=window.EARTHLINE_LAND_VALIDITY_16584||{};
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||{};
    const audit=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
    return {
      spatialBuild:spatial.build||null,auditBuild:audit?.build||null,
      generated:Number(pub.generated||0),visible:Number(disp.swaleLines||0),totalMs:Number(perf.totalMs??NaN),
      unsafe:Number(flow.unsafeSegments??0),outside:boundary.outsideAfterClip||null,orderMonotonic:order.monotonic??null,
      waterReady:Array.isArray(land.waterParts),identity:String(pkg?.identity?.name||''),
      audit
    };
  }).catch(()=>({}));
  const machineFailures=[];
  if(timedOut)machineFailures.push('timeout');
  if(error)machineFailures.push('error '+JSON.stringify(error));
  if(snap.spatialBuild!=='EARTHLINE 16783')machineFailures.push('spatial build '+snap.spatialBuild);
  if(snap.auditBuild!=='EARTHLINE 16784')machineFailures.push('audit build '+snap.auditBuild);
  if(!(snap.generated>0))machineFailures.push('zero swales');
  if(snap.generated!==snap.visible)machineFailures.push('visible/generated '+snap.visible+'/'+snap.generated);
  if(!(snap.totalMs<=15000))machineFailures.push('core '+snap.totalMs);
  if(snap.unsafe!==0)machineFailures.push('unsafe '+snap.unsafe);
  if(!snap.waterReady)machineFailures.push('water sidecar not ready');
  if(snap.outside&&Object.values(snap.outside).some(v=>Number(v||0)!==0))machineFailures.push('outside '+JSON.stringify(snap.outside));
  if(snap.orderMonotonic===false)machineFailures.push('rank order');
  if(String(snap.identity||'').toLowerCase()!==stateName.toLowerCase())machineFailures.push('identity '+snap.identity);
  rows.push({
    state:stateName,elapsedMs:Date.now()-started,timedOut,error,
    generated:snap.generated,visible:snap.visible,totalMs:snap.totalMs,unsafe:snap.unsafe,
    machineFailures,machinePass:machineFailures.length===0,
    firstFailedStage:snap.audit?.firstFailedStage||null,
    repairOwner:snap.audit?.repairOwner||null,
    auditPass:snap.audit?.pass??null,
    cellLineage:snap.audit?.cellLineage||null,
    rankedCauses:(snap.audit?.rankedCauses||[]).slice(0,5)
  });
  await page.close();
}
await browser.close();
const stageCounts={};
for(const r of rows){const k=r.firstFailedStage||'none';stageCounts[k]=(stageCounts[k]||0)+1;}
const causeProbabilityMeans={};
for(const r of rows)for(const c of r.rankedCauses||[]){
  const x=causeProbabilityMeans[c.id]||(causeProbabilityMeans[c.id]={sum:0,n:0});
  x.sum+=Number(c.probabilityPct||0);x.n++;
}
for(const [k,v] of Object.entries(causeProbabilityMeans))causeProbabilityMeans[k]=Number((v.sum/Math.max(1,v.n)).toFixed(1));
const out={
  at:new Date().toISOString(),url:URL,count:rows.length,
  machinePassed:rows.filter(r=>r.machinePass).length,
  machineFailed:rows.filter(r=>!r.machinePass).map(r=>({state:r.state,failures:r.machineFailures})),
  auditPassed:rows.filter(r=>r.auditPass===true).length,
  firstFailedStageCounts:stageCounts,
  meanTopCauseProbabilityPct:causeProbabilityMeans,
  rows
};
fs.writeFileSync(process.env.OUT||'rootcause16784.json',JSON.stringify(out,null,2));
console.log(JSON.stringify({
  count:out.count,machinePassed:out.machinePassed,machineFailed:out.machineFailed,
  auditPassed:out.auditPassed,firstFailedStageCounts:out.firstFailedStageCounts,
  states:rows.map(r=>({state:r.state,first:r.firstFailedStage,machinePass:r.machinePass,ms:r.totalMs,top:r.rankedCauses?.[0]?.id,p:r.rankedCauses?.[0]?.probabilityPct}))
}));
