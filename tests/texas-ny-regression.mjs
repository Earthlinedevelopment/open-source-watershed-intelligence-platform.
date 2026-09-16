import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const URL='https://earthlinedevelopment.org/?earthline_regression=tx_ny_click';
const CASES=['Texas','Texas','Texas','New York'];
const browser=await chromium.launch({headless:true});
const results=[];
for(let run=0;run<CASES.length;run++){
  const query=CASES[run];
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  let timedOut=false,loadError=null,clickStarted=0,terminalAt=0;
  try{
    await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    clickStarted=Date.now();
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');if(!i||!b)throw new Error('search controls unavailable');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
    try{
      await page.waitForFunction(q=>{
        const m=typeof M!=='undefined'&&M?M:null;
        const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const loc=[m?.loc?.name,m?.loc?.fullName].filter(Boolean).join(' ');
        const identity=q.toLowerCase().split(/\s+/).every(w=>loc.toLowerCase().includes(w));
        return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(identity&&/screening published\./i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191);
      },query,{timeout:30000,polling:50});
      terminalAt=Date.now();
    }catch(_){timedOut=true;terminalAt=Date.now();}
  }catch(e){loadError=String(e);terminalAt=Date.now();}
  let after={};
  try{after=await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,boundaryAudit:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),flowAudit:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null}));}catch(e){loadError=loadError||String(e);}
  const clickToTerminalMs=clickStarted?terminalAt-clickStarted:Infinity;
  const r={run:run+1,query,clickToTerminalMs,timedOut,loadError,coreMs:Number(after?.perf?.totalMs||Infinity),phase:after?.perf?.phase||null,status:after?.status||'',boundaryAfter:after?.boundaryAudit?.after||null,lastError:after?.lastError||null,flowAudit:after?.flowAudit||null,pageErrors:errors.slice(0,10)};
  results.push(r);console.log('EARTHLINE_TX_NY_CLICK_GATE '+JSON.stringify(r));await page.close();
}
await browser.close();
writeFileSync('tx-ny-regression-results.json',JSON.stringify(results,null,2));
if(results.some(r=>r.timedOut||r.loadError||r.lastError||!Number.isFinite(r.coreMs)||r.coreMs>15000||r.clickToTerminalMs>15000||!/screening published\./i.test(r.status)))process.exitCode=1;
