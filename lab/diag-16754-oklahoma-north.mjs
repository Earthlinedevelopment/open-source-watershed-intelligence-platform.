import { chromium } from 'playwright';
import fs from 'node:fs';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1908,height:882}});
await page.goto(URL+'?ok16754='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Oklahoma';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
await page.waitForFunction(()=>{const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!p?.runToken&&/screening published\./i.test(s);},{timeout:60000,polling:100});
await page.waitForTimeout(500);
const out=await page.evaluate(()=>{
  const vis=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
  const fs=Array.isArray(vis?.swales?.features)?vis.swales.features:[];
  const b=vis?.bounds||window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556?.regionalExtent?.bbox||null;
  const pts=fs.map(f=>{const c=f?.geometry?.coordinates||[],m=c[Math.floor((c.length-1)/2)]||[NaN,NaN],p=f?.properties||{};return{lng:+m[0],lat:+m[1],rank:+p.rank,score:+p.score,grade:String(p.grade||''),slope:+p.slope_pct};}).filter(p=>Number.isFinite(p.lng)&&Number.isFinite(p.lat));
  let latBands=[],lonBands=[];
  if(Array.isArray(b)&&b.length===4){
    const [w,s,e,n]=b;
    for(let k=0;k<10;k++){
      const y0=s+(n-s)*k/10,y1=s+(n-s)*(k+1)/10;
      latBands.push({k,y0,y1,count:pts.filter(p=>p.lat>=y0&&p.lat<=y1).length});
      const x0=w+(e-w)*k/10,x1=w+(e-w)*(k+1)/10;
      lonBands.push({k,x0,x1,count:pts.filter(p=>p.lng>=x0&&p.lng<=x1).length});
    }
  }
  return {
    bounds:b,
    swaleCount:pts.length,
    latBands,
    lonBands,
    coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,
    carry:window.EARTHLINE_COVERAGE_CARRY_16749||null,
    late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null,
    spatial:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,
    refine:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,
    generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
    performance:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null
  };
});
await browser.close();
fs.writeFileSync(process.env.OUT||'ok16754.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
