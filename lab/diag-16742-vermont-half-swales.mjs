import { chromium } from 'playwright';
import fs from 'node:fs';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
let error=null;
try{
  await page.goto(URL+'?vt16742='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  });
  await page.waitForFunction(()=>{
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
    return !!pub?.runToken && /screening published\./i.test(status);
  },{timeout:60000,polling:100});
  error=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
}catch(e){error=error||String(e&&e.message||e);}
await page.waitForTimeout(500);
const snap=await page.evaluate(()=>{
  const vis=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
  const fs=Array.isArray(vis?.swales?.features)?vis.swales.features:[];
  const bounds=vis?.bounds||window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556?.regionalExtent?.bbox||null;
  const pts=fs.map(f=>{
    const c=f?.geometry?.coordinates||[],m=c[Math.floor((c.length-1)/2)]||[NaN,NaN],p=f?.properties||{};
    return {lng:+m[0],lat:+m[1],rank:+p.rank,score:+p.score,grade:String(p.grade||''),slope:+p.slope_pct};
  }).filter(p=>Number.isFinite(p.lng)&&Number.isFinite(p.lat));
  let quadrants=null,grid=null;
  if(Array.isArray(bounds)&&bounds.length===4&&pts.length){
    const [w,s,e,n]=bounds,mx=(w+e)/2,my=(s+n)/2;
    quadrants={
      nw:pts.filter(p=>p.lng<mx&&p.lat>=my).length,
      ne:pts.filter(p=>p.lng>=mx&&p.lat>=my).length,
      sw:pts.filter(p=>p.lng<mx&&p.lat<my).length,
      se:pts.filter(p=>p.lng>=mx&&p.lat<my).length
    };
    const cells=[];
    for(let by=0;by<6;by++)for(let bx=0;bx<6;bx++){
      const x0=w+(e-w)*bx/6,x1=w+(e-w)*(bx+1)/6,y0=s+(n-s)*by/6,y1=s+(n-s)*(by+1)/6;
      cells.push({bx,by,count:pts.filter(p=>p.lng>=x0&&p.lng<=x1&&p.lat>=y0&&p.lat<=y1).length});
    }
    grid=cells;
  }
  return {
    bounds,swaleCount:pts.length,points:pts,quadrants,grid,
    coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,
    refine:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,
    late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null,
    spatial:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,
    selection:window.EARTHLINE_REFINED_COVERAGE_SELECTION_16713||null,
    generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
    publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    boundary:window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178||window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    performance:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
  };
});
await browser.close();
const out={at:new Date().toISOString(),url:URL,error,snap};
fs.writeFileSync(process.env.OUT||'vt16742.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
