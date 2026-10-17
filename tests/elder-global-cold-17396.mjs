import { chromium, firefox, webkit } from 'playwright';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';

const cases=[
  {name:'Vermont',lng:-72.5754,lat:44.2601},
  {name:'California',lng:-121.49,lat:38.58},
  {name:'Colorado',lng:-105.27,lat:39.73},
  {name:'Thailand',lng:98.98,lat:18.79},
  {name:'Laos',lng:102.63,lat:17.97},
  {name:'Vietnam',lng:105.78,lat:10.03}
];

const rows=[];
for(const c of cases){
  const context=await browser.newContext({viewport:{width:1600,height:900}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'?elderGlobal17396='+encodeURIComponent(c.name)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    return !!(window.EARTHLINE_ELDER_TREES_V1_17097&&typeof window.EARTHLINE_ELDER_TREES_V1_17097.startProperty==='function'&&m&&typeof m.isStyleLoaded==='function'&&m.isStyleLoaded());
  },null,{timeout:30000,polling:100});
  const result=await page.evaluate(async c=>{
    const target={lng:c.lng,lat:c.lat,source:'crosshair',code:'',score:0,at:new Date().toISOString()};
    window.EARTHLINE_PROPERTY_TARGET_16201=target; /* 17396 speed gate: pin target; do not invoke UI/camera target setter */
    const t0=performance.now();
    let timedOut=false;
    let summary=null;
    try{
      summary=await Promise.race([
        window.EARTHLINE_ELDER_TREES_V1_17097.startProperty(),
        new Promise(resolve=>setTimeout(()=>{timedOut=true;resolve(null)},30000))
      ]);
    }catch(_){}
    return {
      elapsedMs:Math.round(performance.now()-t0),timedOut,summary,
      elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null
    };
  },c);
  const committed=result.elder?.state==='committed';
  const pass=!result.timedOut&&committed&&result.elapsedMs<=15000;
  const row={browser:BROWSER,name:c.name,pass,elapsedMs:result.elapsedMs,state:result.elder?.state||null,
    featureCount:result.elder?.featureCount??null,candidatePool:result.elder?.dynamicCandidatePoolCount??null,
    workerTimings:result.elder?.workerTimings||null,dynamicError:result.elder?.dynamicError||result.elder?.error||null,errors};
  rows.push(row);
  console.log('EARTHLINE_ELDER_GLOBAL_17396 '+JSON.stringify(row));
  await context.close();
}
await browser.close();
const summary={browser:BROWSER,total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows};
console.log('EARTHLINE_ELDER_GLOBAL_17396_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
