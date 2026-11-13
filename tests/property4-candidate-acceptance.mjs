import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
fs.mkdirSync('artifacts/property4-candidate',{recursive:true});
const BASE='https://earthlinedevelopment.org/';
const targetBlob='1c3ad17464c54cd6c9d8656fb5e3a0a792d776ac';
const cases=[
 {name:'Iowa',lat:42.13,lng:-93.68},
 {name:'Arizona',lat:34.21593,lng:-111.93665}
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const output=[];
for(const site of cases){
 const ctx=await browser.newContext({viewport:{width:1500,height:900}});
 const page=await ctx.newPage();
 const errs=[];
 page.on('pageerror',e=>errs.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await page.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.origin!==new URL(BASE).origin)return route.continue();
   const rel=decodeURIComponent(u.pathname).replace(/^[/]+/, '')||'index.html';
   const local=path.resolve(process.cwd(),rel);
   if(!local.startsWith(process.cwd()+path.sep))return route.abort();
   if(fs.existsSync(local)&&fs.statSync(local).isFile()){
     const ext=path.extname(local).toLowerCase();
     const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
     return route.fulfill({status:200,contentType:mime[ext]||'application/octet-stream',body:fs.readFileSync(local)});
   }
   return route.continue();
 });
 let outcome={site,errors:errs};
 try{
  await page.goto(BASE+'?candidate_property4='+site.name,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof window.earthlineSetPropertyTarget16201==='function'&&typeof window.earthlineDeclarePropertyAtCrosshair16173==='function',{},{timeout:60000});
  await page.waitForSelector('#earthlineDeclareProperty16169',{state:'attached',timeout:60000});
  await page.evaluate(t=>{
    const map=(typeof earthlineMap!=='undefined'?earthlineMap:null);
    map?.jumpTo?.({center:[t.lng,t.lat],zoom:17});
    window.earthlineSetPropertyTarget16201({lat:t.lat,lng:t.lng,source:'candidate-acceptance'},{openPanel:false});

  },site);
  await page.click('#earthlineDeclareProperty16169',{timeout:10000}); // real pointer click, exactly once
  let timeout=false;
  try{await page.waitForFunction(()=>{
    const m=(typeof M!=='undefined'?M:window.M);
    return m?.propertyPublication15816?.committed===true||m?.propertyPublication15816?.blocked===true;
  },null,{timeout:130000,polling:500})}
  catch{timeout=true}
  await page.waitForTimeout(2500); // permit independently published terrain/label overlays to settle
  outcome=await page.evaluate(t=>{
    const m=(typeof M!=='undefined'?M:window.M);
    const p=m?.propertyPublication15816||null;
    const map=(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const source=id=>{try{return map?.getSource?.(id)}catch{return null}};
    const count=id=>{let x=source(id);return x?._data?.features?.length??null};
    const layer=id=>{try{return map?.getLayoutProperty?.(id,'visibility')??null}catch{return null}};
    const drawn=id=>{try{return map?.getLayer?.(id)?map.queryRenderedFeatures({layers:[id]}).length:0}catch{return 0}};
    return {site:t,pub:p,swales:m?.swales?.length,vector:m?.vectorNoBuildCoverage||null,
       tier:document.documentElement.dataset.earthlineAnalysisTier,demSource:m?.demSource,
       gauge:document.querySelector('.earthline-recharge-gauge-label-16488')?.textContent,
       contoursAudit:window.earthlineElevationAudit15776?.()||null,drawnElevationLabels:drawn('earthline-official-contour-label-15776'),recharge:count('earthline-recharge-zones'),
       owner:m?.rendererOwnership15805||null,layerVisibility:{
         contours:layer('earthline-official-contour-major-15776'),elevationLabels:layer('earthline-official-contour-label-15776'),recharge:layer('earthline-recharge-line')
       },generation:m?.searchGen};
  },site);
  outcome.timeout=timeout;
  outcome.errors=errs;
  await page.screenshot({path:'artifacts/property4-candidate/'+site.name.toLowerCase()+'.png',timeout:20000});
 }catch(e){outcome.failure=String(e);outcome.errors=errs;}
 output.push(outcome);
 console.log('PROPERTY4_CANDIDATE_CASE '+JSON.stringify(outcome));
 await ctx.close();
}
await browser.close();
const passed=output.every(o=>!o.failure&&!o.timeout&&o.pub?.committed===true&&o.pub?.safetyVerified===true&&o.gauge==='Recharge Potential'&&!/procedural|generated screening fallback/i.test(String(o.demSource||''))&&o.contoursAudit?.sourcePresent===true&&o.contoursAudit?.majorPresent===true&&o.contoursAudit?.labelPresent===true&&o.layerVisibility?.contours!=='none'&&o.layerVisibility?.elevationLabels!=='none'&&!(o.errors||[]).some(e=>/Uncaught|ReferenceError/i.test(e)))&&output[0].pub.safeSegments>0&&output[1].drawnElevationLabels>0&&output.every(o=>o.recharge>0);
const result={targetBlob,passed,output};
fs.writeFileSync('artifacts/property4-candidate/result.json',JSON.stringify(result,null,2));
console.log('PROPERTY4_CANDIDATE_RESULT '+JSON.stringify({passed,sites:output.map(o=>({name:o.site?.name,timeout:o.timeout,swales:o.swales,segments:o.pub?.safeSegments,blocked:o.pub?.blocked,reason:o.pub?.blockReason,gauge:o.gauge}))}));
if(!passed)process.exitCode=1;