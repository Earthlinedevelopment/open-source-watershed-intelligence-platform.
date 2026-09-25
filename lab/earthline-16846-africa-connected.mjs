import { chromium } from 'playwright';
const PROD=process.env.EARTHLINE_PROD||'https://earthlinedevelopment.org/';
const CAND=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const targets=(process.env.TARGETS||'').split('|').map(x=>x.trim()).filter(Boolean);
if(!targets.length)throw new Error('TARGETS required');
const browser=await chromium.launch({headless:true});
const rows=[];

async function captureGeocoder(target){
  const page=await browser.newPage({viewport:{width:1250,height:760}});let error=null,initial=null,countryOnly=null;
  try{
    await page.goto(PROD+'?africa-capture-16846='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>typeof window.geocodeMapbox==='function',{timeout:30000});
    const out=await page.evaluate(async q=>{
      const clean=typeof earthlinePlaceLookupQuery16541==='function'?earthlinePlaceLookupQuery16541(q):q;
      const originalFetch=window.fetch.bind(window);let first=null;
      window.fetch=async(...args)=>{const r=await originalFetch(...args);try{const u=String(args[0]||'');if(u.includes('api.mapbox.com/geocoding/')&&!u.includes('types=country'))first=await r.clone().json();}catch{}return r;};
      let err=null;try{await geocodeMapbox(q);}catch(e){err=String(e?.message||e);}
      let countries=null,cerr=null;try{const u='https://api.mapbox.com/geocoding/v5/mapbox.places/'+encodeURIComponent(clean)+'.json?limit=5&types=country&language=en&access_token='+MAPBOX_TOKEN;const r=await originalFetch(u);if(r.ok)countries=await r.json();else cerr='HTTP '+r.status;}catch(e){cerr=String(e?.message||e);}
      return {err,first,countries,cerr};
    },target);
    if(out?.err)throw new Error(out.err);if(!out?.first?.features)throw new Error('initial geocoder response missing');initial=out.first;countryOnly=out.countries||{type:'FeatureCollection',features:[]};
  }catch(e){error=String(e?.message||e);}await page.close();return {error,initial,countryOnly};
}

async function runCandidate(target,capture){
  const page=await browser.newPage({viewport:{width:1500,height:860}});let harnessError=null;
  try{
    await page.goto(CAND+'?africa-candidate-16846='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>typeof window.geocodeMapbox==='function',{timeout:30000});
    const resolved=await page.evaluate(async({q,initial,countryOnly})=>{
      const original=window.fetch.bind(window);
      window.fetch=async(url,opts)=>{const u=String(url||'');if(u.includes('api.mapbox.com/geocoding/')){const payload=u.includes('types=country')?countryOnly:initial;return new Response(JSON.stringify(payload||{type:'FeatureCollection',features:[]}),{status:200,headers:{'content-type':'application/json'}});}return original(url,opts);};
      let loc=null,err=null;try{loc=await geocodeMapbox(q);}catch(e){err=String(e?.message||e);}return {loc,err};
    },{q:target,initial:capture.initial,countryOnly:capture.countryOnly});
    if(resolved?.err)throw new Error(resolved.err);if(!resolved?.loc)throw new Error('candidate geocoder returned no location');
    const loc=resolved.loc;
    await page.evaluate(({q,loc})=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;window.EARTHLINE_TEST_LOCATION_16845=Object.assign({},loc,{query:q,placeType:'country'});const i=document.getElementById('searchInput');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click();},{q:target,loc});
    await page.waitForFunction(q=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;return !!e||String(d?.query||'').trim().toLowerCase()===String(q).trim().toLowerCase();},target,{timeout:95000,polling:100});
    await page.waitForTimeout(350);
  }catch(e){harnessError=String(e?.message||e);}
  const snap=await page.evaluate(({target,harnessError})=>{const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,run=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null,pkg=window.EARTHLINE_LAST_ATOMIC_COUNTRY_PACKAGE_16845||null,boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;const rb=run?.bounds||null,cb=pkg?.regionalExtent?.bbox||null;const span=x=>Array.isArray(x)?[+(x[2]-x[0]).toFixed(4),+(x[3]-x[1]).toFixed(4)]:null;const fallbackVisible=pub?.rendered??pub?.generated??0;let loc=null;try{loc=typeof M!=='undefined'&&M?.loc?M.loc:null;}catch{}return {target,harnessError,error:err&&String(err.error||err.message||err),resolvedType:loc?.placeType||null,resolvedCode:loc?.countryCode||null,resolvedName:loc?.name||null,code:pkg?.countryCode||null,package:!!pkg,boundaryCapability:boundary?.capability||boundary?.source||null,runSpan:span(rb),countrySpan:span(cb),generated:Number(pub?.generated||0),visible:Number(pub?.visible??fallbackVisible),outside:Number(pub?.outsideJurisdiction??pub?.outside??0),unsafe:Number(pub?.unsafeDisplayedSegments??pub?.unsafe??0),totalMs:Number(perf?.totalMs||0),waterPaths:Number(run?.derived?.waterPaths||0),directionArrows:Number(run?.derived?.directionArrows||0)};},{target,harnessError});
  await page.close();return snap;
}

for(const target of targets){const cap=await captureGeocoder(target);const cand=cap.error?{target,harnessError:'capture: '+cap.error}:await runCandidate(target,cap);const row={target,captureError:cap.error,candidate:cand};rows.push(row);console.log(JSON.stringify(row));}
await browser.close();
const bad=rows.filter(r=>{const c=r.candidate||{};return r.captureError||c.harnessError||c.error||c.resolvedType!=='country'||!c.package||!c.boundaryCapability||c.generated===0||c.generated!==c.visible||c.outside!==0||c.unsafe!==0||c.waterPaths===0||c.totalMs>15000||!c.runSpan||!c.countrySpan||Math.abs(c.runSpan[0]-c.countrySpan[0])>.02||Math.abs(c.runSpan[1]-c.countrySpan[1])>.02;});
console.log(JSON.stringify({summary:{bad:bad.map(r=>r.target),passes:rows.filter(r=>!bad.includes(r)).map(r=>r.target),count:rows.length}}));
if(bad.length)process.exit(1);
