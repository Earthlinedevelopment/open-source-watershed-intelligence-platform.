import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra46-16795-targeted-regression';
const STATES=['Iowa','Arkansas','Oklahoma','Nebraska','Vermont','Texas','Florida','Louisiana','California','New York','Maryland','Colorado'];
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const results=[];

for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    const req=route.request();
    if(req.resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();
    const old='if(used16780>=2)continue;';
    const count=body.split(old).length-1;
    if(count!==1)throw new Error('expected one parent-cap owner, found '+count);
    body=body.replace(old,'if(used16780>=3)continue;');
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  const started=Date.now();
  let loadError=null,timedOut=false;

  try{
    await page.goto(BASE+'?m46_16795_reg='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;
      i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));
      b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
        if(err)return true;
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:55000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(1200);
  }catch(e){loadError=String(e);}

  const a=loadError?{}:await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
    pkg:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,
    fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    center:(()=>{try{const c=earthlineMap.getCenter();return {lng:c.lng,lat:c.lat,zoom:earthlineMap.getZoom()}}catch(_){return null}})()
  }));

  const coreMs=a?.perf?.totalMs??null;
  const generated=a?.pub?.generated??null;
  const visible=a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null;
  const unsafe=a?.flow?.unsafeSegments??null;
  const outside=a?.boundary?.outsideAfterClip??null;
  const pkgName=a?.pkg?.identity?.name??null;
  const hardRootFail=Array.isArray(a?.root?.rankedCauses)&&a.root.rankedCauses.some(r=>r.status==='critical'||r.status==='fail');
  const pass=!loadError&&!timedOut&&!a?.lastError&&!pageErrors.length&&Number(coreMs)<=15000&&Number(generated)===Number(visible)&&Number(unsafe)===0&&Number(outside?.swales||0)===0&&!hardRootFail&&pkgName===query&&a?.center&&Number(a.center.zoom)>=5;

  const row={
    query,pass,loadError,timedOut,pageErrors,
    elapsedMs:Date.now()-started,coreMs,generated,visible,unsafe,
    outsideAfterClip:outside,pkgName,
    fineSelected:a?.fine?.selected?.length??null,
    fineAdded:a?.fine?.added??null,
    fineUnresolved:a?.fine?.unresolvedAfter?.length??null,
    firstFailedStage:a?.root?.firstFailedStage??null,
    lastError:a?.lastError||null
  };
  results.push(row);
  console.log('EARTHLINE_M46_16795_REG '+JSON.stringify(row));
  try{await page.screenshot({path:OUT+'/'+query.toLowerCase().replace(/\s+/g,'-')+'.png',fullPage:false});}catch(_){}
  await context.close();
}

await browser.close();
const summary={
  total:results.length,
  pass:results.filter(r=>r.pass).length,
  fail:results.filter(r=>!r.pass).length,
  failed:results.filter(r=>!r.pass).map(r=>r.query),
  over15:results.filter(r=>Number(r.coreMs)>15000).map(r=>({query:r.query,coreMs:r.coreMs})),
  unsafe:results.filter(r=>Number(r.unsafe)!==0).map(r=>({query:r.query,unsafe:r.unsafe})),
  pageErrors:results.filter(r=>r.pageErrors?.length).map(r=>({query:r.query,pageErrors:r.pageErrors}))
};
writeFileSync(OUT+'/results.json',JSON.stringify({summary,results},null,2));
console.log('EARTHLINE_M46_16795_REG_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
