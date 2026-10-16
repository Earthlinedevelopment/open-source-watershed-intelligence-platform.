import { chromium, firefox, webkit } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const browserName=(process.env.BROWSER||'chromium').toLowerCase();
const launchers={chromium,firefox,webkit};
if(!launchers[browserName]) throw new Error('unsupported BROWSER '+browserName);
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const states=(process.env.STATES||'Texas|Vermont').split('|').map(s=>s.trim()).filter(Boolean);
const timeout=Number(process.env.WAIT_MS||60000);
mkdirSync('artifacts/browser-regional-17269',{recursive:true});

const browser=await launchers[browserName].launch({headless:true});
const results=[];
for(const query of states){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;
  const wallStart=Date.now();
  try{
    await page.goto(BASE+'?earthline_browser_ab='+encodeURIComponent(browserName+'_'+query+'_'+Date.now()),{waitUntil:'domcontentloaded',timeout:timeout});
    await page.waitForSelector('#searchInput',{timeout:Math.min(timeout,30000)});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      if(!i||!b) throw new Error('search controls unavailable');
      i.focus(); i.value=q;
      i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));
      b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        if(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970)return true;
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(250);
  }catch(e){loadError=String(e);}

  const a=loadError?{}:await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
  }));
  const coreMs=a?.perf?.totalMs??null;
  const generated=a?.pub?.generated??null;
  const visible=a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null;
  const unsafe=a?.flow?.unsafeSegments??null;
  const outside=a?.boundary?.outsideAfterClip??null;
  const hardRootFail=Array.isArray(a?.root?.rankedCauses)&&a.root.rankedCauses.some(r=>r.status==='critical'||r.status==='fail');
  const pass=!loadError&&!timedOut&&!a?.lastError&&!pageErrors.length&&Number(coreMs)<=15000&&Number(generated)===Number(visible)&&Number(unsafe)===0&&Number(outside?.swales||0)===0&&!hardRootFail;
  const row={browser:browserName,query,pass,wallMs:Date.now()-wallStart,coreMs,generated,visible,unsafe,outsideAfterClip:outside,rootPass:a?.root?.pass??null,loadError,timedOut,pageErrors,lastError:a?.lastError||null,status:a?.status||''};
  results.push(row);
  console.log('EARTHLINE_BROWSER_AB '+JSON.stringify(row));
  await context.close();
}
await browser.close();

const summary={browser:browserName,base:BASE,total:results.length,pass:results.filter(r=>r.pass).length,fail:results.filter(r=>!r.pass).length,results};
writeFileSync(`artifacts/browser-regional-17269/${browserName}.json`,JSON.stringify(summary,null,2));
console.log('EARTHLINE_BROWSER_AB_SUMMARY '+JSON.stringify(summary));
if(summary.fail) process.exitCode=1;
