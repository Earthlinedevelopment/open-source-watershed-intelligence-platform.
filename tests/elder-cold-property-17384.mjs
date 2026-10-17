import { chromium, firefox, webkit } from 'playwright';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?elderCold17384='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForFunction(()=>typeof window.earthlineFocusRunEngine16158==='function',null,{timeout:30000,polling:100});

const pt={lng:-72.5754,lat:44.2601};
await page.evaluate(async p=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(m?.jumpTo)m.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});
  await window.earthlineFocusRunEngine16158({center:{lng:p.lng,lat:p.lat},sizeM:3000,label:'Vermont Elder cold gate'});
},pt);
await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'').toLowerCase()==='focus',null,{timeout:120000,polling:100});
await page.evaluate(p=>new Promise(resolve=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(!m?.jumpTo)return resolve();
  let done=false;const f=()=>{if(done)return;done=true;resolve()};
  m.once?.('moveend',f);m.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});setTimeout(f,1200);
}),pt);
await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return b&&getComputedStyle(b).display!=='none'&&!b.disabled},null,{timeout:20000,polling:100});

const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
const t0=Date.now();
await page.locator('#earthlineDeclareProperty16169').click();

let propertyStartMs=null;
try{
  await page.waitForFunction(pre=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>pre||document.documentElement.classList.contains('earthline-property-running-16233'),before,{timeout:3000,polling:50});
  propertyStartMs=Date.now()-t0;
}catch(_){}

let elderCommitMs=null;
try{
  await page.waitForFunction(()=>{
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    return e?.state==='committed'&&String(e?.propertyRunIdentity||'').length>0;
  },null,{timeout:30000,polling:100});
  elderCommitMs=Date.now()-t0;
}catch(_){}

let propertySettleMs=null;
try{
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre&&a?.settled===true;
  },before,{timeout:90000,polling:100});
  propertySettleMs=Date.now()-t0;
}catch(_){}

const snap=await page.evaluate(()=>({
  audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  firstClick:window.EARTHLINE_PROPERTY_FIRST_CLICK_17383||null
}));
const oneClick=propertyStartMs!==null&&propertyStartMs<=3000;
const elderPass=elderCommitMs!==null&&elderCommitMs<=15000&&snap.elder?.state==='committed';
const propertyPass=propertySettleMs!==null&&snap.audit?.result===true;
const pass=oneClick&&elderPass&&propertyPass;
console.log('EARTHLINE_ELDER_COLD_17384 '+JSON.stringify({browser:BROWSER,pass,oneClick,elderPass,propertyPass,propertyStartMs,elderCommitMs,propertySettleMs,elder:snap.elder,target:snap.target,errors}));
await browser.close();
if(!pass)process.exitCode=1;
