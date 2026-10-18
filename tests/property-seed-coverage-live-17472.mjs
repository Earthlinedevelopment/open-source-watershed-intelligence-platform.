import { chromium } from 'playwright';
import fs from 'node:fs';
const patchedIndex=fs.readFileSync('index.html','utf8');
const browser=await chromium.launch({headless:true});
const sites=[{name:'A',lat:44.06957,lng:-72.27369},{name:'B',lat:44.0858,lng:-72.2802}];
const rows=[];
for(const site of sites){
  const context=await browser.newContext();
  await context.route('**/*',async r=>{
    const u=new URL(r.request().url());
    if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')
      return r.fulfill({status:200,body:patchedIndex,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
    return r.continue();
  });
  const page=await context.newPage({viewport:{width:1800,height:950}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('https://earthlinedevelopment.org/?seedCoverage17472='+site.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill('Vermont');await page.waitForTimeout(750);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await opts.count())throw new Error('no Vermont suggestion');
  await opts.first().click();await page.waitForTimeout(300);
  const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
  const prep=await page.evaluate(async s=>{
    const siteObj=window.earthlineSelectedSiteFromCenter(M?.loc||null,s.lng,s.lat,20);
    const applied=await window.applyLocation(siteObj,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false};
    await new Promise(r=>setTimeout(r,500));
    const set=window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'seed-coverage-17472',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
    return {ok:!!set,loc:M?.loc||null};
  },site);
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();
  let call=false,err=null;try{call=await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169())}catch(e){err=String(e)}
  await page.waitForFunction(pre=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>pre&&a?.settled===true},before,{timeout:120000,polling:100}).catch(()=>{});
  await page.waitForTimeout(700);
  const snap=await page.evaluate(()=>{
    const safe=M?.authoritativeSafeSwales15815?.features||[],raw=Array.isArray(M?.swales)?M.swales:[],cov=M?.coverageDiagnostic15803||null;
    const zones=(cov?.zones||[]).map(z=>({id:z.id,safeCells:z.safeCells,contourCells:z.contourCells,candidates:z.candidates,accepted:z.accepted,rejectFinalSpacing:z.rejections?.finalSpacing||0}));
    return {rawCount:raw.length,safeCount:safe.length,seedCoverage:window.EARTHLINE_PROPERTY_SEED_COVERAGE_17471||null,spacing:M?.spacingStats||null,
      coverage:{safeZones:zones.filter(z=>z.safeCells>0).length,contourZones:zones.filter(z=>z.contourCells>0).length,candidateZones:zones.filter(z=>z.candidates>0).length,acceptedZones:zones.filter(z=>z.accepted>0).length,maxAccepted:zones.length?Math.max(...zones.map(z=>Number(z.accepted||0))):0,blankContourZones:zones.filter(z=>z.contourCells>0&&z.candidates===0).map(z=>z.id),candidateBlank:zones.filter(z=>z.candidates>0&&z.accepted===0).map(z=>z.id),zones},
      run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,safety:M?.safetyAudit15806||null};
  });
  const row={site,prep,call,err,elapsedMs:Date.now()-t0,...snap,errors};rows.push(row);
  console.log('EARTHLINE_SEED_COVERAGE_17472 '+JSON.stringify(row));
  await context.close();
}
await browser.close();
const pass=rows.every(r=>r.call===true&&r.run?.result===true&&r.safety?.verified===true&&r.safeCount>0&&r.coverage.acceptedZones>=r.coverage.candidateZones-1);
console.log('EARTHLINE_SEED_COVERAGE_17472_SUMMARY '+JSON.stringify({pass,rows:rows.map(r=>({site:r.site,safeCount:r.safeCount,spacing:r.spacing,seedCoverage:r.seedCoverage,coverage:r.coverage,elapsedMs:r.elapsedMs}))}));
if(!pass)process.exitCode=1;
