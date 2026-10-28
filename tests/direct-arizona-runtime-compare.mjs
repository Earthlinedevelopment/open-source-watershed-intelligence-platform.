import { chromium } from 'playwright';
import { execSync } from 'child_process';
const TARGET={lng:-111.93331,lat:34.21526};
const VERSIONS=[['preM79','4146c7f7798527b7df65df149cb39ed28aa6b4a0'],['fourPct','8edc226dfd1e9525c8b889bd39b06e1c8c4df61f'],['current','HEAD']];
for(const [name,ref] of VERSIONS){
 const html=execSync(ref==='HEAD'?'cat index.html':`git show ${ref}:index.html`,{maxBuffer:20*1024*1024}).toString();
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1798,height:831}});
 const page=await context.newPage();
 let docDone=false;
 await page.route('https://earthlinedevelopment.org/**',async route=>{
   const req=route.request();
   if(!docDone&&req.resourceType()==='document'){docDone=true;await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});}
   else await route.continue();
 });
 try{
   await page.goto('https://earthlinedevelopment.org/?direct_hist='+name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForSelector('#earthlineDeclareProperty16169',{timeout:30000});
   if(name==='current'){
     await page.evaluate(()=>{
       window.slopePct=function(x,y){
         const xi=Number(x),yi=Number(y);
         function constructionGrad16289(px,py){
           const cell=Math.max(.001,Number(M.cellM||1));
           const r=Math.max(1,Math.min(8,Math.round(7.5/cell)));
           const xx=Math.round(px),yy=Math.round(py);
           const x0=clamp(xx-r,0,GW-1),x1=clamp(xx+r,0,GW-1);
           const y0=clamp(yy-r,0,GH-1),y1=clamp(yy+r,0,GH-1);
           const gx=(M.h[idx(x1,yy)]-M.h[idx(x0,yy)])/Math.max(cell,(x1-x0)*cell);
           const gy=(M.h[idx(xx,y1)]-M.h[idx(xx,y0)])/Math.max(cell,(y1-y0)*cell);
           return [gx,gy];
         }
         const originalMemoKey=window.earthlineSlopeMemoKey16288;
         window.earthlineSlopeMemo16288=null; window.earthlineSlopeMemoKey16288='';
         const fn=function(x,y){
           const xi=Number(x),yi=Number(y);
           if(Number.isInteger(xi)&&Number.isInteger(yi)&&xi>=0&&yi>=0&&xi<GW&&yi<GH){
             const[gx,gy]=constructionGrad16289(xi,yi); return Math.hypot(gx,gy)*100;
           }
           const[gx,gy]=constructionGrad16289(x,y); return Math.hypot(gx,gy)*100;
         };
         window.slopePct=fn;
       });
   }
   await page.evaluate(t=>{
     const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
     if(!m)throw new Error('map unavailable');
     m.jumpTo({center:[t.lng,t.lat],zoom:16.59});try{m.fire?.('dragend')}catch(_){}
   },TARGET);
   await page.waitForTimeout(700);
   const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
   await page.locator('#earthlineDeclareProperty16169').click({timeout:10000});
   await page.waitForFunction(prev=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return !!a&&Number(a.serial||0)>prev&&a.settled===true},before,{timeout:90000,polling:120});
   await page.waitForTimeout(800);
   const out=await page.evaluate(()=>{
     const md=(typeof M!=='undefined'&&M)||window.M||{};
     return {
       swales:Number(md.authoritativeSafeSwales15815?.features?.length||0),
       raw:Number(md.authoritativePropertySwales15800?.features?.length||0),
       safeCells:Number(md.earthlineTraceSafeCache16320?.safeCells),
       maxS:Number(md.earthlineTraceSafeCache16320?.maxS),
       slopeSafePct:Number(md.swaleDiagnostics?.slopeSafePct),
       usablePct:Number(md.swaleDiagnostics?.usablePct),
       eligiblePaths:Number(md.flowFirstPlacement15836?.eligiblePaths||0),
       pathsServed:Number(md.flowFirstPlacement15836?.pathsServed||0),
       run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null
     };
   });
   console.log('EARTHLINE_DIRECT_HISTORY '+JSON.stringify({name,ref,out}));
 }catch(e){console.log('EARTHLINE_DIRECT_HISTORY '+JSON.stringify({name,ref,error:String(e&&e.message||e)}));}
 await browser.close();
}