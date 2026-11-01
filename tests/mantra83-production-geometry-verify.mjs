import {chromium,webkit,devices} from 'playwright';
import fs from 'node:fs';

const chromePaths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const chromePath=chromePaths.find(p=>fs.existsSync(p));
if(!chromePath)throw new Error('system Chrome not found');

function hav(a,b){
  const R=6371000,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180;
  const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));
}
async function runBrowser(browserType,label,opts={}){
  const browser=await browserType.launch(opts);
  const context=await browser.newContext(label.includes('iphone')?{...devices['iPhone 13']}:{viewport:{width:1440,height:900}});
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForTimeout(1400);
  const rows=[];
  for(const q of ['Arizona','Vermont','Arkansas','Iowa']){
    const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
    await page.locator('#searchInput').fill(q);
    const t0=Date.now();
    await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
    await page.waitForFunction(prev=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
      return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
    },before,{timeout:90000});
    await page.waitForTimeout(350);
    const r=await page.evaluate(t0=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
      const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
      return {q:d?.query,ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,features:fs.map(f=>({s:Number(f?.properties?.slope_pct),c:f?.geometry?.coordinates||[]}))};
    },t0);
    const lens=r.features.map(f=>{let m=0;for(let i=1;i<f.c.length;i++)m+=hav(f.c[i-1],f.c[i]);return m;}).sort((a,b)=>a-b);
    const maxSlope=Math.max(0,...r.features.map(f=>Number.isFinite(f.s)?f.s:0));
    rows.push({q:r.q,ms:r.ms,swales:r.swales,rendered:r.rendered,maxSlope,p50:Math.round(lens[Math.floor(lens.length*.5)]||0),p95:Math.round(lens[Math.floor(lens.length*.95)]||0),max:Math.round(lens.at(-1)||0)});
  }
  await browser.close();
  return {label,rows,errors};
}
const chromiumRows=await runBrowser(chromium,'desktop-chromium',{headless:true,executablePath:chromePath,args:['--no-sandbox']});
for(const r of chromiumRows.rows){
  if(r.swales<8||r.rendered<8)throw new Error(r.q+' sparse/blank');
  if(r.maxSlope>4)throw new Error(r.q+' slope violation '+r.maxSlope);
  if(r.max>Math.max(30000,r.p95*3.5))throw new Error(r.q+' worm outlier '+r.max+' p95 '+r.p95);
}
console.log('M83_PRODUCTION_GEOMETRY_PASS '+JSON.stringify(chromiumRows));
