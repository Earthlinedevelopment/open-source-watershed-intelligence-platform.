import { chromium } from 'playwright';
const PROD=process.env.EARTHLINE_PROD||'https://earthlinedevelopment.org/';
const CAND=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const countryTargets=['Cabo Verde','Singapore','Indonesia','India','Australia','Comoros','Mauritius','Seychelles','Dominica','Guinea'];
const cityTargets=['Paris','Bangkok','Chiang Mai'];
const usTargets=['Georgia','Washington','New York','Vermont','Arkansas','Hawaii','Texas'];
const browser=await chromium.launch({headless:true});
const rows=[];

async function captureGeocoder(target){
 const page=await browser.newPage({viewport:{width:1300,height:780}});let error=null,initial=null,countryOnly=null,baseline=null;
 try{
  await page.goto(PROD+'?fallback-capture-16846='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const out=await page.evaluate(async q=>{
    const clean=typeof earthlinePlaceLookupQuery16541==='function'?earthlinePlaceLookupQuery16541(q):q;
    const originalFetch=window.fetch.bind(window);let first=null;
    window.fetch=async(...args)=>{const r=await originalFetch(...args);try{const u=String(args[0]||'');if(u.includes('api.mapbox.com/geocoding/')&&!u.includes('types=country')){const j=await r.clone().json();first=j;}}catch{}return r;};
    let loc=null,err=null;try{loc=await geocodeMapbox(q);}catch(e){err=String(e?.message||e);}
    let countries=null,cerr=null;
    try{const u='https://api.mapbox.com/geocoding/v5/mapbox.places/'+encodeURIComponent(clean)+'.json?limit=5&types=country&language=en&access_token='+MAPBOX_TOKEN;const r=await originalFetch(u);if(r.ok)countries=await r.json();else cerr='HTTP '+r.status;}catch(e){cerr=String(e?.message||e);}
    return {err,loc,first,countries,cerr};
  },target);
  if(out?.err)throw new Error(out.err);initial=out?.first||null;countryOnly=out?.countries||null;baseline=out?.loc||null;if(!initial?.features)throw new Error('initial geocoder response missing');
 }catch(e){error=String(e?.message||e);}await page.close();return {error,initial,countryOnly,baseline};
}

async function runCandidateGeocoder(target,capture){
 const page=await browser.newPage({viewport:{width:1200,height:760}});let error=null,result=null;
 try{
  await page.goto(CAND+'?fallback-candidate-16846='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof window.geocodeMapbox==='function',{timeout:30000});
  result=await page.evaluate(async({q,initial,countryOnly})=>{
    const original=window.fetch.bind(window);
    window.fetch=async(url,opts)=>{const u=String(url||'');if(u.includes('api.mapbox.com/geocoding/')){const payload=u.includes('types=country')?countryOnly:initial;return new Response(JSON.stringify(payload||{type:'FeatureCollection',features:[]}),{status:200,headers:{'content-type':'application/json'}});}return original(url,opts);};
    let loc=null,err=null;try{loc=await geocodeMapbox(q);}catch(e){err=String(e?.message||e);}return {err,loc};
  },{q:target,initial:capture.initial,countryOnly:capture.countryOnly});
 }catch(e){error=String(e?.message||e);}await page.close();return {error,result};
}

for(const target of [...countryTargets,...cityTargets]){const cap=await captureGeocoder(target);const cand=cap.error?{error:'capture failed',result:null}:await runCandidateGeocoder(target,cap);const row={kind:countryTargets.includes(target)?'country':'city',target,captureError:cap.error,baseline:cap.baseline?{name:cap.baseline.name,countryCode:cap.baseline.countryCode,placeType:cap.baseline.placeType}:null,countryOnlyFeatures:cap.countryOnly?.features?.slice(0,3).map(f=>({text:f.text,placeType:f.place_type?.[0],placeName:f.place_name,relevance:f.relevance}))||[],candidateError:cand.error,candidate:cand.result?.loc?{name:cand.result.loc.name,countryCode:cand.result.loc.countryCode,placeType:cand.result.loc.placeType}:null,candidateInnerError:cand.result?.err||null};rows.push(row);console.log(JSON.stringify(row));}

for(const target of usTargets){const page=await browser.newPage({viewport:{width:1400,height:820}});let row={kind:'us',target,error:null};try{await page.goto(CAND+'?us-fallback-control-16846='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#searchInput',{timeout:30000});await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click();},target);await page.waitForFunction(q=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;return !!e||String(d?.query||'').toLowerCase()===String(q).toLowerCase();},target,{timeout:95000,polling:100});row=await page.evaluate(({target})=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,p=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;return {kind:'us',target,error:e&&String(e.error||e.message||e),profileId:p?.profileId||null,generated:Number(pub?.generated||0),outside:Number(pub?.outsideJurisdiction??pub?.outside??0),unsafe:Number(pub?.unsafeDisplayedSegments??pub?.unsafe??0),totalMs:Number(perf?.totalMs||0)};},{target});}catch(e){row.error=String(e?.message||e);}await page.close();rows.push(row);console.log(JSON.stringify(row));}
await browser.close();

const countryBad=rows.filter(r=>r.kind==='country'&&(r.captureError||r.candidateError||r.candidateInnerError||!r.candidate||r.candidate.placeType!=='country'));
const cabo=rows.find(r=>r.kind==='country'&&r.target==='Cabo Verde');if(cabo&&cabo.candidate?.countryCode!=='cv')countryBad.push(cabo);
const cityBad=rows.filter(r=>r.kind==='city'&&(r.captureError||r.candidateError||r.candidateInnerError||!r.candidate||r.candidate.placeType==='country'||r.candidate.countryCode!==r.baseline?.countryCode));
const usBad=rows.filter(r=>r.kind==='us'&&(r.error||!r.profileId||r.outside!==0||r.unsafe!==0||r.totalMs>15000));
console.log(JSON.stringify({summary:{countryBad:[...new Set(countryBad.map(r=>r.target))],cityBad:cityBad.map(r=>r.target),usBad:usBad.map(r=>r.target),countryPass:rows.filter(r=>r.kind==='country'&&!countryBad.includes(r)).map(r=>r.target),cityPass:rows.filter(r=>r.kind==='city'&&!cityBad.includes(r)).map(r=>r.target),usPass:rows.filter(r=>r.kind==='us'&&!usBad.includes(r)).map(r=>r.target)}}));
if(countryBad.length||cityBad.length||usBad.length)process.exit(1);
