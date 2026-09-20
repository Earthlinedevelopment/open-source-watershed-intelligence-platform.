import { chromium } from 'playwright';
import fs from 'node:fs';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'Texas|Louisiana|Florida').split('|').filter(Boolean);
const browser=await chromium.launch({headless:true});
const rows=[];
for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const started=Date.now();let error=null;
  try{
    await page.goto(URL+'?diag16729='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
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
  }catch(e){error=error||String(e&&e.message||e);}
  const snap=await page.evaluate(()=>{
    const vis=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(vis?.swales?.features)?vis.swales.features:[];
    const rows=sw.map(f=>{
      const c=f?.geometry?.coordinates||[],m=c[Math.floor((c.length-1)/2)]||[null,null],p=f?.properties||{};
      return {lng:Number(m[0]),lat:Number(m[1]),score:Number(p.score),slope:Number(p.slope_pct),grade:p.grade||null,rank:Number(p.rank),refined:!!p.refined16702,coastKm:Number(p.coastKm16702)};
    });
    const finiteSlope=rows.map(r=>r.slope).filter(Number.isFinite);
    const flat=rows.filter(r=>Number.isFinite(r.slope)&&r.slope<=1);
    const low=rows.filter(r=>Number.isFinite(r.slope)&&r.slope<=2);
    return {
      trigger:window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705||null,
      refinedInput:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,
      refinedSelection:window.EARTHLINE_REFINED_SELECTION_16702||null,
      generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
      performance:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      extent:window.EARTHLINE_REGIONAL_ANALYSIS_EXTENT_16712||null,
      land:window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,
      swaleCount:rows.length,
      slopeStats:finiteSlope.length?{min:Math.min(...finiteSlope),max:Math.max(...finiteSlope),mean:finiteSlope.reduce((a,b)=>a+b,0)/finiteSlope.length,le1:flat.length,le2:low.length}:null,
      bbox:rows.length?[Math.min(...rows.map(r=>r.lng)),Math.min(...rows.map(r=>r.lat)),Math.max(...rows.map(r=>r.lng)),Math.max(...rows.map(r=>r.lat))]:null,
      swales:rows
    };
  }).catch(e=>({snapshotError:String(e)}));
  rows.push({state:stateName,elapsedMs:Date.now()-started,error,snap});
  await page.close();
}
await browser.close();
const out={at:new Date().toISOString(),url:URL,rows};
fs.writeFileSync(process.env.OUT||'coastal-flat-diag.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
