import {chromium,devices} from 'playwright';
import fs from 'node:fs';

const chromePaths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=chromePaths.find(p=>fs.existsSync(p));
if(!executablePath)throw new Error('system Chrome not found');

function hav(a,b){
  const R=6371000,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180;
  const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));
}

async function openCase(contextOptions,label){
  const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  const context=await browser.newContext(contextOptions);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForTimeout(1200);

  async function run(q,timeout=90000){
    const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
    await page.locator('#searchInput').fill(q);
    const t0=Date.now();
    await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
    await page.waitForFunction(prev=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
      return !!d&&String(d.runToken||'')!==String(prev||'');
    },before,{timeout});
    await page.waitForTimeout(600);
    return await page.evaluate(t0=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const mode=String(d?.tier||d?.mode||'').toLowerCase();
      const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||{};
      const fs=v.swales?.features||[];
      const m=(typeof M!=='undefined'&&M)||window.M||{};
      let elderCount=0;try{elderCount=window.EARTHLINE_ELDER_TREES_V1_17097?.features?.().length||0}catch(_){}
      return {
        query:d?.query||null,mode,ms:Date.now()-t0,
        regional:{swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,features:fs.map(f=>({s:Number(f?.properties?.slope_pct),c:f?.geometry?.coordinates||[]}))},
        property:{ready:!!m.analysisReady,safeSwales:Array.isArray(m.authoritativeSafeSwales15815)?m.authoritativeSafeSwales15815.length:(Array.isArray(m.swales)?m.swales.length:0),elderCount},
        runState:String(document.documentElement.dataset.earthlineRunState||'')
      };
    },t0);
  }

  const rows=[];
  for(const q of ['Arizona','Vermont','Arkansas','Iowa']){
    const r=await run(q);
    const lens=r.regional.features.map(f=>{let m=0;for(let i=1;i<f.c.length;i++)m+=hav(f.c[i-1],f.c[i]);return m;}).sort((a,b)=>a-b);
    const maxSlope=Math.max(0,...r.regional.features.map(f=>Number.isFinite(f.s)?f.s:0));
    rows.push({q,mode:r.mode,ms:r.ms,swales:r.regional.swales,rendered:r.regional.rendered,maxSlope,p95:Math.round(lens[Math.floor(lens.length*.95)]||0),max:Math.round(lens.at(-1)||0)});
  }
  const prop=await run('61 Sleepy Hollow Rd Essex Vermont',120000);
  const result={label,rows,property:{mode:prop.mode,ms:prop.ms,...prop.property},errors};
  await browser.close();
  return result;
}

const desktop=await openCase({viewport:{width:1440,height:900}},'desktop');
const phone=await openCase({...devices['Pixel 7']},'phone');

for(const group of [desktop,phone]){
  for(const r of group.rows){
    if(r.mode!=='regional')throw new Error(group.label+' '+r.q+' wrong mode '+r.mode);
    if(r.swales<8||r.rendered<8)throw new Error(group.label+' '+r.q+' blank/sparse');
    if(r.maxSlope>4)throw new Error(group.label+' '+r.q+' slope '+r.maxSlope);
    if(r.max>18000)throw new Error(group.label+' '+r.q+' worm length '+r.max);
    if(r.ms>45000)throw new Error(group.label+' '+r.q+' too slow '+r.ms);
  }
  if(group.property.mode!=='property')throw new Error(group.label+' Property wrong mode');
  if(!group.property.ready||group.property.safeSwales<1)throw new Error(group.label+' Property not ready');
  if(group.property.elderCount<1)throw new Error(group.label+' Property has no Elders');
  if(group.property.ms>60000)throw new Error(group.label+' Property too slow '+group.property.ms);
  if(group.errors.length)throw new Error(group.label+' page errors '+JSON.stringify(group.errors));
}
console.log('M83_LIVE_LAUNCH_GATE_PASS '+JSON.stringify({desktop,phone}));
