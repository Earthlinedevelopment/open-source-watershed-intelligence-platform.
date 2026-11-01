import {chromium} from 'playwright';import fs from 'node:fs';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);if(!chrome)throw new Error('chrome missing');
const OLDL='if(leftM+d>8000)break;', NEWL='if(leftM+d>4000)break;';
const OLDR='if(rightM+d>8000)break;', NEWR='if(rightM+d>4000)break;';
function mod(body){if(!body.includes(OLDL)||!body.includes(OLDR))throw new Error('live 16km cap owner missing');return body.replace(OLDL,NEWL).replace(OLDR,NEWR);}
function hav(a,b){const R=6371000,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180,x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));}
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();await route.fulfill({response:res,body:mod(await res.text())});});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForTimeout(900);
const rows=[];
for(const q of ['Arizona','Vermont','Arkansas','Iowa','Texas','Florida','California','Oklahoma']){
 const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));await page.locator('#searchInput').fill(q);const t0=Date.now();
 await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
 await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:70000});await page.waitForTimeout(200);
 const r=await page.evaluate(t0=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147,fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return{q:d?.query,ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),features:fs.map(f=>({s:Number(f?.properties?.slope_pct),c:f?.geometry?.coordinates||[]}))};},t0);
 const lens=r.features.map(f=>{let m=0;for(let i=1;i<f.c.length;i++)m+=hav(f.c[i-1],f.c[i]);return m;}).sort((a,b)=>a-b);const row={q:r.q,ms:r.ms,swales:r.swales,maxSlope:Math.max(0,...r.features.map(f=>Number.isFinite(f.s)?f.s:0)),p50:Math.round(lens[Math.floor(lens.length*.5)]||0),p95:Math.round(lens[Math.floor(lens.length*.95)]||0),max:Math.round(lens.at(-1)||0)};rows.push(row);
 if(row.swales<40)throw new Error(q+' too sparse '+row.swales);if(row.maxSlope>4)throw new Error(q+' slope '+row.maxSlope);if(row.max>10000)throw new Error(q+' too long '+row.max);
}
console.log('M83_8KM_TOTAL_PASS '+JSON.stringify(rows));await browser.close();