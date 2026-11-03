import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,existsSync,statSync,readFileSync} from 'node:fs';
import path from 'node:path';
mkdirSync('artifacts/m97-candidate-properties',{recursive:true});
const places=[
 {name:'Iowa-farmland',search:'Iowa',lng:-93.52,lat:42.08},
 {name:'Texas-plain',search:'Texas',lng:-96.47,lat:29.2},
 {name:'Vermont-valley',search:'Vermont',lng:-72.97,lat:43.60}
];
const browser=await chromium.launch({headless:true});
const result=[];
for(const pt of places){
 const page=await browser.newPage({viewport:{width:1600,height:950}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.origin!=='https://earthlinedevelopment.org')return route.continue();
  let rel;try{rel=decodeURIComponent(u.pathname).replace(/^\/+/,'')||'index.html'}catch{return route.abort()}
  const root=process.cwd(),local=path.resolve(root,rel);
  if(local!==root&&!local.startsWith(root+path.sep))return route.abort();
  if(!existsSync(local)||!statSync(local).isFile())return route.abort();
  const ext=path.extname(local).toLowerCase();
  const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.geojson':'application/geo+json','.css':'text/css','.png':'image/png','.webp':'image/webp'};
  return route.fulfill({status:200,contentType:types[ext]||'application/octet-stream',body:readFileSync(local)});
 });

 try{
  await page.goto('https://earthlinedevelopment.org/?m97flat='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#searchInput').fill(pt.search);
  await page.locator('#runBtn').click();
  await page.waitForFunction(()=>window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated>0||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:60000,polling:200});
  const regional=await page.evaluate(()=>({count:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated,error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970}));
  if(regional.error)throw Error('Regional '+JSON.stringify(regional.error));
  await page.evaluate(pos=>{const mp=(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap);mp.stop();mp.jumpTo({center:[pos.lng,pos.lat],zoom:17.7});},pt);
  await page.waitForTimeout(2000);
  const chosen=await page.evaluate(()=>window.EARTHLINE_PROPERTY_TARGET_16201);
  await page.locator('#earthlineDeclareProperty16169').click({timeout:8000});
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&document.documentElement.dataset.earthlinePropertyRunState!=='running',null,{timeout:70000,polling:160});
  await page.waitForTimeout(1300);
  const snap=await page.evaluate(({pt,regional,chosen})=>{
   const m=typeof M!=='undefined'?M:window.M;
   const d=m?.swaleDiagnostics||{},g=d.levelGenerator||{};
   const stage=d.stage||{};
   let inParcel=0,safeActual=0,excluded=0,safeUnmasked=0;
   let maxS=0;
   if(m?.inP&&typeof slopePct==='function')for(let y=2;y<144;y++)for(let x=2;x<208;x++){
    const i=x+y*210;if(!m.inP[i])continue;inParcel++;
    let s=Number(slopePct(x,y));if(s>maxS&&Number.isFinite(s))maxS=s;
    if(m.noBuildMask?.[i])excluded++;
    if(s<=4){safeActual++;if(!m.noBuildMask?.[i])safeUnmasked++}
   }
   return {name:pt.name,pt,chosen,actual:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.center,regional,
    result:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.result,tier:document.documentElement.dataset.earthlineAnalysisTier,
    engine:m?.swales?.length,finalSafe:m?.authoritativeSafeSwales15815?.features?.length,
    reason:m?.prescriptionZeroReason15870,halt:m?.prescriptionHalt15870,
    auditedSlopeSafe33:d.slopeSafe, auditedUsable33:d.usable, noBuildPct:d.noBuildPct,
    actual4pct:{parcel:inParcel,safe:safeActual,safeUnmasked,excluded,maxSlope:maxS},
    generation:{levels:stage.levels,seeds:stage.seeds,traces:stage.traces,segments:stage.segments,candidates:stage.candidates,final:stage.final,rejectShort:stage.rejectShort,rejectConversion:stage.rejectConversion},
    height:{range:g.heightRange,rawCount:g.rawFiniteCount,eligibleSafe:g.safeCount,skippedSlope:g.skippedSlope,skippedNoBuild:g.skippedNoBuild,assertion:g.assertion},
    seedIndex:window.EARTHLINE_SEED_LEVEL_INDEX_16460||null,
    maskProvenance:m?.noBuildProvenance15843||null,
    scientificSafety:m?.safetyAudit15806||null,
    elapsed:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.elapsedSeconds,
    status:document.getElementById('earthlineVermontStatus16147')?.textContent?.slice(0,200)};
  },{pt,regional,chosen});
  result.push({...snap,errors});console.log('M97_CANDIDATE_PROP '+JSON.stringify({...snap,errors}));
 }catch(e){result.push({name:pt.name,error:String(e),errors});console.log('M97_CANDIDATE_ERROR '+pt.name+' '+String(e));}
 await page.close();
}
const base={'Iowa-farmland':54,'Texas-plain':7,'Vermont-valley':8};
const checks=result.map(x=>({name:x.name,generated:x.finalSafe,baseline:base[x.name],actualSlopeSafe:x.actual4pct?.safe,maskWater:x.maskProvenance?.noBuildCellsFromWater,maskTotal:x.maskProvenance?.noBuildCellsAfterDilation,channelThreshold:x.maskProvenance?.terrainOnlyProtectedChannelThresholdCells,
 pass:!!x.result&&x.finalSafe>0&&x.actual4pct?.safe>0&&x.scientificSafety?.verified===true&&Number(x.maskProvenance?.terrainOnlyProtectedChannelThresholdCells)>0&&x.finalSafe>=base[x.name]}));
const improved=checks.some(x=>x.generated>x.baseline);
console.log('M97_CANDIDATE_COUNTS '+JSON.stringify({checks,improved,pass:checks.every(x=>x.pass)&&improved}));
writeFileSync('artifacts/m97-candidate-properties/audit.json',JSON.stringify({result,checks,improved},null,2));
if(!checks.every(x=>x.pass)||!improved)process.exitCode=1;
await browser.close();
if(result.some(x=>x.error))process.exitCode=1;