import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Texas','New York','Vermont'];
const VARIANTS=[{name:'baseline-6-4',primary:6,secondary:4},{name:'candidate-3-2',primary:3,secondary:2}];
const browser=await chromium.launch({headless:true});
const results=[];

for(const state of STATES){
  for(const v of VARIANTS){
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
        if(v.primary!==6&&patch.primaryMatches===1)body=body.replace(pNeedle,`const chosen=[],primarySpacing=Math.max(${v.primary},Math.round(hy.w/31));`);
        if(v.secondary!==4&&patch.secondaryMatches===1)body=body.replace(sNeedle,`const spacing=chosen.length<20?primarySpacing:Math.max(${v.secondary},Math.round(primarySpacing*.72));`);
        await route.fulfill({response,body});return;
      }
      await route.continue();
    });
    let loadError=null,timedOut=false;
    try{await page.goto(BASE+'?earthline_spacing_ab='+encodeURIComponent(state)+'_'+v.name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});}catch(e){loadError=String(e);}
    const started=Date.now();
    if(!loadError){
      await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},state);
      try{await page.waitForFunction(q=>{const f=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(e?.query===q)return true;const m=typeof M!=='undefined'&&M?M:null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),loc=[m?.loc?.name,m?.loc?.fullName].filter(Boolean).join(' ');return !!f?.runToken&&loc.toLowerCase().includes(q.toLowerCase())&&/screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;},state,{timeout:30000,polling:50});}catch(_){timedOut=true;}
    }
    const a=loadError?{}:await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,label:window.EARTHLINE_REGIONAL_CORRIDOR_LABEL_AUDIT_16336||null,flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()}));
    const r={state,variant:v.name,primary:v.primary,secondary:v.secondary,patch,loadError,timedOut,clickToTerminalMs:Date.now()-started,coreMs:a?.perf?.totalMs??null,candidates:a?.generation?.candidates??null,eligible:a?.generation?.jurisdictionEligibleCandidates??null,chosen:a?.generation?.chosenBeforeTierGate??null,beforeClip:a?.boundary?.before?.swales??null,afterClip:a?.boundary?.after?.swales??null,removedByBoundary:a?.boundary?.removed?.swales??null,published:a?.pub?.generated??null,visible:a?.display?.swaleLines??null,rendered:a?.label?.renderedCorridors??null,gridW:a?.flow?.gridAudit?.grid?.w??null,gridH:a?.flow?.gridAudit?.grid?.h??null,unsafe:a?.flow?.unsafeSegments??null,lastError:a?.lastError||null,pageErrors,status:a?.status||''};
    results.push(r);console.log('EARTHLINE_SHARED_SPACING_FRESH_AB '+JSON.stringify(r));
    await page.close();
  }
}
await browser.close();
writeFileSync('shared-spacing-fresh-ab.json',JSON.stringify(results,null,2));
const candidateTx=results.find(r=>r.state==='Texas'&&r.variant==='candidate-3-2');
const catastrophic=results.some(r=>r.patch.primaryMatches!==1||r.patch.secondaryMatches!==1||r.loadError||r.timedOut||r.lastError||r.pageErrors.length||Number(r.clickToTerminalMs)>15000||Number(r.coreMs)>15000||Number(r.gridW)!==96||Number(r.gridH)!==96||Number(r.unsafe)!==0||!/screening published\./i.test(r.status)||(Number(r.published||0)>0&&Number(r.visible||0)<=0));
if(catastrophic||!candidateTx||Number(candidateTx.published)<40||Number(candidateTx.removedByBoundary)!==0)process.exitCode=1;
