import {chromium} from 'playwright';
import fs from 'node:fs';

const chromePaths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=chromePaths.find(p=>fs.existsSync(p));
if(!executablePath)throw new Error('system Chrome not found');

const OLD_HEAD="const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<10)return null;\n      const segment=chaikin(raw,2,false);if(segment.length<10)return null;";
const NEW_HEAD="const half=Math.max(8,Math.min(24,Math.floor(coords.length*.10))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<10)return null;\n      const segment=raw;if(segment.length<10)return null;";
const OLD_SCAN="const stride=Math.max(1,Math.floor(segment.length/22));let valid=0,sumSlope=0,sumAcc=0,maxAcc=0,anchor=null;\n      for(let k=1;k<segment.length-1;k+=stride){\n        const g=llGrid(hy,segment[k]),x=Math.max(1,Math.min(hy.w-2,Math.round(g.x))),y=Math.max(1,Math.min(hy.h-2,Math.round(g.y))),i=y*hy.w+x;\n        const slope=hy.slope[i],acc=hy.acc[i],minSlope=relaxed?.05:.20,maxSlope=4;\n        if(!Number.isFinite(slope)||slope<minSlope||slope>maxSlope||acc>=channel)continue;\n        valid++;sumSlope+=slope;sumAcc+=acc;maxAcc=Math.max(maxAcc,acc);if(!anchor)anchor={x,y};\n      }\n      if(valid<(relaxed?1:2)||!anchor)return null;";
const NEW_SCAN="let valid=0,sumSlope=0,sumAcc=0,maxAcc=0,anchor=null;\n      for(let k=1;k<segment.length-1;k++){\n        const g=llGrid(hy,segment[k]),x=Math.max(1,Math.min(hy.w-2,Math.round(g.x))),y=Math.max(1,Math.min(hy.h-2,Math.round(g.y))),i=y*hy.w+x;\n        const slope=hy.slope[i],acc=hy.acc[i],minSlope=0,maxSlope=4;\n        if(!Number.isFinite(slope)||slope<minSlope||slope>maxSlope||!Number.isFinite(acc)||acc>=channel)return null;\n        valid++;sumSlope+=slope;sumAcc+=acc;maxAcc=Math.max(maxAcc,acc);if(!anchor)anchor={x,y};\n      }\n      if(valid<2||!anchor)return null;";
const OLD_RELAX="if(!focusMode||preferredEligibleCount16539<36){";
const NEW_RELAX="if(focusMode||preferredEligibleCount16539<36){";

function modify(body){
  for(const [a,b] of [[OLD_HEAD,NEW_HEAD],[OLD_SCAN,NEW_SCAN],[OLD_RELAX,NEW_RELAX]]){
    if(!body.includes(a))throw new Error('production owner missing');
    body=body.replace(a,b);
  }
  return body;
}
function hav(a,b){
  const R=6371000,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180;
  const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));
}
async function run(modified){
  const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  if(modified)await page.route('https://earthlinedevelopment.org/',async route=>{
    const res=await route.fetch(); const body=modify(await res.text()); await route.fulfill({response:res,body});
  });
  await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForTimeout(1200);
  const rows=[];
  for(const q of ['Arizona','Vermont','Arkansas']){
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
      return {q:d?.query,ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),features:fs.map(f=>({s:Number(f?.properties?.slope_pct),c:f?.geometry?.coordinates||[]}))};
    },t0);
    const lens=r.features.map(f=>{let m=0;for(let i=1;i<f.c.length;i++)m+=hav(f.c[i-1],f.c[i]);return m;}).sort((a,b)=>a-b);
    rows.push({q:r.q,ms:r.ms,swales:r.swales,maxSlope:Math.max(0,...r.features.map(f=>Number.isFinite(f.s)?f.s:0)),p95:Math.round(lens[Math.floor(lens.length*.95)]||0),max:Math.round(lens.at(-1)||0)});
  }
  await browser.close();
  return rows;
}

const current=await run(false);
const candidate=await run(true);
for(const r of candidate){
  if(r.swales<8)throw new Error(r.q+' candidate too sparse '+r.swales);
  if(r.maxSlope>4)throw new Error(r.q+' candidate slope '+r.maxSlope);
}
const ar0=current.find(x=>x.q==='Arizona'), ar1=candidate.find(x=>x.q==='Arizona');
if(!(ar1.max<ar0.max && ar1.p95<ar0.p95))throw new Error('Arizona worm geometry did not contract');
console.log('M83_FAST_GEOMETRY_PASS '+JSON.stringify({current,candidate}));
