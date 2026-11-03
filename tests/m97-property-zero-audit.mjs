import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('artifacts/m97-prescriber',{recursive:true});
const points=[
 {name:'zero-crosshair',lng:-111.9308665,lat:34.2159246},
 {name:'working-control',lng:-111.93066,lat:34.21568},
 {name:'nearby-west',lng:-111.93212,lat:34.21532},
 {name:'nearby-south',lng:-111.93025,lat:34.21492}
];
const browser=await chromium.launch({headless:true});
const p=await browser.newPage({viewport:{width:1600,height:950}});
const errors=[];p.on('pageerror',e=>errors.push(String(e)));
const rows=[];
try{
 await p.goto('https://earthlinedevelopment.org/?m97actual='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await p.locator('#searchInput').fill('Arizona');
 await p.locator('#runBtn').click();
 await p.waitForFunction(()=>window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated>0,null,{timeout:55000});
 for(const pt of points){
   let err=null;
   try{
     await p.evaluate(pos=>{const m=(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap);m.stop();m.jumpTo({center:[pos.lng,pos.lat],zoom:17.7});},pt);
     await p.waitForTimeout(1800);
     const before=await p.evaluate(()=>window.EARTHLINE_PROPERTY_TARGET_16201);
     await p.locator('#earthlineDeclareProperty16169').click({timeout:8000});
     await p.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&document.documentElement.dataset.earthlinePropertyRunState!=='running',null,{timeout:65000});
     await p.waitForTimeout(1700);
     const snap=await p.evaluate(({pt,before})=>{
       const m=typeof M!=='undefined'?M:window.M;
       const stage=m?.swaleDiagnostics?.stage||{};
       const d=m?.swaleDiagnostics||{};
       const fc=m?.authoritativeSafeSwales15815?.features||[];
       const mask=m?.noBuildMask;
       const inside=m?.inP;
       const pond=m?.pond;
       let numIn=0,numExcluded=0,numPond=0,numFinite=0;
       if(inside){for(let i=0;i<inside.length;i++){if(inside[i]){numIn++;if(mask?.[i])numExcluded++;if(pond?.[i])numPond++;if(Number.isFinite(m?.h?.[i]))numFinite++}}}
       return {name:pt.name,requested:pt,before:{lng:before?.lng,lat:before?.lat},actualTarget:window.EARTHLINE_PROPERTY_TARGET_16201,runCenter:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.center,
         tier:document.documentElement.dataset.earthlineAnalysisTier,
         result:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.result,
         outcome:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.stage,
         engineSwales:m?.swales?.length,rawEngineSwales:m?.rawPropertyEngineSwales16176?.length,
         publishedSafe:fc.length,prescriptionZeroReason:m?.prescriptionZeroReason15870||null,
         halt:m?.prescriptionHalt15870||null,
         diagnostics:{stage,slopeSafe:d.slopeSafe,usable:d.usable,levels:d.levelGenerator,performance:d.performanceBudget,timeBudgetReached:d.timeBudgetReached,flowFirst:m?.flowFirstPlacement15836&&{eligible:m.flowFirstPlacement15836.eligiblePaths,evaluated:m.flowFirstPlacement15836.pathsEvaluated,served:m.flowFirstPlacement15836.pathsServed,unserved:m.flowFirstPlacement15836.unserved?.slice(0,8)},coverageDiagnostics:m?.coverageDiagnostic15803?.termination||null},
         raster:{inside:numIn,excluded:numExcluded,pond:numPond,finite:numFinite,cellM:m?.cellM,terrainSource:m?.demSource},
         terrainHandoff:m?.terrainHandoff15791?.last||null,
         screeningEvidence:m?.vectorNoBuildCoverage&&{sourceTier:m.vectorNoBuildCoverage.sourceTier,acquisition:m.vectorNoBuildCoverage.acquisitionResult,publicationAllowed:m.vectorNoBuildCoverage.publicationAllowed},
         safePublication:m?.propertyPublication15816,
         status:document.getElementById('earthlineVermontStatus16147')?.textContent?.trim()?.slice(0,250)
       };
     },{pt,before});
     rows.push(snap);console.log('M97_PROPERTY_ZERO_AUDIT '+JSON.stringify(snap));
   }catch(e){err=String(e);rows.push({name:pt.name,error:err});console.log('M97_FAILURE '+pt.name+' '+err);}
 }
}catch(e){errors.push(String(e));}
writeFileSync('artifacts/m97-prescriber/multiple-property-results.json',JSON.stringify({rows,errors},null,2));
console.log('M97_SUMMARY '+JSON.stringify({rows:rows.map(x=>({name:x.name,engine:x.engineSwales,safe:x.publishedSafe,zero:x.prescriptionZeroReason,reasons:x.diagnostics?.stage,error:x.error})),errors}));
await browser.close();
if(errors.length||rows.some(x=>x.error))process.exitCode=1;