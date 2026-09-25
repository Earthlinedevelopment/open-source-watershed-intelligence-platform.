import { chromium } from 'playwright';
import fs from 'node:fs';
const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const TARGETS=(process.env.TARGETS||'Thailand|Vietnam|Cambodia|Laos|Arkansas|Hawaii').split('|');
const browser=await chromium.launch({headless:true});
const rows=[];
for(const target of TARGETS){
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  let error=null;
  try{
    await page.goto(URL+'?gate16845='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},target);
    await page.waitForFunction(q=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;return !!e||String(d?.query||'').toLowerCase()===String(q).toLowerCase();},target,{timeout:95000,polling:100});
    await page.waitForTimeout(500);
    error=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  }catch(e){error=String(e?.message||e);}
  const snap=await page.evaluate(()=>{
    const pkg=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null;
    const cp=window.EARTHLINE_LAST_ATOMIC_COUNTRY_PACKAGE_16845||null;
    const sp=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    const b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
    return {active:pkg?{build:pkg.build,packageKind:pkg.packageKind||null,profileId:pkg.profileId,countryCode:pkg.countryCode||pkg.identity?.countryCode||null,capability:pkg.boundary?.capability||null,extent:pkg.regionalExtent?.bbox||null}:null,
      country:cp?{label:cp.boundary?.label,code:cp.countryCode,capability:cp.boundary?.capability,extent:cp.regionalExtent?.bbox}:null,
      state:sp?{profileId:sp.profileId,build:sp.build,capability:sp.boundary?.capability}:null,
      boundary:b?{passed:b.passed,capability:b.capability||b.boundaryCapability||null,outside:b.outsideJurisdiction??b.outsideCount??null}:null,
      publication:pub?{generated:Number(pub.generated??0),visible:Number(pub.visible??pub.displayed??pub.generated??0),outside:Number(pub.outsideJurisdiction??pub.outside??0),unsafe:Number(pub.unsafe??pub.unsafeDisplayedSegments??0)}:null,
      performance:perf?Number(perf.totalMs||0):null,displayed:d?{query:d.query,bounds:d.bounds||d.bbox||null}:null};
  }).catch(e=>({probeError:String(e?.message||e)}));
  try{await page.screenshot({path:'gate-16845-'+target.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.jpg',type:'jpeg',quality:45});}catch{}
  const row={target,error,snap};rows.push(row);console.log(JSON.stringify(row));await page.close();
}
await browser.close();
fs.writeFileSync('gate-16845.json',JSON.stringify(rows,null,2));
console.log(JSON.stringify({summary:rows.map(r=>({target:r.target,error:!!r.error,active:r.snap?.active,performance:r.snap?.performance,publication:r.snap?.publication}))}));
