import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const URL='https://earthlinedevelopment.org/?earthline_regression=tx_terrain_components';
const CASES=['Texas','Texas','Texas','New York'];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
const results=[];let loadError=null;
try{await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});await page.evaluate(()=>{
  window.__EARTHLINE_COMPONENT_TIMES=[];
  const wrap=name=>{const orig=window[name];if(typeof orig!=='function')return false;window[name]=async function(...args){const t=performance.now();let ok=false,result,err=null;try{result=await orig.apply(this,args);ok=true;return result;}catch(e){err=String(e&&e.message||e);throw e;}finally{window.__EARTHLINE_COMPONENT_TIMES.push({name,ms:Math.round(performance.now()-t),ok,error:err,source:result&&result.source||null,w:result&&result.w||null,h:result&&result.h||null,at:Date.now()});}};return true;};
  window.__EARTHLINE_WRAPPED={loadDEM:wrap('loadDEM'),loadDEMFromMap:wrap('loadDEMFromMap'),land:wrap('earthlineResolveLandValidity16584'),hydrology:wrap('hydrology')};
});}catch(e){loadError=String(e);}
for(let run=0;run<CASES.length&&!loadError;run++){
  const query=CASES[run];
  const prevToken=await page.evaluate(()=>window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584?.runToken||window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970?.runToken||null);
  await page.evaluate(()=>{window.__EARTHLINE_COMPONENT_TIMES=[];});
  const clickStarted=Date.now();let timedOut=false,terminalAt=0;
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');if(!i||!b)throw new Error('search controls unavailable');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  try{await page.waitForFunction(({q,prev})=>{const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,token=(err&&err.runToken)||(flow&&flow.runToken)||null;if(!token||token===prev)return false;if(err&&err.runToken===token)return true;const m=typeof M!=='undefined'&&M?M:null,status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),loc=[m?.loc?.name,m?.loc?.fullName].filter(Boolean).join(' '),identity=q.toLowerCase().split(/\s+/).every(w=>loc.toLowerCase().includes(w));return identity&&/screening published\./i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;},{q:query,prev:prevToken},{timeout:30000,polling:50});terminalAt=Date.now();}catch(_){timedOut=true;terminalAt=Date.now();}
  const after=await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,components:(window.__EARTHLINE_COMPONENT_TIMES||[]).slice(),wrapped:window.__EARTHLINE_WRAPPED||null,flowAudit:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()}));
  const r={run:run+1,query,clickToTerminalMs:terminalAt-clickStarted,timedOut,coreMs:Number(after?.perf?.totalMs||Infinity),slowestPhase:after?.perf?.slowestPhase||null,phases:after?.perf?.phaseTotalsMs||null,terrainSource:after?.perf?.terrainSource||null,components:after?.components||[],wrapped:after?.wrapped||null,generated:after?.pub?.generated??null,overlaySwaleLines:after?.pub?.overlaySwaleLines??null,status:after?.status||'',lastError:after?.lastError||null,flowAudit:after?.flowAudit||null,pageErrors:pageErrors.slice(0,20)};
  results.push(r);console.log('EARTHLINE_TX_TERRAIN_COMPONENTS '+JSON.stringify(r));
}
await browser.close();writeFileSync('tx-ny-regression-results.json',JSON.stringify(results,null,2));
const bad=loadError||results.length!==CASES.length||results.some(r=>r.timedOut||r.lastError||!Number.isFinite(r.coreMs)||r.coreMs>15000||r.clickToTerminalMs>15000||(Number(r.generated||0)>0&&Number(r.overlaySwaleLines||0)===0));if(bad)process.exitCode=1;
