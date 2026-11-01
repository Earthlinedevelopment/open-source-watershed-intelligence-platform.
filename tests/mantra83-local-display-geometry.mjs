import {chromium} from 'playwright';
import fs from 'node:fs';

const chromePath=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
if(!chromePath)throw new Error('system Chrome missing');

const OLD="},geometry:{type:'LineString',coordinates:c.segment}});";
const NEW="},geometry:{type:'LineString',coordinates:(()=>{if(focusMode||!Array.isArray(c.segment)||c.segment.length<3)return c.segment;const pts=c.segment,mid=Math.floor((pts.length-1)/2),R=6371008.8,dist=(a,b)=>{const p1=Number(a[1])*Math.PI/180,p2=Number(b[1])*Math.PI/180,dp=(Number(b[1])-Number(a[1]))*Math.PI/180,dl=(Number(b[0])-Number(a[0]))*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))};let l=mid,r=mid,lm=0,rm=0;while(l>0){const d=dist(pts[l],pts[l-1]);if(lm+d>2000)break;l--;lm+=d}while(r<pts.length-1){const d=dist(pts[r],pts[r+1]);if(rm+d>2000)break;r++;rm+=d}if(l===r){if(r<pts.length-1)r++;else if(l>0)l--}return pts.slice(l,r+1)})()}});";

function patch(body){
  if(!body.includes(OLD))throw new Error('publication geometry owner missing');
  return body.replace(OLD,NEW);
}
function hav(a,b){
  const R=6371000,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180;
  const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(x)));
}
async function run(modified){
 const browser=await chromium.launch({headless:true,executablePath:chromePath,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 if(modified)await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();await route.fulfill({response:res,body:patch(await res.text())});});
 await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForTimeout(800);
 const out={};
 for(const q of ['Arizona','Vermont','Arkansas','Iowa','Texas','Florida','California','Oklahoma']){
   const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
   await page.locator('#searchInput').fill(q);
   await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
   await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});
   await page.waitForTimeout(200);
   const r=await page.evaluate(()=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147,fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return {swales:Number(d?.derived?.swaleOpportunityLines||0),features:fs.map(f=>({s:Number(f?.properties?.slope_pct),c:f?.geometry?.coordinates||[]}))};});
   const lens=r.features.map(f=>{let m=0;for(let i=1;i<f.c.length;i++)m+=hav(f.c[i-1],f.c[i]);return m;}).sort((a,b)=>a-b);
   out[q]={swales:r.swales,maxSlope:Math.max(0,...r.features.map(f=>Number.isFinite(f.s)?f.s:0)),p95:Math.round(lens[Math.floor(lens.length*.95)]||0),max:Math.round(lens.at(-1)||0)};
 }
 await browser.close(); return out;
}
const current=await run(false);
const candidate=await run(true);
for(const q of Object.keys(current)){
 if(candidate[q].swales!==current[q].swales)throw new Error(q+' count changed '+current[q].swales+' -> '+candidate[q].swales);
 if(candidate[q].maxSlope>4)throw new Error(q+' slope '+candidate[q].maxSlope);
 if(candidate[q].max>4500)throw new Error(q+' display segment too long '+candidate[q].max);
}
console.log('M83_LOCAL_DISPLAY_GEOMETRY_PASS '+JSON.stringify({current,candidate}));
