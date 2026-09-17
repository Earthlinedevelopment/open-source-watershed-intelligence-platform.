import { chromium } from 'playwright';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Texas','Colorado','New Mexico'];
const browser=await chromium.launch({headless:true});

function patchBody(body){
  const r=(name,needle,repl)=>{const n=body.split(needle).length-1;if(n!==1)throw new Error(name+' expected once, found '+n);body=body.replace(needle,repl);};
  r('auditDecl','    function screenJurisdictionCandidate16539(candidate16539){','    const jurisdictionRejectAudit16605={calls:0,noRuns:0,shortSegment:0,invalidGrid:0,passed:0};window.EARTHLINE_JURISDICTION_REJECT_AUDIT_16605=jurisdictionRejectAudit16605;\n    function screenJurisdictionCandidate16539(candidate16539){jurisdictionRejectAudit16605.calls++;');
  r('noRuns','      if(!runs16539.length)return null;','      if(!runs16539.length){jurisdictionRejectAudit16605.noRuns++;return null;}');
  r('shortSegment','      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10)return null;','      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10){jurisdictionRejectAudit16605.shortSegment++;return null;}');
  r('invalidGrid','      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y))return null;','      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){jurisdictionRejectAudit16605.invalidGrid++;return null;}');
  r('passed','      return Object.assign({},candidate16539,{','      jurisdictionRejectAudit16605.passed++;return Object.assign({},candidate16539,{');
  return body;
}

for(const query of CASES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;
  await page.route('**/*',async route=>{const req=route.request();if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){const response=await route.fetch();const body=patchBody(await response.text());await route.fulfill({response,body});return;}await route.continue();});
  try{
    await page.goto(BASE+'?earthline_reject_audit='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});
    const started=Date.now();await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
    try{await page.waitForFunction(()=>{if(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970)return true;const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return /screening published\./i.test(s)&&!!window.EARTHLINE_SWALE_GENERATION_AUDIT_16167;},{timeout:35000,polling:50});}catch(_){timedOut=true;}
    const a=await page.evaluate(()=>({reject:window.EARTHLINE_JURISDICTION_REJECT_AUDIT_16605||null,g:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,u:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,f:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,e:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
    console.log('EARTHLINE_REJECT_REASON '+JSON.stringify({query,clickToTerminalMs:Date.now()-started,timedOut,loadError,pageErrors,reject:a.reject,candidates:a.g?.candidates,preferredEligible:a.g?.preferredJurisdictionEligibleCandidates,eligible:a.g?.jurisdictionEligibleCandidates,rejected:a.g?.jurisdictionRejectedCandidates,chosen:a.g?.chosenBeforeTierGate,published:a.u?.generated,coreMs:a.p?.totalMs,phases:a.p?.phaseTotalsMs,grid:a.f?.gridAudit?.grid,unsafe:a.f?.unsafeSegments,lastError:a.e}));
  }catch(e){console.log('EARTHLINE_REJECT_REASON '+JSON.stringify({query,loadError:String(e),timedOut,pageErrors}));}
  await context.close();
}
await browser.close();
