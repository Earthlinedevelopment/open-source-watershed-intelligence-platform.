import { chromium } from 'playwright';
import fs from 'node:fs';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=['Vermont','Oklahoma'];
const browser=await chromium.launch({headless:true});
const rows=[];
for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  let error=null;
  try{
    await page.goto(URL+'?diag16743='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
    await page.waitForFunction(expected=>{
      const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      const exact=String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase();
      const vt=String(expected).toLowerCase()==='vermont'&&String(p?.runToken||'').toLowerCase().includes('vermont');
      return (exact||vt)&&!!p?.runToken&&/screening published\./i.test(s);
    },stateName,{timeout:60000,polling:100});
  }catch(e){error=String(e&&e.message||e);}
  await page.waitForTimeout(400);
  const snap=await page.evaluate(()=>{
    const vis=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,fs=vis?.swales?.features||[],b=vis?.bounds||window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556?.regionalExtent?.bbox||null;
    const pts=fs.map(f=>{const c=f?.geometry?.coordinates||[],m=c[Math.floor((c.length-1)/2)]||[NaN,NaN],p=f?.properties||{};return{lng:+m[0],lat:+m[1],rank:+p.rank,score:+p.score,grade:String(p.grade||'')}}).filter(p=>Number.isFinite(p.lng)&&Number.isFinite(p.lat));
    let halves=null;
    if(Array.isArray(b)&&b.length===4){const my=(b[1]+b[3])/2;halves={north:pts.filter(p=>p.lat>=my).length,south:pts.filter(p=>p.lat<my).length};}
    return {bounds:b,count:pts.length,halves,coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,refine:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null,spatial:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,selection:window.EARTHLINE_REFINED_COVERAGE_SELECTION_16713||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,performance:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null};
  });
  rows.push({state:stateName,error,snap});await page.close();
}
await browser.close();
const out={at:new Date().toISOString(),rows};fs.writeFileSync(process.env.OUT||'vt-ok-16743.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));
