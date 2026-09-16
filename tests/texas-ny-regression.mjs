import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/?earthline_regression=tx_ny';
const CASES=['New York','Texas'];
const browser=await chromium.launch({headless:true});
const results=[];
for(const query of CASES){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const started=Date.now();let timedOut=false,loadError=null;
  try{
    await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');if(!i||!b)throw new Error('search controls unavailable');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
    try{
      await page.waitForFunction(q=>{
        const m=typeof M!=='undefined'&&M?M:null;
        const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const loc=[m?.loc?.name,m?.loc?.fullName].filter(Boolean).join(' ');
        const identity=q.toLowerCase().split(/\s+/).every(w=>loc.toLowerCase().includes(w));
        return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(identity&&/screening published\./i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191);
      },query,{timeout:30000,polling:100});
    }catch(_){timedOut=true;}
  }catch(e){loadError=String(e);}
  let after={};
  try{after=await page.evaluate(()=>{const html=document.documentElement.outerHTML;return {perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,boundaryAudit:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),repairMarker:html.includes("maxAllowableOffset:'0.0025'")&&html.includes('const raw=await jsonp(cap.endpoint,params,6500)')};});}catch(e){loadError=loadError||String(e);}
  const r={query,elapsedMs:Date.now()-started,timedOut,loadError,coreMs:Number(after?.perf?.totalMs||Infinity),status:after?.status||'',repairMarker:!!after?.repairMarker,boundaryAfter:after?.boundaryAudit?.after||null,lastError:after?.lastError||null,pageErrors:errors.slice(0,10)};
  results.push(r);console.log('EARTHLINE_TX_NY_REGRESSION '+JSON.stringify(r));await page.close();
}
await browser.close();
if(results.some(r=>r.timedOut||r.loadError||r.lastError||!r.repairMarker||!Number.isFinite(r.coreMs)||r.coreMs>15000||!/screening published\./i.test(r.status)))process.exitCode=1;
