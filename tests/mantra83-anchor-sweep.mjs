import {chromium} from 'playwright';
import fs from 'node:fs';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw new Error('chrome missing');

const CUR_HEAD="const half=Math.max(8,Math.min(24,Math.floor(coords.length*.10))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<10)return null;\n      const segment=raw;if(segment.length<10)return null;";
const CUR_SCAN="let valid=0,sumSlope=0,sumAcc=0,maxAcc=0,anchor=null;\n      for(let k=1;k<segment.length-1;k++){\n        const g=llGrid(hy,segment[k]),x=Math.max(1,Math.min(hy.w-2,Math.round(g.x))),y=Math.max(1,Math.min(hy.h-2,Math.round(g.y))),i=y*hy.w+x;\n        const slope=hy.slope[i],acc=hy.acc[i],minSlope=0,maxSlope=4;\n        if(!Number.isFinite(slope)||slope<minSlope||slope>maxSlope||!Number.isFinite(acc)||acc>=channel)return null;\n        valid++;sumSlope+=slope;sumAcc+=acc;maxAcc=Math.max(maxAcc,acc);if(!anchor)anchor={x,y};\n      }\n      if(valid<2||!anchor)return null;";
const CUR_ANCHOR="if((regionalAnchorAttempts16786.get(key)||0)>=2)continue;";
function patch(body,half,attempts){
 const head="const half=Math.max(5,Math.min("+half+",Math.floor(coords.length*.07))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<8)return null;\n      const segment=raw;if(segment.length<8)return null;";
 if(!body.includes(CUR_HEAD))throw new Error('head missing');
 body=body.replace(CUR_HEAD,head);
 if(!body.includes(CUR_SCAN))throw new Error('scan missing');
 if(!body.includes(CUR_ANCHOR))throw new Error('anchor missing');
 body=body.replace(CUR_ANCHOR,"if((regionalAnchorAttempts16786.get(key)||0)>="+attempts+")continue;");
 return body;
}
function hav(a,b){const R=6371000,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180,x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));}
async function runVariant(half,attempts){
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();let body=patch(await res.text(),half,attempts);await route.fulfill({response:res,body});});
 await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForTimeout(800);
 const rows=[];
 for(const q of ['Arizona','Vermont','Arkansas']){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);const t0=Date.now();
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});await page.waitForTimeout(200);
  const r=await page.evaluate(t0=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147,fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return{q:d?.query,ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),features:fs.map(f=>({s:Number(f?.properties?.slope_pct),c:f?.geometry?.coordinates||[]}))};},t0);
  const lens=r.features.map(f=>{let m=0;for(let i=1;i<f.c.length;i++)m+=hav(f.c[i-1],f.c[i]);return m;}).sort((a,b)=>a-b);
  rows.push({q:r.q,ms:r.ms,swales:r.swales,maxSlope:Math.max(0,...r.features.map(f=>Number.isFinite(f.s)?f.s:0)),p95:Math.round(lens[Math.floor(lens.length*.95)]||0),max:Math.round(lens.at(-1)||0)});
 }
 await browser.close();return{half,attempts,rows};
}
const out=[];
for(const v of [[10,3],[10,4],[12,3],[12,4]])out.push(await runVariant(v[0],v[1]));
console.log('M83_ANCHOR_SWEEP '+JSON.stringify(out));
