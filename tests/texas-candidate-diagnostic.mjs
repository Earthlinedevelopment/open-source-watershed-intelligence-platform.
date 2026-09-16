import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const RUNS=2;
const browser=await chromium.launch({headless:true});
const results=[];

function vertexCount(geometry){
  let n=0;
  const walk=v=>{if(!Array.isArray(v))return;if(v.length>=2&&Number.isFinite(Number(v[0]))&&Number.isFinite(Number(v[1]))){n++;return;}for(const x of v)walk(x);};
  walk(geometry?.coordinates);return n;
}

for(let attempt=1;attempt<=RUNS;attempt++){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const started=Date.now();
  let timedOut=false,loadError=null;
  try{
    await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(()=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      if(!i||!b)throw new Error('search controls unavailable');
      i.focus();i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    });
    try{
      await page.waitForFunction(()=>{
        const m=typeof M!=='undefined'&&M?M:null;
        const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const tx=/texas/i.test(String(m?.loc?.name||''))||/texas/i.test(String(m?.loc?.fullName||''));
        return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(tx&&/screening published\./i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191);
      },{timeout:30000,polling:100});
    }catch(_){timedOut=true;}
  }catch(e){loadError=String(e);}
  let after=null;
  try{
    after=await page.evaluate(()=>{
      const pkg=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null;
      const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
      const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
      const audit=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim();
      return {pkg,perf,gen,audit,status,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
    });
  }catch(e){loadError=loadError||String(e);}
  const vertices=vertexCount(after?.pkg?.boundary?.geometry);
  const r={attempt,elapsedMs:Date.now()-started,timedOut,loadError,coreMs:Number(after?.perf?.totalMs||Infinity),vertices,generated:Number(after?.gen?.published||after?.gen?.selected||after?.gen?.accepted||0),status:after?.status||'',lastError:after?.lastError||null,pageErrors:errors.slice(0,10)};
  results.push(r);console.log('EARTHLINE_TEXAS_CANDIDATE '+JSON.stringify(r));
  await page.close();
}
await browser.close();
const bad=results.some(r=>r.timedOut||r.loadError||r.lastError||!Number.isFinite(r.coreMs)||r.coreMs>15000||!/screening published\./i.test(r.status)||r.vertices<100);
if(bad)process.exitCode=1;
