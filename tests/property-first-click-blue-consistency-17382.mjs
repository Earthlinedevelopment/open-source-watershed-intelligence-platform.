import { chromium, firefox, webkit } from 'playwright';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?property17382='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(700);
const options=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await options.count()) await options.first().click();
const rb=page.locator('#runBtn');
if(await rb.isVisible()) await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:90000,polling:100});

const points=[
  {name:'A',lng:-72.5778,lat:44.2601},
  {name:'B',lng:-72.5650,lat:44.2700}
];
const rows=[];
for(const pt of points){
  await page.evaluate(async p=>{
    if(typeof window.earthlineFocusRunEngine16158!=='function') throw new Error('focus owner unavailable');
    await window.earthlineFocusRunEngine16158({center:{lng:p.lng,lat:p.lat},sizeM:3000,label:'Property gate '+p.name});
  },pt);
  await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'').toLowerCase()==='focus',null,{timeout:90000,polling:100});
  await page.evaluate(p=>new Promise(resolve=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m?.jumpTo)return resolve();
    let done=false;const f=()=>{if(done)return;done=true;resolve()};
    m.once?.('moveend',f);m.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});setTimeout(f,1200);
  }),pt);
  await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return b&&getComputedStyle(b).display!=='none'&&!b.disabled},null,{timeout:15000,polling:100});
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  let started=false;
  try{
    await page.waitForFunction(pre=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>pre||String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running',before,{timeout:3000,polling:50});
    started=true;
  }catch(_){}
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre&&a?.settled===true;
  },before,{timeout:90000,polling:100});
  await page.evaluate(async()=>{
    try{if(typeof window.earthlineSyncPropertyTexture16169==='function')await window.earthlineSyncPropertyTexture16169('gate-force')}catch(_){}
  });
  await page.waitForTimeout(250);
  const snap=await page.evaluate(()=>({
    audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    firstClick:window.EARTHLINE_PROPERTY_FIRST_CLICK_17381||null,
    texture:window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null,
    style:window.EARTHLINE_PROPERTY_RENDER_STYLE_17382||null
  }));
  rows.push({name:pt.name,started,elapsedMs:Date.now()-t0,...snap});
}
await browser.close();

const styleKey=s=>JSON.stringify({
  upOpacity:s?.upOpacity??null,flipOpacity:s?.flipOpacity??null,
  upPattern:s?.upPattern??null,flipPattern:s?.flipPattern??null,
  casingOpacity:s?.casingOpacity??null,neutralOpacity:s?.neutralOpacity??null,
  safeWaterOpacity:s?.safeWaterOpacity??null
});
const oneClick=rows.every(r=>r.started&&r.audit?.settled===true&&r.audit?.result===true);
const targetOk=rows.every((r,i)=>Math.abs(Number(r.target?.lng)-points[i].lng)<0.002&&Math.abs(Number(r.target?.lat)-points[i].lat)<0.002);
const blueConsistent=rows.length===2&&styleKey(rows[0].style)===styleKey(rows[1].style);
const textureReady=rows.every(r=>r.texture?.imagesReady===true&&r.texture?.orientationComplete===true);
const pass=oneClick&&targetOk&&blueConsistent&&textureReady;
console.log('EARTHLINE_PROPERTY_17382 '+JSON.stringify({browser:BROWSER,pass,oneClick,targetOk,blueConsistent,textureReady,styles:rows.map(r=>r.style),rows,errors}));
if(!pass)process.exitCode=1;
