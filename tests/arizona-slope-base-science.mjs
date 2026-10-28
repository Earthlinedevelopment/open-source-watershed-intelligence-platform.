import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831}});
if(process.env.EARTHLINE_CANDIDATE_ORIGIN==='1')await installCandidateOrigin(context);
const page=await context.newPage();
await page.goto(URL+'?az_slope_base_science='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(700);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click({timeout:10000}).catch(()=>{});
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,null,{timeout:90000,polling:150});

const target={lng:-111.93331,lat:34.21526};
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.evaluate(t=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(!m)throw new Error('map unavailable');
  m.jumpTo({center:[t.lng,t.lat],zoom:16.59});
  try{m.fire?.('dragend')}catch(_){}
},target);
await page.waitForTimeout(450);
await page.locator('#earthlineDeclareProperty16169').click({timeout:10000});
await page.waitForFunction(prev=>{
 const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
 return !!a&&Number(a.serial||0)>prev&&a.settled===true;
},before,{timeout:90000,polling:120});

const out=await page.evaluate(()=>{
 const radii=[1,2,3,4,6,8];
 const pct=(a,n)=>n?100*a/n:0;
 const med=a=>{const s=a.slice().sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:null};
 function slopeR(x,y,r){
   if(x-r<0||x+r>=GW||y-r<0||y+r>=GH)return NaN;
   const cell=Math.max(.001,Number(M.cellM||1));
   const gx=(Number(M.h[idx(x+r,y)])-Number(M.h[idx(x-r,y)]))/(2*r*cell);
   const gy=(Number(M.h[idx(x,y+r)])-Number(M.h[idx(x,y-r)]))/(2*r*cell);
   return Math.hypot(gx,gy)*100;
 }
 function baseEligible(i,x,y){
   if(!M.inP?.[i]||M.pond?.[i])return false;
   if(M.noBuildMask?.[i])return false;
   try{if(earthlineMajorChannelUnsafeAt16288(x,y))return false}catch(_){}
   return true;
 }
 function components(mask){
   const seen=new Uint8Array(N);let count=0,largest=0;
   const qx=new Int16Array(N),qy=new Int16Array(N);
   for(let y=1;y<GH-1;y++)for(let x=1;x<GW-1;x++){
     const i=idx(x,y);if(!mask[i]||seen[i])continue;
     count++;let h=0,t=0,size=0;qx[t]=x;qy[t]=y;t++;seen[i]=1;
     while(h<t){const cx=qx[h],cy=qy[h];h++;size++;
       for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
         const nx=cx+dx,ny=cy+dy;if(nx<=0||ny<=0||nx>=GW-1||ny>=GH-1)continue;
         const ni=idx(nx,ny);if(seen[ni]||!mask[ni])continue;
         seen[ni]=1;qx[t]=nx;qy[t]=ny;t++;
       }
     }
     largest=Math.max(largest,size);
   }
   return {count,largest};
 }
 const stats={};
 for(const r of radii){
   const vals=[],mask=new Uint8Array(N);let base=0,under4=0;
   for(let y=Math.max(2,r);y<GH-Math.max(2,r);y++)for(let x=Math.max(2,r);x<GW-Math.max(2,r);x++){
     const i=idx(x,y);if(!baseEligible(i,x,y))continue;base++;
     const s=slopeR(x,y,r);if(!Number.isFinite(s))continue;vals.push(s);
     if(s<=4){under4++;mask[i]=1;}
   }
   const c=components(mask);
   stats[r]={baselineM:Number((2*r*Math.max(.001,Number(M.cellM||1))).toFixed(2)),baseCells:base,medianSlopePct:med(vals),under4Cells:under4,under4Pct:pct(under4,base),components:c.count,largestComponentCells:c.largest,largestComponentAreaM2:Number((c.largest*Math.pow(Number(M.cellM||1),2)).toFixed(1))};
 }
 return {
   cellM:Number(M.cellM||0),
   currentSlopeSafePct:Number(M.swaleDiagnostics?.slopeSafePct),
   currentUsablePct:Number(M.swaleDiagnostics?.usablePct),
   currentSafeCells:Number(M.earthlineTraceSafeCache16320?.safeCells),
   currentSwales:Number(M.authoritativeSafeSwales15815?.features?.length||0),
   eligiblePaths:Number(M.flowFirstPlacement15836?.eligiblePaths||0),
   pathsServed:Number(M.flowFirstPlacement15836?.pathsServed||0),
   stats
 };
});
console.log('EARTHLINE_AZ_SLOPE_BASE_SCIENCE '+JSON.stringify(out));
await browser.close();
