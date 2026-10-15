import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs';

const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const HEADLESS=!/^(0|false|no)$/i.test(String(process.env.HEADLESS||'true'));
const browserType=BROWSER==='firefox'?firefox:BROWSER==='webkit'?webkit:chromium;
const STATES=['Arizona','New Mexico','Colorado','Texas','California','Vermont','New York'];
const browser=await browserType.launch({headless:HEADLESS});
const rows=[];

for(const state of STATES){
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
  let failure=null,elapsedMs=null,snap={};
  try{
    await page.goto(BASE+'?browser17238='+encodeURIComponent(state)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const started=Date.now();
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      if(!i||!b)throw new Error('search controls unavailable');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },state);
    await page.waitForFunction(q=>{
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      if(err)return true;
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      const exact=String(pkg?.identity?.name||'').toLowerCase()===String(q).toLowerCase();
      const vt=String(q).toLowerCase()==='vermont'&&String(pub?.runToken||'').toLowerCase().includes('vermont');
      return (exact||vt)&&Number(pub?.generated||0)>0&&Number(disp?.swaleLines||0)===Number(pub?.generated||0);
    },state,{timeout:90000,polling:200});
    elapsedMs=Date.now()-started;
    snap=await page.evaluate(()=>({
      ready:window.EARTHLINE_MAP_READINESS_16155||null,
      mapAudit:window.earthlineStartupSplashAudit16171?window.earthlineStartupSplashAudit16171():null,
      err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
      disp:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
      state:String(document.documentElement.dataset.earthlineRunState||'')
    }));
    if(snap.err)failure='regional '+JSON.stringify(snap.err);
  }catch(e){
    failure=String(e&&e.message||e);
    try{
      snap=await page.evaluate(()=>({
        ready:window.EARTHLINE_MAP_READINESS_16155||null,
        mapAudit:window.earthlineStartupSplashAudit16171?window.earthlineStartupSplashAudit16171():null,
        err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
        state:String(document.documentElement.dataset.earthlineRunState||'')
      }));
    }catch(_){}
  }
  const pass=!failure&&!errors.length&&Number(snap?.pub?.generated||0)>0&&Number(snap?.disp?.swaleLines||0)===Number(snap?.pub?.generated||0);
  rows.push({state,browser:BROWSER,headless:HEADLESS,elapsedMs,failure,errors:errors.slice(0,10),snap,pass});
  console.log('EARTHLINE_BROWSER_17238 '+JSON.stringify(rows.at(-1)));
  await page.close();
}
await browser.close();
const out={browser:BROWSER,headless:HEADLESS,rows,pass:rows.every(r=>r.pass)};
fs.writeFileSync(process.env.OUT||`browser-${BROWSER}-17238.json`,JSON.stringify(out,null,2));
if(!out.pass)process.exitCode=1;
