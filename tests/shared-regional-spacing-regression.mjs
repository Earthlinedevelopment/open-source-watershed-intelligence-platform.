import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Texas','Texas','Texas'];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
let patch={primaryMatches:0,secondaryMatches:0};
await page.route('**/*',async route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
    const response=await route.fetch();let body=await response.text();
    const pNeedle='const chosen=[],primarySpacing=Math.max(6,Math.round(hy.w/31));';
    const sNeedle='const spacing=chosen.length<20?primarySpacing:Math.max(4,Math.round(primarySpacing*.72));';
    patch.primaryMatches=body.split(pNeedle).length-1;patch.secondaryMatches=body.split(sNeedle).length-1;
    if(patch.primaryMatches===1)body=body.replace(pNeedle,'const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));');
    if(patch.secondaryMatches===1)body=body.replace(sNeedle,'const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));');
    await route.fulfill({response,body});return;
  }
  await route.continue();
});

const results=[];let loadError=null;
try{await page.goto(BASE+'?earthline_tx_spacing_phase='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});}catch(e){loadError=String(e);}
for(let run=0;run<CASES.length&&!loadError;run++){
  const query=CASES[run];
  const prev=await page.evaluate(()=>window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584?.runToken||window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970?.runToken||null);
  const started=Date.now();let timedOut=false;
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  try{await page.waitForFunction(prev=>{const f=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,token=(e&&e.runToken)||(f&&f.runToken)||null;if(!token||token===prev)return false;if(e&&e.runToken===token)return true;const m=typeof M!=='undefined'&&M?M:null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),loc=[m?.loc?.name,m?.loc?.fullName].filter(Boolean).join(' ');return /texas/i.test(loc)&&/screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;},prev,{timeout:30000,polling:50});}catch(_){timedOut=true;}
  const a=await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()}));
  const r={run:run+1,query,patch,clickToTerminalMs:Date.now()-started,timedOut,coreMs:a?.perf?.totalMs??null,terrainSource:a?.perf?.terrainSource??null,slowestPhase:a?.perf?.slowestPhase??null,phaseTotalsMs:a?.perf?.phaseTotalsMs??null,candidates:a?.generation?.candidates??null,eligible:a?.generation?.jurisdictionEligibleCandidates??null,chosen:a?.generation?.chosenBeforeTierGate??null,beforeClip:a?.boundary?.before?.swales??null,afterClip:a?.boundary?.after?.swales??null,removedByBoundary:a?.boundary?.removed?.swales??null,published:a?.pub?.generated??null,visible:a?.display?.swaleLines??null,gridW:a?.flow?.gridAudit?.grid?.w??null,gridH:a?.flow?.gridAudit?.grid?.h??null,unsafe:a?.flow?.unsafeSegments??null,lastError:a?.lastError||null,pageErrors:pageErrors.slice(),status:a?.status||''};
  results.push(r);console.log('EARTHLINE_TX_SPACING_PHASE '+JSON.stringify(r));
}
await browser.close();
writeFileSync('shared-regional-spacing-regression.json',JSON.stringify({loadError,patch,results},null,2));
const bad=loadError||patch.primaryMatches!==1||patch.secondaryMatches!==1||results.length!==3||results.some(r=>r.timedOut||r.lastError||r.pageErrors.length||Number(r.clickToTerminalMs)>15000||Number(r.coreMs)>15000||Number(r.gridW)!==96||Number(r.gridH)!==96||Number(r.unsafe)!==0||Number(r.removedByBoundary)!==0||Number(r.published)<40||Number(r.visible)<40||!/screening published\./i.test(r.status));
if(bad)process.exitCode=1;
