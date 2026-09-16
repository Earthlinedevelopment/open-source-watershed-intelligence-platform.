import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const URL=process.env.EARTHLINE_TEST_URL||'http://127.0.0.1:8787/';
const CASES=['Texas','Texas','Texas'];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
const results=[];let loadError=null;
try{await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});}catch(e){loadError=String(e);}
for(let run=0;run<CASES.length&&!loadError;run++){
  const query=CASES[run];
  const prevToken=await page.evaluate(()=>window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584?.runToken||window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970?.runToken||null);
  const started=Date.now();let timedOut=false,terminal=0;
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  try{await page.waitForFunction(({q,prev})=>{const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,token=(err&&err.runToken)||(flow&&flow.runToken)||null;if(!token||token===prev)return false;if(err&&err.runToken===token)return true;const m=typeof M!=='undefined'&&M?M:null,status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),loc=[m?.loc?.name,m?.loc?.fullName].filter(Boolean).join(' ');return /texas/i.test(loc)&&/screening published\./i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;},{q:query,prev:prevToken},{timeout:30000,polling:50});terminal=Date.now();}catch(_){timedOut=true;terminal=Date.now();}
  const a=await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,label:window.EARTHLINE_REGIONAL_CORRIDOR_LABEL_AUDIT_16336||null,flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()}));
  const r={run:run+1,clickToTerminalMs:terminal-started,timedOut,coreMs:Number(a?.perf?.totalMs||Infinity),candidates:a?.generation?.candidates??null,eligible:a?.generation?.jurisdictionEligibleCandidates??null,rejectedJurisdiction:a?.generation?.jurisdictionRejectedCandidates??null,chosen:a?.generation?.chosenBeforeTierGate??null,beforeClip:a?.boundary?.before?.swales??null,afterClip:a?.boundary?.after?.swales??null,removedByBoundary:a?.boundary?.removed?.swales??null,generated:a?.pub?.generated??null,visible:a?.pub?.overlaySwaleLines??null,rendered:a?.label?.renderedCorridors??null,gridW:a?.flow?.gridAudit?.grid?.w??null,gridH:a?.flow?.gridAudit?.grid?.h??null,unsafe:a?.flow?.unsafeSegments??null,lastError:a?.lastError||null,pageErrors:pageErrors.slice(0,20),status:a?.status||''};
  results.push(r);console.log('EARTHLINE_TX_ANCHOR_PROBE '+JSON.stringify(r));
}
await browser.close();writeFileSync('texas-spacing-anchor-probe.json',JSON.stringify(results,null,2));
const bad=loadError||results.length!==3||results.some(r=>r.timedOut||r.lastError||Number(r.gridW)!==96||Number(r.gridH)!==96||Number(r.unsafe)!==0||Number(r.removedByBoundary)!==0||Number(r.generated)!==Number(r.afterClip)||Number(r.visible)<=0);
if(bad)process.exitCode=1;
