import { chromium } from 'playwright';

const BASE='https://earthlinedevelopment.org/';
const CASES=[
  {query:'Texas',minPublished:40,tag:'tx'},
  {query:'New York',minPublished:70,tag:'ny'},
  {query:'Vermont',minPublished:40,tag:'vt1'},
  {query:'Vermont',minPublished:40,tag:'vt2'},
];

const browser=await chromium.launch({headless:true});
const results=[];

function patchBody(body){
  const patch={};
  const r=(name,needle,repl)=>{
    const n=body.split(needle).length-1;
    patch[name]=n;
    if(n!==1)throw new Error(name+' expected once, found '+n);
    body=body.replace(needle,repl);
  };

  r('spacingPrimary',
    'const chosen=[],primarySpacing=Math.max(6,Math.round(hy.w/31));',
    'const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));');
  r('spacingSecondary',
    'const spacing=chosen.length<20?primarySpacing:Math.max(4,Math.round(primarySpacing*.72));',
    'const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));');
  r('screenCacheDecl',
    '    function screenJurisdictionCandidate16539(candidate16539){',
    '    const jurisdictionScreenCache16592=new WeakMap();\n    function screenJurisdictionCandidate16539(candidate16539){');
  r('screenCacheLookup',
    '      if(focusMode||!jurisdictionGeometry16539)return candidate16539;\n      const runs16539=earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);',
    '      if(focusMode||!jurisdictionGeometry16539)return candidate16539;\n      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);\n      const runs16539=earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);');
  r('cacheNullRuns','      if(!runs16539.length)return null;','      if(!runs16539.length){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}');
  r('cacheNullSegment','      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10)return null;','      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}');
  r('cacheNullGrid','      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y))return null;','      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}');
  r('cacheResultStart','      return Object.assign({},candidate16539,{','      const screenedCandidate16592=Object.assign({},candidate16539,{');
  r('cacheResultEnd','        jurisdiction_screened:true\n      });\n    }\n    function jurisdictionEligibleCount16539','        jurisdiction_screened:true\n      });\n      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screenedCandidate16592);\n      return screenedCandidate16592;\n    }\n    function jurisdictionEligibleCount16539');
  r('clipDuplicatePointTest','const safe=run.filter(p=>earthlinePointInJurisdiction16539(p,g));if(safe.length>=2)','const safe=run;if(safe.length>=2)');
  r('terrainStagger','        stagger=setTimeout(startAlternate,250);','        stagger=setTimeout(startAlternate,1200);');
  return {body,patch};
}

for(const testCase of CASES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  let patch={},loadError=null;
  await page.route('**/*',async route=>{
    const req=route.request();
    if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
      const response=await route.fetch();
      const p=patchBody(await response.text());
      patch=p.patch;
      await route.fulfill({response,body:p.body});
      return;
    }
    await route.continue();
  });
  try{
    await page.goto(BASE+'?earthline_shared_no_camera='+testCase.tag+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
  }catch(e){loadError=String(e);}
  const started=Date.now();
  let timedOut=false;
  if(!loadError){
    await page.evaluate(query=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.focus();i.value=query;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},testCase.query);
    try{await page.waitForFunction(()=>{if(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970)return true;const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!window.EARTHLINE_REGIONAL_VISUAL_DATA_16020;},{timeout:35000,polling:50});}catch(_){timedOut=true;}
  }
  const a=loadError?{}:await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()}));
  const row={query:testCase.query,tag:testCase.tag,minPublished:testCase.minPublished,patch,loadError,timedOut,clickToTerminalMs:Date.now()-started,coreMs:a?.perf?.totalMs??null,phases:a?.perf?.phaseTotalsMs??null,candidates:a?.generation?.candidates??null,eligible:a?.generation?.jurisdictionEligibleCandidates??null,chosen:a?.generation?.chosenBeforeTierGate??null,published:a?.pub?.generated??null,visible:a?.display?.swaleLines??null,gridW:a?.flow?.gridAudit?.grid?.w??null,gridH:a?.flow?.gridAudit?.grid?.h??null,unsafe:a?.flow?.unsafeSegments??null,outsideAfterClip:a?.boundary?.outsideAfterClip??null,lastError:a?.lastError||null,pageErrors,status:a?.status||''};
  results.push(row);
  console.log('EARTHLINE_SHARED_NO_CAMERA '+JSON.stringify(row));
  await context.close();
}
await browser.close();
const failed=results.some(r=>r.loadError||r.timedOut||r.lastError||r.pageErrors.length||Number(r.gridW)!==96||Number(r.gridH)!==96||Number(r.unsafe)!==0||Number(r.published)<Number(r.minPublished)||Number(r.visible)<Number(r.minPublished)||Number(r.clickToTerminalMs)>15000||Number(r.outsideAfterClip?.contours||0)!==0||Number(r.outsideAfterClip?.flows||0)!==0||Number(r.outsideAfterClip?.swales||0)!==0);
if(failed)process.exitCode=1;
