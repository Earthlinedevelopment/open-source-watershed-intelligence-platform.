import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'Texas|Louisiana|Florida|New York|Colorado|California').split('|').filter(Boolean);
const browser=await chromium.launch({headless:true});
const rows=[];

for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const started=Date.now();let timedOut=false,error=null;
  try{
    await page.goto(URL+'?validate16730='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730=null;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },stateName);
    await page.waitForFunction(expected=>{
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      return String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase() &&
        (!!err || (!!pub?.runToken && /screening published\./i.test(status)));
    },stateName,{timeout:60000,polling:100});
    error=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  }catch(e){timedOut=true;error=error||String(e&&e.message||e);}
  await page.waitForTimeout(400);
  const snap=await page.evaluate(()=>{
    const gap=window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730||null;
    const coast=window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705||null;
    const input=window.EARTHLINE_SCALE_REFINED_INPUT_16702||null;
    const cov=window.EARTHLINE_REFINED_COVERAGE_SELECTION_16713||null;
    const order=window.EARTHLINE_REGIONAL_SCORE_ORDER_16717||null;
    const vis=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(vis?.swales?.features)?vis.swales.features:[];
    const mids=sw.map(f=>{
      const c=f?.geometry?.coordinates||[];const m=c[Math.floor((c.length-1)/2)]||[NaN,NaN];
      return {lng:+m[0],lat:+m[1],score:+(f?.properties?.score||0),rank:+(f?.properties?.rank||0),grade:String(f?.properties?.grade||'')};
    }).filter(p=>Number.isFinite(p.lng)&&Number.isFinite(p.lat));
    const b=vis?.bounds||null;
    let occ=null;
    if(Array.isArray(b)&&b.length===4&&mids.length){
      const cells=[];
      for(let by=0;by<4;by++)for(let bx=0;bx<4;bx++){
        const x0=b[0]+(b[2]-b[0])*bx/4,x1=b[0]+(b[2]-b[0])*(bx+1)/4;
        const y0=b[1]+(b[3]-b[1])*by/4,y1=b[1]+(b[3]-b[1])*(by+1)/4;
        const count=mids.filter(p=>p.lng>=x0&&p.lng<=x1&&p.lat>=y0&&p.lat<=y1).length;
        cells.push({bx,by,count});
      }
      occ={occupied:cells.filter(c=>c.count>0).length,blank:cells.filter(c=>c.count===0).length,cells};
    }
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    return {
      gap,coast,input:input?{tiles:input.tiles,input:input.input,elapsedMs:input.elapsedMs}:null,
      coverage:cov?{input:cov.input,reserved:cov.reserved,inputXSpan:cov.inputXSpan,inputYSpan:cov.inputYSpan,reservedXSpan:cov.reservedXSpan,reservedYSpan:cov.reservedYSpan}:null,
      order:order?{chosen:order.chosen,refined:order.refined,monotonic:order.monotonic,top20:order.top20}:null,
      swales:mids.length,bounds:b,occupancy:occ,
      generated:Number(pub?.generated??0),visible:Number(disp?.swaleLines??0),totalMs:Number(perf?.totalMs??NaN),
      unsafe:Number(flow?.unsafeSegments??0),outside:boundary?.outsideAfterClip||null
    };
  });
  const failures=[];
  if(timedOut)failures.push('timeout');
  if(error)failures.push('error '+JSON.stringify(error));
  if(!(snap.generated>0))failures.push('zero swales');
  if(snap.generated!==snap.visible)failures.push('visible/generated '+snap.visible+'/'+snap.generated);
  if(!(snap.totalMs<=15000))failures.push('core '+snap.totalMs);
  if(snap.unsafe!==0)failures.push('unsafe '+snap.unsafe);
  if(snap.outside&&Object.values(snap.outside).some(v=>Number(v||0)!==0))failures.push('outside '+JSON.stringify(snap.outside));
  if(snap.order&&snap.order.monotonic!==true)failures.push('rank order');
  rows.push({state:stateName,elapsedMs:Date.now()-started,timedOut,error,snap,failures,pass:failures.length===0});
  await page.close();
}
await browser.close();
const out={at:new Date().toISOString(),url:URL,rows,failed:rows.filter(r=>!r.pass).map(r=>({state:r.state,failures:r.failures})),pass:rows.every(r=>r.pass)};
fs.writeFileSync(process.env.OUT||'lab/16730-validation.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
if(!out.pass)process.exitCode=1;
