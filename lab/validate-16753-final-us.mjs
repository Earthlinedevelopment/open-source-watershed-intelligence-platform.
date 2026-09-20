import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
const OUT=process.env.OUT||'final-us.json';
if(!STATES.length)throw new Error('STATES required');

const browser=await chromium.launch({headless:true});
const rows=[];

for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const started=Date.now();let timedOut=false,error=null;
  try{
    await page.goto(URL+'?final16753='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731=null;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },stateName);
    await page.waitForFunction(expected=>{
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      const exact=String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase();
      const vt=String(expected).toLowerCase()==='vermont'&&String(pub?.runToken||'').toLowerCase().includes('vermont');
      return (exact||vt) && (!!err || (!!pub?.runToken && /screening published\./i.test(status) && !!window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731));
    },stateName,{timeout:60000,polling:100});
    error=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  }catch(e){timedOut=true;error=error||String(e&&e.message||e);}
  await page.waitForTimeout(600);

  const snap=await page.evaluate(()=>{
    const audit=window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const land=window.EARTHLINE_LAND_VALIDITY_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const order=window.EARTHLINE_REGIONAL_SCORE_ORDER_16717||null;
    const dr=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const vtBoundary=window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178||null;
    const outside=(boundary?.outsideAfterClip)||null;
    return {
      audit,
      generated:Number(pub?.generated??0),
      visible:Number(disp?.swaleLines??0),
      totalMs:Number(perf?.totalMs??NaN),
      orderMonotonic:order?.monotonic??null,
      slopeReady:!!dr?.terrain?.source && Number.isFinite(Number(dr?.recharge?.components?.slope)),
      waterPaths:Number(dr?.derived?.waterPaths??disp?.waterPaths??0),
      aquiferReady:!!dr?.aquifers && typeof dr.aquifers.status==='string',
      aquiferSource:String(dr?.aquifers?.source||''),
      exclusionsReady:!!flow && Number(flow?.unsafeSegments??NaN)===0,
      unsafe:flow?Number(flow?.unsafeSegments??NaN):NaN,
      waterCartReady:!!land && Array.isArray(land?.waterParts),
      waterParts:Array.isArray(land?.waterParts)?land.waterParts.length:null,
      outside,
      vtBoundaryAfter:vtBoundary?.after?.swales??null,
      vtBoundaryRemoved:vtBoundary?.removed?.swales??null
    };
  });

  const failures=[];
  if(timedOut)failures.push('timeout');
  if(error)failures.push('error '+JSON.stringify(error));
  if(!snap.audit||snap.audit.passed!==true)failures.push('coverage '+JSON.stringify(snap.audit?.unresolved||null));
  if(!(snap.generated>0))failures.push('zero swales');
  if(snap.generated!==snap.visible)failures.push('visible/generated '+snap.visible+'/'+snap.generated);
  if(!(snap.totalMs<=15000))failures.push('core '+snap.totalMs);
  if(snap.orderMonotonic===false)failures.push('rank order');
  if(!snap.slopeReady)failures.push('slope owner not ready');
  if(!(snap.waterPaths>0))failures.push('water paths missing');
  if(!snap.aquiferReady)failures.push('aquifer owner not ready');
  if(!snap.exclusionsReady)failures.push('exclusions unsafe/missing '+snap.unsafe);
  if(!snap.waterCartReady)failures.push('water sidecar not ready');
  if(snap.outside&&Object.values(snap.outside).some(v=>Number(v||0)!==0))failures.push('outside '+JSON.stringify(snap.outside));
  if(stateName==='Vermont' && snap.vtBoundaryAfter!=null && Number(snap.vtBoundaryAfter)!==snap.generated)failures.push('Vermont boundary after/generated '+snap.vtBoundaryAfter+'/'+snap.generated);

  rows.push({state:stateName,elapsedMs:Date.now()-started,timedOut,error,snap,failures,pass:failures.length===0});
  await page.close();
}

await browser.close();
const failed=rows.filter(r=>!r.pass).map(r=>({state:r.state,failures:r.failures}));
const out={at:new Date().toISOString(),url:URL,ruleSet:['SLOPE','WATER PATHS','AQUIFERS','EXCLUSIONS'],waterSidecar:true,rows,failed,pass:failed.length===0};
fs.writeFileSync(OUT,JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
if(failed.length)process.exitCode=1;
