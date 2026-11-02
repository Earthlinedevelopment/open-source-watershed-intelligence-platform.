import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const BASE='https://earthlinedevelopment.org/';
const variants=[
 {name:'before',file:'artifacts/mantra92-visual/before.html'},
 {name:'corrected',file:'artifacts/mantra92-visual/corrected.html'}
];
mkdirSync('artifacts/mantra92-visual/results',{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];
for(const variant of variants){
 const html=readFileSync(variant.file,'utf8');
 const ctx=await browser.newContext({viewport:{width:1800,height:832}});
 const page=await ctx.newPage();const errors=[],http=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(BASE))http.push({status:r.status(),url:r.url()})});
 await page.route('**/*',async route=>{
   const req=route.request();
   if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE))
     return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
   return route.continue();
 });
 let failure=null;const started=Date.now();
 try{
   await page.goto(BASE+'?az_m92_visual='+variant.name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForSelector('#searchInput',{timeout:15000});
   await page.evaluate(()=>{
     const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
     i.value='Arizona';i.dispatchEvent(new Event('input',{bubbles:true}));
     i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
   });
   await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
     !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
   await page.waitForTimeout(950);
 }catch(e){failure=String(e)}
 const snap=await page.evaluate(()=>{
   const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},
     pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{},
     pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||{};
   const group=document.querySelector('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"]');
   const paths=[...(group?.querySelectorAll('path')||[])];
   const details=paths.map(el=>{
     const style=getComputedStyle(el),sw=Number.parseFloat(style.strokeWidth)||0;
     let width=null,length=null;
     try{width=el.getBBox().width;length=el.getTotalLength()}catch{}
     return {kind:el.getAttribute('class')||'',attrStroke:el.getAttribute('stroke')||'',color:style.stroke,
       opacity:style.strokeOpacity,sw,width,length,cap:style.strokeLinecap};
   });
   const cores=details.filter(x=>x.kind.includes('earthline-swale-core-16168'));
   const black=details.filter(x=>x.attrStroke==='rgba(8,18,13,.96)');
   const blackHuge=black.filter(x=>x.sw>=10&&x.width!==null&&x.width<3);
   const source=(()=>{try{
     const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
     const s=map?.getSource?.('el-live-swales-15970');return s?._data||s?.serialize?.()?.data||null;
   }catch{return null}})();
   const fs=source?.features||[];
   return {coreMs:perf.phaseTotalsMs?.coreTotalMs??null,profile:pkg.profileId||null,
      swales:pub.generated??null,sourceCount:pub.sourceFeatures??null,
      displayed:pub.overlaySwaleLines??null,waterPaths:perf.waterPaths??null,
      canvasCount:document.querySelectorAll('canvas').length,
      source:fs.map(f=>({geometry:f.geometry,grade:f.properties?.grade,slope:f.properties?.slope_pct})),
      coreCount:cores.length,maxCoreWidth:Math.max(0,...cores.map(x=>x.sw)),
      blackCount:black.length,maxBlackWidth:Math.max(0,...black.map(x=>x.sw)),
      blackHuge:blackHuge.length,firstBlack:black.slice(0,5),
      firstCore:cores.slice(0,5),overlayPresent:!!group,
      fatal:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
 }).catch(e=>({evaluationError:String(e)}));
 const geometryHash=createHash('sha256').update(JSON.stringify(snap.source||[])).digest('hex');
 const row={variant:variant.name,elapsedMs:Date.now()-started,coreMs:snap.coreMs,profile:snap.profile,
    swales:snap.swales,sourceCount:snap.sourceCount,displayed:snap.displayed,waterPaths:snap.waterPaths,
    coreCount:snap.coreCount,maxCoreWidth:snap.maxCoreWidth,blackCount:snap.blackCount,
    maxBlackWidth:snap.maxBlackWidth,blackHuge:snap.blackHuge,firstBlack:snap.firstBlack,
    firstCore:snap.firstCore,geometryHash,failure,errors,http,
    fatal:snap.fatal,evaluationError:snap.evaluationError};
 rows.push(row);console.log('M92_VISUAL_COMPARE '+JSON.stringify(row));
 await page.screenshot({path:'artifacts/mantra92-visual/results/'+variant.name+'.png'}).catch(()=>{});
 await ctx.close();
}
await browser.close();
writeFileSync('artifacts/mantra92-visual/results/compare.json',JSON.stringify(rows,null,2));
const [before,after]=rows;
const fails=[];
if(rows.some(x=>x.failure||x.errors.length||x.fatal||x.evaluationError))fails.push('browser error');
if(before.geometryHash!==after.geometryHash)fails.push('science geometry changed');
if(!(after.swales>0)||after.swales!==before.swales||after.sourceCount!==after.swales||after.displayed!==after.swales)fails.push('source/display parity');
if(after.coreCount!==after.swales)fails.push('visible core feature parity');
if(!(after.blackHuge===0&&after.maxBlackWidth<10))fails.push('black dot/overwide casing persists');
if(!(after.maxCoreWidth<=10))fails.push('overwide colored core remains');
if(!(after.coreMs<=15000))fails.push('Arizona >15sec');
console.log('M92_VISUAL_VERDICT '+JSON.stringify({pass:fails.length===0,fails,swales:after.swales,
  beforeBlackHuge:before.blackHuge,afterBlackHuge:after.blackHuge,beforeBlackMax:before.maxBlackWidth,
  afterBlackMax:after.maxBlackWidth,geometrySame:before.geometryHash===after.geometryHash}));
if(fails.length)process.exitCode=1;
