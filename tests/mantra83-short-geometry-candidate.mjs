import {chromium} from 'playwright';
import fs from 'node:fs';

const chromePaths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=chromePaths.find(p=>fs.existsSync(p));
if(!executablePath)throw new Error('system Chrome not found');

const OLD_HEAD="const half=Math.max(5,Math.min(10,Math.floor(coords.length*.07))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<8)return null;\n      const segment=raw;if(segment.length<8)return null;";
const NEW_HEAD="const half=Math.max(2,Math.min(5,Math.floor(coords.length*.035))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<5)return null;\n      const segment=raw;if(segment.length<5)return null;";
const OLD_VALID="if(valid<2||!anchor)return null;";
const NEW_VALID="if(valid<Math.max(2,segment.length-2)||!anchor)return null;";

function modify(body){
  if(!body.includes(OLD_HEAD))throw new Error('short geometry owner missing');
  if(!body.includes(OLD_VALID))throw new Error('validation owner missing');
  return body.replace(OLD_HEAD,NEW_HEAD).replace(OLD_VALID,NEW_VALID);
}
function hav(a,b){
  const R=6371000,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180;
  const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));
}
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.route('https://earthlinedevelopment.org/',async route=>{
  const res=await route.fetch(); let body=modify(await res.text()); await route.fulfill({response:res,body});
});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(1200);
const rows=[];
for(const q of ['Arizona','Vermont','Arkansas','Iowa','Texas','Florida','California','Oklahoma']){
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
  const row={q:r.q,ms:r.ms,swales:r.swales,rendered:r.rendered,maxSlope,p50:Math.round(lens[Math.floor(lens.length*.5)]||0),p95:Math.round(lens[Math.floor(lens.length*.95)]||0),max:Math.round(lens.at(-1)||0)};
  rows.push(row);
  if(row.swales<12||row.rendered<12)throw new Error(q+' too sparse '+JSON.stringify(row));
  if(row.maxSlope>4)throw new Error(q+' slope violation '+row.maxSlope);
  if(row.max>18000)throw new Error(q+' segment still worm-like '+row.max);
}
console.log('M83_SHORT_GEOMETRY_PASS '+JSON.stringify(rows));
await browser.close();
