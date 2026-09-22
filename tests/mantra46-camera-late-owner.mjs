import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra46-camera-late-owner';
const CASES=['Iowa','Arkansas'];
const RUNS=5;
mkdirSync(OUT,{recursive:true});

async function waitFor16794(){
  for(let i=0;i<40;i++){
    const r=await fetch(BASE+'?m46_16794_probe='+Date.now(),{cache:'no-store'});
    const t=await r.text();
    if(t.includes('EARTHLINE 16794 — LATE JSONP CALLBACK RETIREMENT')) return true;
    await new Promise(r=>setTimeout(r,5000));
  }
  throw new Error('16794 marker not served within 200 seconds');
}

await waitFor16794();
const browser=await chromium.launch({headless:true});
const rows=[];

async function runOne(query,run){
  const context=await browser.newContext({viewport:{width:1920,height:1080}});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  const started=Date.now();
  let loadError=null,timedOut=false;

  try{
    await page.goto(BASE+'?m46_16794='+encodeURIComponent(query)+'_'+run+'_'+Date.now(),{
      waitUntil:'domcontentloaded',
      timeout:45000
    });
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput');
      const b=document.getElementById('runBtn');
      i.value=q;
      i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));
      b.click();
    },query);

    try{
      await page.waitForFunction(q=>{
        const s=String(
          document.getElementById('earthlineVermontStatus16147')?.textContent ||
          document.getElementById('earthlineTierNotice16173')?.textContent ||
          ''
        );
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s) &&
          !!root &&
          String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:55000,polling:100});
    }catch(_){
      timedOut=true;
    }

    // Hold the live page beyond the old 8-second JSONP timeout so a retired
    // Vermont fallback cannot surface as a late ReferenceError.
    await page.waitForTimeout(10000);
  }catch(e){
    loadError=String(e);
  }

  const snap=loadError?{}:await page.evaluate(()=>({
    center:(()=>{
      try{
        const c=earthlineMap.getCenter();
        return {lng:c.lng,lat:c.lat,zoom:earthlineMap.getZoom()};
      }catch(_){return null}
    })(),
    pkg:(()=>{
      const p=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556;
      return p?{name:p.identity?.name,center:p.center,location:p.location}:null;
    })(),
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||
      window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    status:String(
      document.getElementById('earthlineVermontStatus16147')?.textContent ||
      document.getElementById('earthlineTierNotice16173')?.textContent ||
      ''
    )
  }));

  const slug=query.toLowerCase()+'-'+run;
  try{await page.screenshot({path:`${OUT}/${slug}.png`,fullPage:false});}catch(_){}

  const row={
    query,run,loadError,timedOut,pageErrors,
    elapsedMs:Date.now()-started,
    center:snap.center,
    pkg:snap.pkg,
    coreMs:snap.perf?.totalMs??null,
    swales:snap.display?.swaleLines??null,
    rootPass:snap.root?.pass??null,
    firstFailedStage:snap.root?.firstFailedStage??null,
    status:snap.status
  };
  rows.push(row);
  console.log('EARTHLINE_M46_16794_LIVE '+JSON.stringify(row));
  await context.close();
}

for(const q of CASES){
  for(let i=1;i<=RUNS;i++) await runOne(q,i);
}

await browser.close();
writeFileSync(`${OUT}/results.json`,JSON.stringify(rows,null,2));

const expected={
  Iowa:{lng:-93.4933492,lat:42.0700227},
  Arkansas:{lng:-92.4446262,lat:34.8955256}
};

const bad=rows.filter(r=>{
  const e=expected[r.query];
  return r.loadError ||
    r.timedOut ||
    r.pageErrors.length ||
    !r.center ||
    !r.pkg ||
    r.pkg.name!==r.query ||
    Math.abs(r.center.lng-e.lng)>8 ||
    Math.abs(r.center.lat-e.lat)>8 ||
    Number(r.center.zoom)<5 ||
    !r.rootPass;
});

if(bad.length){
  console.error('FAILED_ROWS '+JSON.stringify(bad,null,2));
  process.exitCode=1;
}
