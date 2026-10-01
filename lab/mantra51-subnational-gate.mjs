import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const targets=['England','Vancouver Island'];
const browser=await chromium.launch({headless:true});
const rows=[];

for(const target of targets){
  const page=await browser.newPage({viewport:{width:1500,height:860}});
  let geocode=null,harnessError=null;
  try{
    await page.goto(URL+'?m51-subnational='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>typeof window.geocodeMapbox==='function',{timeout:30000});
    geocode=await page.evaluate(async q=>{
      try{return await geocodeMapbox(q);}catch(e){return {__error:String(e?.message||e)};}
    },target);
    if(geocode?.__error)throw new Error(geocode.__error);
    if(!geocode)throw new Error('geocoder returned no location');
    await page.evaluate(q=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      const i=document.getElementById('searchInput');
      i.value=q;
      i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));
      document.getElementById('runBtn').click();
    },target);
    await page.waitForFunction(q=>{
      const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
      const d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;
      return !!e||String(d?.query||'').trim().toLowerCase()===String(q).trim().toLowerCase();
    },target,{timeout:95000,polling:100});
    await page.waitForTimeout(500);
  }catch(e){harnessError=String(e?.message||e);}
  const snap=await page.evaluate(({target,geocode,harnessError})=>{
    const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
    const run=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const fallbackVisible=pub?.rendered??pub?.generated??0;
    return {
      target,harnessError,
      geocode:{
        name:geocode?.name||null,fullName:geocode?.fullName||null,
        placeType:geocode?.placeType||null,countryCode:geocode?.countryCode||null,
        bbox:geocode?.bbox||null,lat:geocode?.lat??null,lng:geocode?.lng??null
      },
      error:err&&String(err.error||err.message||err),
      runBounds:run?.bounds||null,
      generated:Number(pub?.generated||0),
      visible:Number(pub?.visible??fallbackVisible),
      outside:Number(pub?.outsideJurisdiction??pub?.outside??0),
      unsafe:Number(pub?.unsafeDisplayedSegments??pub?.unsafe??0),
      waterPaths:Number(run?.derived?.waterPaths||0),
      totalMs:Number(perf?.totalMs||0),
      boundaryCapability:boundary?.capability||boundary?.source||null
    };
  },{target,geocode,harnessError});
  rows.push(snap);
  console.log(JSON.stringify(snap));
  await page.close();
}
await browser.close();
const bad=rows.filter(r=>r.harnessError||r.error||r.generated===0||r.visible===0||r.waterPaths===0||r.unsafe!==0);
console.log(JSON.stringify({summary:{bad:bad.map(r=>r.target),passes:rows.filter(r=>!bad.includes(r)).map(r=>r.target),count:rows.length}}));
if(bad.length)process.exit(1);
