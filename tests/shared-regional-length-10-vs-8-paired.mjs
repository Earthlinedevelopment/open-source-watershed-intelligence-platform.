import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const cases=['Oklahoma','Colorado','New York','Vermont','Louisiana'];
const modes=[10,8];
const browser=await chromium.launch({headless:true});
const results=[];

async function runCase(query,threshold){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  let patch1=0,patch2=0;
  if(threshold===8){
    await page.route('**/*',async route=>{
      if(route.request().resourceType()!=='document')return route.continue();
      const resp=await route.fetch();
      let text=await resp.text();
      const n1='if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;';
      const r1='if(segment.length<10||lineLengthPixels(hy,segment)<(focusMode?10:8))return null;';
      const n2='if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}';
      const r2='if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<(focusMode?10:8)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}';
      patch1=text.split(n1).length-1;
      patch2=text.split(n2).length-1;
      text=text.split(n1).join(r1).split(n2).join(r2);
      return route.fulfill({response:resp,body:text});
    });
  }
  const started=Date.now();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;
    i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));
    b.click();
  },query);
  let timedOut=false;
  try{
    await page.waitForFunction(()=>{
      const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
      return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&!!window.EARTHLINE_SWALE_GENERATION_AUDIT_16167);
    },{timeout:30000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(400);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    return {
      swales:sw.length,
      published:g?.publishedFeatures??null,
      eligible:g?.jurisdictionEligibleCandidates??null,
      candidates:g?.candidates??null,
      outside:b?.outsideAfterClip??null,
      totalMs:p?.totalMs??null,
      lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
    };
  });
  const row={query,threshold,patch1,patch2,elapsedMs:Date.now()-started,timedOut,state,errors:errors.slice(0,20)};
  console.log('EARTHLINE_LENGTH_PAIRED '+JSON.stringify(row));
  await page.close();
  return row;
}

for(const query of cases){
  for(const threshold of modes){
    results.push(await runCase(query,threshold));
  }
}

const paired=cases.map(query=>{
  const baseline=results.find(r=>r.query===query&&r.threshold===10);
  const candidate=results.find(r=>r.query===query&&r.threshold===8);
  const outcome={
    query,
    baseline:{swales:baseline?.state.swales??null,published:baseline?.state.published??null,totalMs:baseline?.state.totalMs??null,lastError:baseline?.state.lastError??null,errors:baseline?.errors.length??null},
    candidate:{swales:candidate?.state.swales??null,published:candidate?.state.published??null,totalMs:candidate?.state.totalMs??null,lastError:candidate?.state.lastError??null,errors:candidate?.errors.length??null},
    baselineRendererFail:!!baseline?.state.lastError,
    candidateRendererFail:!!candidate?.state.lastError,
    candidateOnlyFailure:!baseline?.state.lastError&&!!candidate?.state.lastError,
    bothFail:!!baseline?.state.lastError&&!!candidate?.state.lastError,
    bothPass:!baseline?.state.lastError&&!candidate?.state.lastError
  };
  return outcome;
});
console.log('EARTHLINE_LENGTH_PAIRED_SUMMARY '+JSON.stringify(paired));
await browser.close();
if(results.some(r=>r.timedOut||(r.threshold===8&&(r.patch1<1||r.patch2<1))))process.exitCode=1;
