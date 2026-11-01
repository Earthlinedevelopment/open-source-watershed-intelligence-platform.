import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Texas','Texas','Texas'];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
const patch={};
function replaceOne(body,name,needle,replacement){const n=body.split(needle).length-1;patch[name]=n;if(n!==1)throw new Error(name+' expected once, found '+n);return body.replace(needle,replacement);}
await page.route('**/*',async route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
    const response=await route.fetch();let body=await response.text();
    body=replaceOne(body,'spacingPrimary','const chosen=[],primarySpacing=Math.max(6,Math.round(hy.w/31));','const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));');
    body=replaceOne(body,'spacingSecondary','const spacing=chosen.length<20?primarySpacing:Math.max(4,Math.round(primarySpacing*.72));','const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));');
    body=replaceOne(body,'screenCacheDecl','    function screenJurisdictionCandidate16539(candidate16539){','    const jurisdictionScreenCache16592=new WeakMap();\n    function screenJurisdictionCandidate16539(candidate16539){');
    body=replaceOne(body,'screenCacheLookup','      if(focusMode||!jurisdictionGeometry16539)return candidate16539;\n      const runs16539=earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);','      if(focusMode||!jurisdictionGeometry16539)return candidate16539;\n      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);\n      const runs16539=earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);');
    body=replaceOne(body,'cacheNullRuns','      if(!runs16539.length)return null;','      if(!runs16539.length){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}');
    body=replaceOne(body,'cacheNullSegment','      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10)return null;','      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}');
    body=replaceOne(body,'cacheNullGrid','      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y))return null;','      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}');
    body=replaceOne(body,'cacheResultStart','      return Object.assign({},candidate16539,{','      const screenedCandidate16592=Object.assign({},candidate16539,{');
    body=replaceOne(body,'cacheResultEnd','        jurisdiction_screened:true\n      });\n    }\n    function jurisdictionEligibleCount16539','        jurisdiction_screened:true\n      });\n      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screenedCandidate16592);\n      return screenedCandidate16592;\n    }\n    function jurisdictionEligibleCount16539');
    body=replaceOne(body,'clipDuplicatePointTest','const safe=run.filter(p=>earthlinePointInJurisdiction16539(p,g));if(safe.length>=2)','const safe=run;if(safe.length>=2)');

    body=replaceOne(body,'landValidityStart',`    const landValidityPromise16584=!focusMode\n      ?earthlineResolveLandValidity16584(b,runToken)\n      :Promise.resolve(null);`,`    const landValidityProbeStart16592=performance.now();\n    const landValidityPromise16584=(!focusMode\n      ?earthlineResolveLandValidity16584(b,runToken)\n      :Promise.resolve(null)).then(v=>{phase16198.landValidityTotalMs=Math.round(performance.now()-landValidityProbeStart16592);return v;});`);
    body=replaceOne(body,'openDemStart',`    const openTerrain16198=loadDEM(b,openGrid16201,openGrid16201,openBudget16353,openLabel16353);`,`    const openDemProbeStart16592=performance.now();\n    const openTerrain16198=loadDEM(b,openGrid16201,openGrid16201,openBudget16353,openLabel16353).then(v=>{phase16198.openDemTotalMs=Math.round(performance.now()-openDemProbeStart16592);return v;},e=>{phase16198.openDemTotalMs=Math.round(performance.now()-openDemProbeStart16592);throw e;});`);
    body=replaceOne(body,'mask',`        validityGrid16584=earthlineLandValidityMask16584(dem,landValidity16584);`,`        const validityMaskProbeStart16592=performance.now();validityGrid16584=earthlineLandValidityMask16584(dem,landValidity16584);phase16198.landValidityMaskMs=Math.round(performance.now()-validityMaskProbeStart16592);`);
    body=replaceOne(body,'hydrology',`          hy=await hydrology(dem,validityGrid16584.mask);`,`          const hydrologyProbeStart16592=performance.now();hy=await hydrology(dem,validityGrid16584.mask);phase16198.hydrologyMs=Math.round(performance.now()-hydrologyProbeStart16592);`);
    body=replaceOne(body,'contours',`    let contours=await makeContours(hy);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · CONTOURS COMPLETE',runToken);await wait(0);`,`    const contoursProbeStart16592=performance.now();let contours=await makeContours(hy);phase16198.contoursMs=Math.round(performance.now()-contoursProbeStart16592);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · CONTOURS COMPLETE',runToken);await wait(0);`);
    body=replaceOne(body,'swales',`    let swales=makeSwales(hy,contours,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`,`    const swalesProbeStart16592=performance.now();let swales=makeSwales(hy,contours,focusMode,swaleJurisdictionGeometry16539);phase16198.makeSwalesMs=Math.round(performance.now()-swalesProbeStart16592);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`);
    body=replaceOne(body,'genericClip',`      const bounded16539=earthlineClipRegionalProducts16539({contours,flows,swales,query:q,runToken},boundary16539);`,`      const genericClipProbeStart16592=performance.now();const bounded16539=earthlineClipRegionalProducts16539({contours,flows,swales,query:q,runToken},boundary16539);phase16198.genericBoundaryClipMs=Math.round(performance.now()-genericClipProbeStart16592);`);
    await route.fulfill({response,body});return;
  }
  await route.continue();
});

const results=[];let loadError=null;
try{await page.goto(BASE+'?earthline_tx_dedupe_probe='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});}catch(e){loadError=String(e);}
for(let run=0;run<CASES.length&&!loadError;run++){
  const prev=await page.evaluate(()=>window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584?.runToken||window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970?.runToken||null);
  const started=Date.now();let timedOut=false;
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.focus();i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  try{await page.waitForFunction(prev=>{const f=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,token=(e&&e.runToken)||(f&&f.runToken)||null;if(!token||token===prev)return false;if(e&&e.runToken===token)return true;const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;},prev,{timeout:35000,polling:50});}catch(_){timedOut=true;}
  const a=await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()}));
  const r={run:run+1,clickToTerminalMs:Date.now()-started,timedOut,coreMs:a?.perf?.totalMs??null,phases:a?.perf?.phaseTotalsMs??null,candidates:a?.generation?.candidates??null,eligible:a?.generation?.jurisdictionEligibleCandidates??null,chosen:a?.generation?.chosenBeforeTierGate??null,published:a?.pub?.generated??null,visible:a?.display?.swaleLines??null,removed:a?.boundary?.removed??null,outsideAfterClip:a?.boundary?.outsideAfterClip??null,gridW:a?.flow?.gridAudit?.grid?.w??null,gridH:a?.flow?.gridAudit?.grid?.h??null,unsafe:a?.flow?.unsafeSegments??null,lastError:a?.lastError||null,pageErrors:pageErrors.slice(),status:a?.status||''};
  results.push(r);console.log('EARTHLINE_TX_DEDUPE '+JSON.stringify(r));
}
await browser.close();writeFileSync('shared-regional-spacing-regression.json',JSON.stringify({loadError,patch,results},null,2));
if(loadError||Object.values(patch).some(v=>v!==1)||results.length!==3||results.some(r=>r.timedOut||r.lastError||r.pageErrors.length||Number(r.gridW)!==96||Number(r.gridH)!==96||Number(r.unsafe)!==0||Number(r.published)<40||Number(r.visible)<40||Number(r.outsideAfterClip?.contours||0)!==0||Number(r.outsideAfterClip?.flows||0)!==0||Number(r.outsideAfterClip?.swales||0)!==0))process.exitCode=1;
