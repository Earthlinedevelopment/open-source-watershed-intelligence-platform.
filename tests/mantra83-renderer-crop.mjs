import {chromium} from 'playwright';
import fs from 'node:fs';

const chromePath=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
if(!chromePath)throw new Error('system Chrome missing');

const RENDER="function render(data){";
const HELPER="function earthlineRegionalLocalDisplay16020(coords,maxHalfM=2000){if(!Array.isArray(coords)||coords.length<3)return coords;const mid=Math.floor((coords.length-1)/2),R=6371008.8,dist=(a,b)=>{const p1=Number(a[1])*Math.PI/180,p2=Number(b[1])*Math.PI/180,dp=(Number(b[1])-Number(a[1]))*Math.PI/180,dl=(Number(b[0])-Number(a[0]))*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))};let l=mid,r=mid,lm=0,rm=0;while(l>0){const d=dist(coords[l],coords[l-1]);if(!Number.isFinite(d)||lm+d>maxHalfM)break;l--;lm+=d}while(r<coords.length-1){const d=dist(coords[r],coords[r+1]);if(!Number.isFinite(d)||rm+d>maxHalfM)break;r++;rm+=d}if(l===r){if(r<coords.length-1)r++;else if(l>0)l--}return coords.slice(l,r+1)}\n  ";
const OLD="const pts=points(f.geometry.coordinates),len=polyLength(pts),activeTier=activeTier16168();";
const NEW="const activeTier=activeTier16168(),rawCoords=f.geometry.coordinates,renderCoords=activeTier==='focus'?rawCoords:earthlineRegionalLocalDisplay16020(rawCoords),pts=points(renderCoords),len=polyLength(pts);";

function patch(body){
  if(!body.includes(RENDER)||!body.includes(OLD))throw new Error('renderer owners missing');
  body=body.replace(RENDER,HELPER+RENDER);
  body=body.replace(OLD,NEW);
  return body;
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
   await page.waitForTimeout(150);
   out[q]=await page.evaluate(()=>{
     const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
     const cores=[...document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path.earthline-swale-core-16168')];
     const lens=cores.map(p=>{try{return p.getTotalLength()}catch(_){return 0}}).sort((a,b)=>a-b);
     return {
       scienceCount:Number(d?.derived?.swaleOpportunityLines||0),
       renderedCoreCount:cores.length,
       p95Px:Number((lens[Math.floor(lens.length*.95)]||0).toFixed(1)),
       maxPx:Number((lens.at(-1)||0).toFixed(1))
     };
   });
 }
 await browser.close();return {out,errors};
}
const current=await run(false),candidate=await run(true);
if(candidate.errors.length)throw new Error('candidate page errors '+JSON.stringify(candidate.errors));
for(const q of Object.keys(current.out)){
 const a=current.out[q],b=candidate.out[q];
 if(b.scienceCount!==a.scienceCount)throw new Error(q+' science count changed');
 if(b.renderedCoreCount!==a.renderedCoreCount)throw new Error(q+' rendered count changed');
 if(!(b.maxPx<a.maxPx*.65))throw new Error(q+' visible worm length did not contract enough '+a.maxPx+' -> '+b.maxPx);
}
console.log('M83_RENDERER_CROP_PASS '+JSON.stringify({current:current.out,candidate:candidate.out}));
