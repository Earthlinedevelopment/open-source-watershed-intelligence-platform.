import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const cases=['Texas','California','Alaska','Arizona','Nevada','Oklahoma','New Mexico','Colorado','New York','Louisiana','Vermont'];
const browser=await chromium.launch({headless:true});
const results=[];

for(const query of cases){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e))); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  let patch1=0,patch2=0;
  await page.route('**/*',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch(); let text=await resp.text();
    const n1='if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;';
    const r1='if(segment.length<10||lineLengthPixels(hy,segment)<((!focusMode&&Math.max(Number(hy?.cellX)||0,Number(hy?.cellY)||0)>10000)?8:10))return null;';
    const n2='if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}';
    const r2='if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<((!focusMode&&Math.max(Number(hy?.cellX)||0,Number(hy?.cellY)||0)>10000)?8:10)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}';
    patch1=text.split(n1).length-1; patch2=text.split(n2).length-1;
    text=text.split(n1).join(r1).split(n2).join(r2);
    return route.fulfill({response:resp,body:text});
  });
  const started=Date.now();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  let timedOut=false;
  try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&!!window.EARTHLINE_SWALE_GENERATION_AUDIT_16167);},{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(350);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const loc=window.M?.loc||null;
    return {swales:sw.length,published:g?.publishedFeatures??null,eligible:g?.jurisdictionEligibleCandidates??null,candidates:g?.candidates??null,outside:b?.outsideAfterClip??null,totalMs:p?.totalMs??null,loc,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()};
  });
  const row={query,patch1,patch2,elapsedMs:Date.now()-started,timedOut,state,errors:errors.slice(0,12)};
  results.push(row); console.log('EARTHLINE_SCALE_AWARE_CONTROL '+JSON.stringify(row)); await page.close();
}
console.log('EARTHLINE_SCALE_AWARE_SUMMARY '+JSON.stringify(results.map(r=>({query:r.query,timedOut:r.timedOut,patch1:r.patch1,patch2:r.patch2,swales:r.state.swales,published:r.state.published,eligible:r.state.eligible,totalMs:r.state.totalMs,lastError:r.state.lastError,errors:r.errors.length,outside:r.state.outside,loc:r.state.loc}))));
await browser.close();
if(results.some(r=>r.timedOut||r.patch1<1||r.patch2<1||(r.state.outside&&r.state.outside.swales>0)||(Number.isFinite(r.state.totalMs)&&r.state.totalMs>15000)))process.exitCode=1;
