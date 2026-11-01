import {chromium} from 'playwright';
import fs from 'node:fs';

const chromePath=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
if(!chromePath)throw new Error('system Chrome missing');

const INSERT_AT="async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){";
const HELPER="function earthlineRegionalLocalSegment17140(segment,maxHalfM=2000){if(!Array.isArray(segment)||segment.length<3)return segment;const pts=segment,mid=Math.floor((pts.length-1)/2),R=6371008.8,dist=(a,b)=>{const p1=Number(a[1])*Math.PI/180,p2=Number(b[1])*Math.PI/180,dp=(Number(b[1])-Number(a[1]))*Math.PI/180,dl=(Number(b[0])-Number(a[0]))*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))};let l=mid,r=mid,lm=0,rm=0;while(l>0){const d=dist(pts[l],pts[l-1]);if(!Number.isFinite(d)||lm+d>maxHalfM)break;l--;lm+=d}while(r<pts.length-1){const d=dist(pts[r],pts[r+1]);if(!Number.isFinite(d)||rm+d>maxHalfM)break;r++;rm+=d}if(l===r){if(r<pts.length-1)r++;else if(l>0)l--}return pts.slice(l,r+1)}\n  ";
const OLD="},geometry:{type:'LineString',coordinates:c.segment}});";
const NEW="},geometry:{type:'LineString',coordinates:focusMode?c.segment:earthlineRegionalLocalSegment17140(c.segment)}});";

function patch(body){
  if(!body.includes(INSERT_AT)||!body.includes(OLD))throw new Error('owners missing');
  body=body.replace(INSERT_AT,HELPER+INSERT_AT);
  body=body.replace(OLD,NEW);
  return body;
}
function hav(a,b){
  const R=6371000,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180;
  const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));
}
async function run(modified){
 const browser=await chromium.launch({headless:true,executablePath:chromePath,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 if(modified)await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();await route.fulfill({response:res,body:patch(await res.text())});});
 await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForTimeout(500);
 const out={};
 for(const q of ['Arizona','Texas','Florida']){
   const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
   await page.locator('#searchInput').fill(q);
   await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
   await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});
   await page.waitForTimeout(100);
   const r=await page.evaluate(()=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147,fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return {swales:Number(d?.derived?.swaleOpportunityLines||0),features:fs.map(f=>({s:Number(f?.properties?.slope_pct),c:f?.geometry?.coordinates||[]}))};});
   const lens=r.features.map(f=>{let m=0;for(let i=1;i<f.c.length;i++)m+=hav(f.c[i-1],f.c[i]);return m;}).sort((a,b)=>a-b);
   out[q]={swales:r.swales,maxSlope:Math.max(0,...r.features.map(f=>Number.isFinite(f.s)?f.s:0)),max:Math.round(lens.at(-1)||0),p95:Math.round(lens[Math.floor(lens.length*.95)]||0)};
 }
 await browser.close(); return {out,errors};
}
const current=await run(false), candidate=await run(true);
if(candidate.errors.length)throw new Error('candidate page errors '+JSON.stringify(candidate.errors));
for(const q of Object.keys(current.out)){
 if(candidate.out[q].swales!==current.out[q].swales)throw new Error(q+' count changed '+current.out[q].swales+' -> '+candidate.out[q].swales);
 if(candidate.out[q].maxSlope>4)throw new Error(q+' slope '+candidate.out[q].maxSlope);
 if(candidate.out[q].max>4500)throw new Error(q+' too long '+candidate.out[q].max);
}
console.log('M83_HELPER_DISPLAY_GEOMETRY_PASS '+JSON.stringify({current:current.out,candidate:candidate.out}));
