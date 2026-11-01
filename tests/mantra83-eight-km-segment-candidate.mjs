import {chromium} from 'playwright';
import fs from 'node:fs';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw new Error('chrome missing');

const OLD="const half=Math.max(5,Math.min(10,Math.floor(coords.length*.07))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<8)return null;\n      const segment=raw;if(segment.length<8)return null;";
const NEW=`const half=Math.max(5,Math.min(10,Math.floor(coords.length*.07))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);
      const raw=coords.slice(start,end);if(raw.length<2)return null;
      const rawCenter=Math.max(0,Math.min(raw.length-1,center-start));
      const distM=(a,b)=>{const R=6371008.8,p1=Number(a[1])*Math.PI/180,p2=Number(b[1])*Math.PI/180,dp=(Number(b[1])-Number(a[1]))*Math.PI/180,dl=(Number(b[0])-Number(a[0]))*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))};
      let left=rawCenter,right=rawCenter,leftM=0,rightM=0;
      while(left>0){const d=distM(raw[left],raw[left-1]);if(leftM+d>4000)break;left--;leftM+=d}
      while(right<raw.length-1){const d=distM(raw[right],raw[right+1]);if(rightM+d>4000)break;right++;rightM+=d}
      if(left===right){if(right<raw.length-1)right++;else if(left>0)left--}
      const segment=raw.slice(left,right+1);if(segment.length<2)return null;`;
const SCAN_OLD="for(let k=1;k<segment.length-1;k++){";
const SCAN_NEW="for(let k=0;k<segment.length;k++){";
const VALID_OLD="if(valid<2||!anchor)return null;";
const LINE_OLD="const linePx16632=lineLengthPixels(hy,segment);let minLinePx16632=focusMode?10:4;";
const LINE_NEW="const linePx16632=lineLengthPixels(hy,segment);let minLinePx16632=focusMode?10:2;";

function modify(body){
 if(!body.includes(OLD))throw new Error('current geometry head missing');
 body=body.replace(OLD,NEW);
 if(!body.includes(SCAN_OLD))throw new Error('scan loop missing');
 body=body.replace(SCAN_OLD,SCAN_NEW);
 if(!body.includes(LINE_OLD))throw new Error('line minimum missing');
 body=body.replace(LINE_OLD,LINE_NEW);
 return body;
}
function hav(a,b){const R=6371000,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180,x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));}

const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();await route.fulfill({response:res,body:modify(await res.text())});});
await page.goto('https://earthlinedevelopment.org/?segment-cap=1',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(1000);
const rows=[];
for(const q of ['Arizona','Vermont','Arkansas','Iowa']){
 const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
 await page.locator('#searchInput').fill(q);const t0=Date.now();
 await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
 await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});
 await page.waitForTimeout(250);
 const r=await page.evaluate(t0=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147,fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return{q:d?.query,ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),features:fs.map(f=>({s:Number(f?.properties?.slope_pct),c:f?.geometry?.coordinates||[]}))};},t0);
 const lens=r.features.map(f=>{let m=0;for(let i=1;i<f.c.length;i++)m+=hav(f.c[i-1],f.c[i]);return m;}).sort((a,b)=>a-b);
 const row={q:r.q,ms:r.ms,swales:r.swales,maxSlope:Math.max(0,...r.features.map(f=>Number.isFinite(f.s)?f.s:0)),p50:Math.round(lens[Math.floor(lens.length*.5)]||0),p95:Math.round(lens[Math.floor(lens.length*.95)]||0),max:Math.round(lens.at(-1)||0)};
 rows.push(row);
 if(row.swales<40)throw new Error(q+' too sparse '+row.swales);
 if(row.maxSlope>4)throw new Error(q+' slope violation '+row.maxSlope);
 if(row.max>12000)throw new Error(q+' line still too long '+row.max);
}
console.log('M83_8KM_SEGMENT_PASS '+JSON.stringify(rows));
await browser.close();
