import { chromium } from 'playwright';

const PROD=process.env.EARTHLINE_PROD||'https://earthlinedevelopment.org/';
const CANDIDATE=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const targets=(process.env.TARGETS||'Singapore|Indonesia|India|Australia|Cabo Verde|Comoros|Mauritius|Seychelles').split('|').map(s=>s.trim()).filter(Boolean);
const browser=await chromium.launch({headless:true});
const rows=[];

async function resolveOnProduction(target){
  const page=await browser.newPage({viewport:{width:1400,height:820}});
  let error=null,loc=null;
  try{
    await page.goto(PROD+'?connected-resolver-16845='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const out=await page.evaluate(async q=>{
      const input=document.getElementById('searchInput');
      input.value=q; input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true}));
      let ok=false;
      try{
        if(typeof runSearch==='function') ok=await runSearch({autoAnalyze:false});
        else if(typeof window.runSearch==='function') ok=await window.runSearch({autoAnalyze:false});
        else throw new Error('search controller unavailable');
      }catch(e){return {ok:false,error:String(e?.message||e),loc:null};}
      let v=null;
      try{if(typeof M!=='undefined'&&M&&M.loc)v=M.loc;}catch{}
      if(!v){try{const s=typeof state==='function'?state():null;if(s&&s.loc)v=s.loc;}catch{}}
      const clean=v?JSON.parse(JSON.stringify(v)):null;
      return {ok:!!ok,error:null,loc:clean};
    },target);
    if(!out?.ok||!out?.loc)throw new Error(out?.error||'production resolver returned no location');
    loc=out.loc;
  }catch(e){error=String(e?.message||e);}
  await page.close();
  return {error,loc};
}

async function runCandidate(target,loc){
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  let harnessError=null;
  try{
    await page.goto(CANDIDATE+'?connected-candidate-16845='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(({q,loc})=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      window.EARTHLINE_TEST_LOCATION_16845=Object.assign({},loc,{query:q,placeType:'country'});
      const i=document.getElementById('searchInput');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click();
    },{q:target,loc});
    await page.waitForFunction(q=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;const d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;return !!e||String(d?.query||'').trim().toLowerCase()===String(q).trim().toLowerCase();},target,{timeout:95000,polling:100});
    await page.waitForTimeout(300);
  }catch(e){harnessError=String(e?.message||e);}
  const snap=await page.evaluate(({target,harnessError})=>{
    const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
    const run=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
    const pkg=window.EARTHLINE_LAST_ATOMIC_COUNTRY_PACKAGE_16845||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const rb=run?.bounds||null,cb=pkg?.regionalExtent?.bbox||null;
    const span=x=>Array.isArray(x)?[+(x[2]-x[0]).toFixed(4),+(x[3]-x[1]).toFixed(4)]:null;
    const fallbackVisible=pub?.rendered ?? pub?.generated ?? 0;
    return {target,harnessError,error:err&&String(err.error||err.message||err),package:!!pkg,code:pkg?.countryCode||null,runBounds:rb,countryBounds:cb,runSpan:span(rb),countrySpan:span(cb),boundaryCapability:boundary?.capability||null,generated:Number(pub?.generated||0),visible:Number(pub?.visible??fallbackVisible),outside:Number(pub?.outsideJurisdiction??pub?.outside??0),unsafe:Number(pub?.unsafeDisplayedSegments??pub?.unsafe??0),totalMs:Number(perf?.totalMs||0)};
  },{target,harnessError});
  await page.close();
  return snap;
}

for(const target of targets){
  const resolved=await resolveOnProduction(target);
  let candidate=null;
  if(!resolved.error&&resolved.loc)candidate=await runCandidate(target,resolved.loc);
  const row={target,resolverError:resolved.error,resolved:resolved.loc?{name:resolved.loc.name||resolved.loc.fullName||null,countryCode:resolved.loc.countryCode||null,placeType:resolved.loc.placeType||null,lat:Number(resolved.loc.lat),lng:Number(resolved.loc.lng),bbox:Array.isArray(resolved.loc.bbox)?resolved.loc.bbox:null}:null,candidate};
  rows.push(row);console.log(JSON.stringify(row));
}
await browser.close();
const bad=rows.filter(r=>r.resolverError||!r.resolved||String(r.resolved.placeType||'').toLowerCase()!=='country'||!r.candidate||r.candidate.harnessError||r.candidate.error||!r.candidate.package||!r.candidate.boundaryCapability||r.candidate.outside!==0||r.candidate.unsafe!==0||r.candidate.generated!==r.candidate.visible||r.candidate.totalMs>15000||!r.candidate.runSpan||!r.candidate.countrySpan||Math.abs(r.candidate.runSpan[0]-r.candidate.countrySpan[0])>.02||Math.abs(r.candidate.runSpan[1]-r.candidate.countrySpan[1])>.02);
console.log(JSON.stringify({summary:{targets:rows.length,bad:bad.map(r=>r.target),passes:rows.filter(r=>!bad.includes(r)).map(r=>r.target)}}));
if(bad.length)process.exit(1);
