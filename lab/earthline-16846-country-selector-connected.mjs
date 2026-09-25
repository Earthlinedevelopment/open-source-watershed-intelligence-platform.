import { chromium } from 'playwright';
const PROD=process.env.EARTHLINE_PROD||'https://earthlinedevelopment.org/';
const CAND=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const countryTargets=['Cabo Verde','Singapore','Indonesia','India','Australia','Comoros','Mauritius','Seychelles','Dominica','Guinea'];
const usTargets=['Georgia','Washington','New York','Vermont','Arkansas','Hawaii','Texas'];
const browser=await chromium.launch({headless:true});
const rows=[];

async function getFeatures(target){
 const page=await browser.newPage({viewport:{width:1400,height:800}});let error=null,features=null,currentLoc=null;
 try{
  await page.goto(PROD+'?selector-features-16846='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const out=await page.evaluate(async q=>{
    const originalFetch=window.fetch.bind(window);let captured=null;
    window.fetch=async(...args)=>{const r=await originalFetch(...args);try{const u=String(args[0]||'');if(u.includes('api.mapbox.com/geocoding/')){const j=await r.clone().json();captured=j&&j.features||null;}}catch{}return r;};
    const input=document.getElementById('searchInput');input.value=q;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
    let ok=false,err=null;try{ok=await runSearch({autoAnalyze:false});}catch(e){err=String(e?.message||e);}
    let loc=null;try{if(typeof M!=='undefined'&&M&&M.loc)loc=JSON.parse(JSON.stringify(M.loc));}catch{}
    return {ok,err,features:captured,loc};
  },target);
  if(!out?.features?.length)throw new Error(out?.err||'Mapbox features not captured');
  features=out.features;currentLoc=out.loc;
 }catch(e){error=String(e?.message||e);}await page.close();return {error,features,currentLoc};
}

async function testCandidateSelector(target,features){
 const page=await browser.newPage({viewport:{width:1200,height:760}});let error=null,result=null;
 try{
  await page.goto(CAND+'?selector-16846='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof window.earthlineSelectPlaceCandidate16537==='function',{timeout:30000});
  result=await page.evaluate(({q,features})=>{const f=window.earthlineSelectPlaceCandidate16537(q,features);if(!f)return null;const type=(f.place_type&&f.place_type[0])||'';const cf=(type==='country'?f:(f.context||[]).find(c=>String(c.id||'').startsWith('country.')))||null;const cc=String(cf&&((cf.properties&&cf.properties.short_code)||cf.short_code)||'').toLowerCase().slice(0,2);return {type,text:f.text||'',placeName:f.place_name||'',countryCode:cc,center:f.center||null,bbox:f.bbox||null};},{q:target,features});
 }catch(e){error=String(e?.message||e);}await page.close();return {error,result};
}

for(const target of countryTargets){const prod=await getFeatures(target);const cand=prod.features?await testCandidateSelector(target,prod.features):{error:'no features',result:null};const row={kind:'country',target,prodError:prod.error,prodLoc:prod.currentLoc?{name:prod.currentLoc.name,countryCode:prod.currentLoc.countryCode,placeType:prod.currentLoc.placeType}:null,candError:cand.error,cand:cand.result};rows.push(row);console.log(JSON.stringify(row));}
for(const target of usTargets){
 const page=await browser.newPage({viewport:{width:1400,height:800}});let row={kind:'us',target,error:null,package:null};
 try{await page.goto(CAND+'?us-control-16846='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#searchInput',{timeout:30000});await page.evaluate(q=>{const i=document.getElementById('searchInput');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click();},target);await page.waitForFunction(q=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;return !!e||String(d?.query||'').toLowerCase()===String(q).toLowerCase();},target,{timeout:95000,polling:100});row=await page.evaluate(({target})=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,p=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;return {kind:'us',target,error:e&&String(e.error||e.message||e),package:p?{profileId:p.profileId,kind:p.identity?.placeType||null}:null,generated:Number(pub?.generated||0),outside:Number(pub?.outsideJurisdiction??pub?.outside??0),unsafe:Number(pub?.unsafeDisplayedSegments??pub?.unsafe??0),totalMs:Number(perf?.totalMs||0)};},{target});}catch(e){row.error=String(e?.message||e);}await page.close();rows.push(row);console.log(JSON.stringify(row));
}
await browser.close();
const countryBad=rows.filter(r=>r.kind==='country'&&(r.prodError||r.candError||!r.cand||r.cand.type!=='country'));
const cabo=rows.find(r=>r.kind==='country'&&r.target==='Cabo Verde');if(cabo&&cabo.cand&&cabo.cand.countryCode!=='cv')countryBad.push(cabo);
const usBad=rows.filter(r=>r.kind==='us'&&(r.error||!r.package||r.outside!==0||r.unsafe!==0||r.totalMs>15000));
console.log(JSON.stringify({summary:{countryBad:[...new Set(countryBad.map(r=>r.target))],usBad:usBad.map(r=>r.target),countryPass:rows.filter(r=>r.kind==='country'&&!countryBad.includes(r)).map(r=>r.target),usPass:rows.filter(r=>r.kind==='us'&&!usBad.includes(r)).map(r=>r.target)}}));
if(countryBad.length||usBad.length)process.exit(1);
