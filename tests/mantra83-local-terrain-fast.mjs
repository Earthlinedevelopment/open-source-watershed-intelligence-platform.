import {chromium,webkit} from 'playwright';
import fs from 'node:fs';

const FINE='/* EARTHLINE 16780 —';
const COVER='/* EARTHLINE 16731 —';
const COND='if(!focusMode&&hy&&hy.validityMask16584&&swales&&Array.isArray(swales.features)){';
function disableAfter(body,marker){
  const m=body.indexOf(marker); if(m<0)throw new Error('marker missing '+marker);
  const i=body.indexOf(COND,m); if(i<0)throw new Error('condition missing after '+marker);
  return body.slice(0,i)+'if(false&&!focusMode&&hy&&hy.validityMask16584&&swales&&Array.isArray(swales.features)){'+body.slice(i+COND.length);
}
function modify(body){body=disableAfter(body,FINE);body=disableAfter(body,COVER);return body;}
function hav(a,b){const R=6371008.8,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))}
const chromePaths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const chromePath=chromePaths.find(p=>fs.existsSync(p));

async function suite(kind,queries){
 const bt=kind==='webkit'?webkit:chromium;
 const opts=kind==='webkit'?{headless:true}:{headless:true,executablePath:chromePath,args:['--no-sandbox']};
 const browser=await bt.launch(opts);const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();await route.fulfill({response:res,body:modify(await res.text())});});
 await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForTimeout(700);
 const rows=[];
 for(const q of queries){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);const t0=Date.now();
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(d.tier||d.mode||'').toLowerCase()==='regional';},before,{timeout:70000});
  await page.waitForTimeout(300);
  const r=await page.evaluate(t0=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||{},fs=v.swales?.features||[];return {ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,bounds:v.bounds||d?.bounds||null,features:fs.map(f=>({s:Number(f?.properties?.slope_pct),c:f?.geometry?.coordinates||[]})),supertile:window.EARTHLINE_STATEWIDE_SUPERTILE_16839||null}},t0);
  const lens=r.features.map(f=>{let m=0;for(let i=1;i<f.c.length;i++)m+=hav(f.c[i-1],f.c[i]);return m}).sort((a,b)=>a-b);
  const maxSlope=Math.max(0,...r.features.map(f=>Number.isFinite(f.s)?f.s:0));
  const bins=new Set();if(Array.isArray(r.bounds)&&r.bounds.length===4){const [w,s,e,n]=r.bounds;for(const f of r.features){const c=f.c[Math.floor((f.c.length-1)/2)];if(!c)continue;const bx=Math.max(0,Math.min(5,Math.floor((c[0]-w)/(e-w)*6))),by=Math.max(0,Math.min(5,Math.floor((n-c[1])/(n-s)*6)));bins.add(bx+','+by)}}
  const row={q,ms:r.ms,swales:r.swales,rendered:r.rendered,maxSlope,occupied6x6:bins.size,p95M:Math.round(lens[Math.floor(lens.length*.95)]||0),maxM:Math.round(lens.at(-1)||0),supertileMs:Number(r.supertile?.elapsedMs||0),errors:errors.slice()};
  rows.push(row);console.log('M83_LOCAL_ONLY_ROW '+JSON.stringify({kind,...row}));
  if(row.swales<40||row.rendered<40)throw new Error(kind+' '+q+' sparse '+JSON.stringify(row));
  if(row.maxSlope>4)throw new Error(kind+' '+q+' slope '+row.maxSlope);
  if(row.occupied6x6<8)throw new Error(kind+' '+q+' spatial coverage '+row.occupied6x6);
  if(row.maxM>20000)throw new Error(kind+' '+q+' worm length '+row.maxM);
  if(row.ms>35000)throw new Error(kind+' '+q+' too slow '+row.ms);
 }
 await browser.close();return rows;
}
const chrome=await suite('chrome',['Vermont','Arizona','Iowa','Arkansas']);
const wk=await suite('webkit',['Vermont','Arizona']);
console.log('M83_LOCAL_ONLY_PASS '+JSON.stringify({chrome,webkit:wk}));
