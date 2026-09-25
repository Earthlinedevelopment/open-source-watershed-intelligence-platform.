import { chromium } from 'playwright';
const PROD=process.env.EARTHLINE_PROD||'https://earthlinedevelopment.org/';
const CANDIDATE=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const targets=['Laos','Vietnam','Thailand'];
const browser=await chromium.launch({headless:true});
const rows=[];

async function resolveOnProduction(target){
  const page=await browser.newPage({viewport:{width:1400,height:820}});let error=null,loc=null;
  try{
    await page.goto(PROD+'?seasia-resolver-16846='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const out=await page.evaluate(async q=>{
      const i=document.getElementById('searchInput');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));
      let ok=false,err=null;try{ok=await runSearch({autoAnalyze:false});}catch(e){err=String(e?.message||e);}
      let v=null;try{if(typeof M!=='undefined'&&M&&M.loc)v=M.loc;}catch{}
      return {ok,err,loc:v?JSON.parse(JSON.stringify(v)):null};
    },target);
    if(!out?.ok||!out?.loc)throw new Error(out?.err||'production resolver returned no location');loc=out.loc;
  }catch(e){error=String(e?.message||e);}await page.close();return {error,loc};
}

async function runCandidate(target,loc){
  const page=await browser.newPage({viewport:{width:1600,height:900}});let harnessError=null;
  try{
    await page.goto(CANDIDATE+'?seasia-16846='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(({q,loc})=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      window.EARTHLINE_TEST_LOCATION_16845=Object.assign({},loc,{query:q,placeType:'country'});
      const i=document.getElementById('searchInput');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click();
    },{q:target,loc});
    await page.waitForFunction(q=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;return !!e||String(d?.query||'').trim().toLowerCase()===String(q).trim().toLowerCase();},target,{timeout:95000,polling:100});
    await page.waitForTimeout(500);
  }catch(e){harnessError=String(e?.message||e);}
  const snap=await page.evaluate(({target,harnessError})=>{
    const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
    const run=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
    const pkg=window.EARTHLINE_LAST_ATOMIC_COUNTRY_PACKAGE_16845||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const coverage=window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16457||window.EARTHLINE_COVERAGE_AUDIT_16457||null;
    const body=(document.body&&document.body.innerText)||'';
    const rb=run?.bounds||null,cb=pkg?.regionalExtent?.bbox||null;
    const span=x=>Array.isArray(x)?[+(x[2]-x[0]).toFixed(4),+(x[3]-x[1]).toFixed(4)]:null;
    const fallbackVisible=pub?.rendered ?? pub?.generated ?? 0;
    return {target,harnessError,error:err&&String(err.error||err.message||err),code:pkg?.countryCode||null,package:!!pkg,boundaryCapability:boundary?.capability||boundary?.source||null,
      runSpan:span(rb),countrySpan:span(cb),generated:Number(pub?.generated||0),visible:Number(pub?.visible??fallbackVisible),outside:Number(pub?.outsideJurisdiction??pub?.outside??0),unsafe:Number(pub?.unsafeDisplayedSegments??pub?.unsafe??0),totalMs:Number(perf?.totalMs||0),
      waterPaths:Number(run?.waterPaths||0),coveragePassed:coverage?coverage.passed!==false:null,
      aquiferTextVisible:/AQUIFER EVIDENCE/i.test(body),aquiferWordVisible:/AQUIFER/i.test(body),bodyStatus:(body.match(/AQUIFER[^\n]{0,160}/i)||[])[0]||null};
  },{target,harnessError});
  await page.screenshot({path:`/tmp/${target.toLowerCase()}-16846.png`,fullPage:false}).catch(()=>{});
  await page.close();return snap;
}

for(const target of targets){const r=await resolveOnProduction(target);const cand=(!r.error&&r.loc)?await runCandidate(target,r.loc):null;const row={target,resolverError:r.error,resolved:r.loc?{name:r.loc.name||r.loc.fullName||null,countryCode:r.loc.countryCode||null,placeType:r.loc.placeType||null,lat:Number(r.loc.lat),lng:Number(r.loc.lng),bbox:Array.isArray(r.loc.bbox)?r.loc.bbox:null}:null,candidate:cand};rows.push(row);console.log(JSON.stringify(row));}
await browser.close();
const bad=rows.filter(r=>r.resolverError||!r.resolved||String(r.resolved.placeType||'').toLowerCase()!=='country'||!r.candidate||r.candidate.harnessError||r.candidate.error||!r.candidate.package||!r.candidate.boundaryCapability||r.candidate.outside!==0||r.candidate.unsafe!==0||r.candidate.generated!==r.candidate.visible||r.candidate.generated===0||r.candidate.totalMs>15000||!r.candidate.runSpan||!r.candidate.countrySpan||Math.abs(r.candidate.runSpan[0]-r.candidate.countrySpan[0])>.02||Math.abs(r.candidate.runSpan[1]-r.candidate.countrySpan[1])>.02);
const review=rows.map(r=>({target:r.target,generated:r.candidate?.generated??null,totalMs:r.candidate?.totalMs??null,waterPaths:r.candidate?.waterPaths??null,aquiferTextVisible:r.candidate?.aquiferTextVisible??null,aquiferWordVisible:r.candidate?.aquiferWordVisible??null,bodyStatus:r.candidate?.bodyStatus??null}));
console.log(JSON.stringify({summary:{bad:bad.map(r=>r.target),passes:rows.filter(r=>!bad.includes(r)).map(r=>r.target),review}}));
if(bad.length)process.exit(1);
