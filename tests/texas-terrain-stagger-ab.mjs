import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const variants=[{name:'current-250',stagger:'250'},{name:'candidate-1200',stagger:'1200'}];
const all=[];
function patchBody(body,variant){
  const patch={};
  const r=(name,needle,repl)=>{const n=body.split(needle).length-1;patch[name]=n;if(n!==1)throw new Error(name+' expected once, found '+n);body=body.replace(needle,repl);};
  r('spacingPrimary','const chosen=[],primarySpacing=Math.max(6,Math.round(hy.w/31));','const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));');
  r('spacingSecondary','const spacing=chosen.length<20?primarySpacing:Math.max(4,Math.round(primarySpacing*.72));','const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));');
  r('screenCacheDecl','    function screenJurisdictionCandidate16539(candidate16539){','    const jurisdictionScreenCache16592=new WeakMap();\n    function screenJurisdictionCandidate16539(candidate16539){');
  r('screenCacheLookup','      if(focusMode||!jurisdictionGeometry16539)return candidate16539;\n      const runs16539=earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);','      if(focusMode||!jurisdictionGeometry16539)return candidate16539;\n      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);\n      const runs16539=earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);');
  r('cacheNullRuns','      if(!runs16539.length)return null;','      if(!runs16539.length){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}');
  r('cacheNullSegment','      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10)return null;','      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}');
  r('cacheNullGrid','      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y))return null;','      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}');
  r('cacheResultStart','      return Object.assign({},candidate16539,{','      const screenedCandidate16592=Object.assign({},candidate16539,{');
  r('cacheResultEnd','        jurisdiction_screened:true\n      });\n    }\n    function jurisdictionEligibleCount16539','        jurisdiction_screened:true\n      });\n      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screenedCandidate16592);\n      return screenedCandidate16592;\n    }\n    function jurisdictionEligibleCount16539');
  r('clipDuplicatePointTest','const safe=run.filter(p=>earthlinePointInJurisdiction16539(p,g));if(safe.length>=2)','const safe=run;if(safe.length>=2)');
  r('terrainCounterDecl','    const promise=(async()=>{','    window.EARTHLINE_TERRAIN_RACE_16594=window.EARTHLINE_TERRAIN_RACE_16594||{primaryStarted:0,alternateStarted:0};\n    const promise=(async()=>{');
  r('alternateCounter','          alternateStarted=true;\n          fetchImageData(alternate,signal).then(finishSuccess,finishFailure);','          alternateStarted=true;\n          window.EARTHLINE_TERRAIN_RACE_16594.alternateStarted++;\n          fetchImageData(alternate,signal).then(finishSuccess,finishFailure);');
  r('primaryCounter','        fetchImageData(primary,signal).then(finishSuccess,finishFailure);','        window.EARTHLINE_TERRAIN_RACE_16594.primaryStarted++;\n        fetchImageData(primary,signal).then(finishSuccess,finishFailure);');
  r('stagger','        stagger=setTimeout(startAlternate,250);',`        stagger=setTimeout(startAlternate,${variant.stagger});`);
  return {body,patch};
}
for(const variant of variants){
  for(let rep=1;rep<=2;rep++){
    const context=await browser.newContext({viewport:{width:1800,height:950}});const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));let patch={},loadError=null;
    await page.route('**/*',async route=>{const req=route.request();if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){const response=await route.fetch();let body=await response.text();const p=patchBody(body,variant);patch=p.patch;await route.fulfill({response,body:p.body});return;}await route.continue();});
    try{await page.goto(BASE+'?terrain_stagger_ab='+variant.name+'_'+rep+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});}catch(e){loadError=String(e);}
    const started=Date.now();let timedOut=false;
    if(!loadError){await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.focus();i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});try{await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(e)return true;const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;},{timeout:35000,polling:50});}catch(_){timedOut=true;}}
    const a=loadError?{}:await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,race:window.EARTHLINE_TERRAIN_RACE_16594||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
    const row={variant:variant.name,rep,loadError,timedOut,clickToTerminalMs:Date.now()-started,coreMs:a?.perf?.totalMs??null,phases:a?.perf?.phaseTotalsMs??null,race:a?.race||null,chosen:a?.generation?.chosenBeforeTierGate??null,published:a?.pub?.generated??null,visible:a?.display?.swaleLines??null,gridW:a?.flow?.gridAudit?.grid?.w??null,gridH:a?.flow?.gridAudit?.grid?.h??null,unsafe:a?.flow?.unsafeSegments??null,lastError:a?.lastError||null,pageErrors};all.push(row);console.log('EARTHLINE_TERRAIN_STAGGER '+JSON.stringify(row));await context.close();
  }
}
await browser.close();writeFileSync('texas-terrain-stagger-ab.json',JSON.stringify(all,null,2));
if(all.some(r=>r.loadError||r.timedOut||r.lastError||r.pageErrors.length||Number(r.gridW)!==96||Number(r.gridH)!==96||Number(r.unsafe)!==0||Number(r.published)<40||Number(r.visible)<40))process.exitCode=1;
