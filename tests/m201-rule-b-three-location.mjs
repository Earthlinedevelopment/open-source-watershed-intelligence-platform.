import {chromium} from 'playwright';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const URL='https://earthlinedevelopment.org/';
const targets=[
{name:'vermont',lng:-72.45147,lat:43.88279},
{name:'iowa',lng:-93.68000,lat:42.13000},
{name:'arizona',lng:-111.93073,lat:34.21572}
];
const patch=readFileSync('index.html','utf8');
mkdirSync('artifacts/m201',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const rows=[];
async function run(name,target,patched){
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 if(patched){
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(['earthlinedevelopment.org','www.earthlinedevelopment.org'].includes(u.hostname)&&u.pathname==='/'&&route.request().resourceType()==='document'){
     await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:patch});return;
   }
   await route.continue();
  });
 }
 let info={name,mode:patched?'candidate':'live',url:URL};
 try{
 await page.goto(URL+'?m201='+name+'_'+(patched?'candidate':'live'),{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForSelector('#searchInput',{timeout:40000});
 const prep=await page.evaluate(async target=>{
   const md=typeof M!=='undefined'?M:window.M;
   const site=window.earthlineSelectedSiteFromCenter?.(md?.loc||null,target.lng,target.lat,20);
   if(!site)return {ok:false,error:'site unavailable'};
   const applied=await window.applyLocation?.(site,null,md.searchGen,{analyzeNow:false,preserveMapView:false});
   if(!applied)return {ok:false,error:'applyLocation rejected'};
   await new Promise(r=>setTimeout(r,800));
   const set=window.earthlineSetPropertyTarget16201?.({lng:target.lng,lat:target.lat,source:'m201-acceptance'},{openPanel:false});
   return {ok:!!set};
 },target);
 if(!prep.ok)throw new Error('prepare: '+JSON.stringify(prep));
 await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169?.());
 try{await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:70000,polling:250});}catch(e){errors.push('property settle timeout')}
 await page.waitForTimeout(1200);
 const diag=await page.evaluate(()=>{
  const md=typeof M!=='undefined'?M:window.M;
  const sw=Array.isArray(md?.swales)?md.swales:[];
  const sl=sw.map(s=>Number(s.slope)).filter(Number.isFinite);
  const fc=md?.authoritativeSafeSwales15815;
  const features=fc?.features||[];
  const fs=features.map(f=>Number(f?.properties?.slope)).filter(Number.isFinite);
  const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
  const run=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
  return {engineCount:sw.length,engineSlopeCount:sl.length,maxEngineMeanSlope:sl.length?Math.max(...sl):null,
    publishedFeatureCount:features.length,publishedSlopeCount:fs.length,maxPublishedMeanSlope:fs.length?Math.max(...fs):null,
    featureSampleProperties:features[0]?.properties||null,engineSample:sw[0]?{slope:sw[0].slope,id:sw[0].id}:null,
    publication:p,run,elderCount:Number(elder?.featureCount||0),elderState:elder?.state||null,
    safe:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
    tier:String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'')};
 });
 info={...info,...diag,errors};
 await page.screenshot({path:'artifacts/m201/'+name+'-'+(patched?'candidate':'live')+'.png'}).catch(()=>{});
 }catch(e){info.errors=[...errors,String(e)];}
 rows.push(info);console.log('M201_ROW '+JSON.stringify(info));
 await page.close();
}
for(const target of targets){await run(target.name,target,false);await run(target.name,target,true)}
await browser.close();
writeFileSync('artifacts/m201/results.json',JSON.stringify(rows,null,2));
const candidates=rows.filter(r=>r.mode==='candidate');
const pass=candidates.length===3&&candidates.every(r=>r.run?.settled===true&&r.run?.result===true&&r.publication?.published===true&&r.publishedFeatureCount>0&&r.engineSlopeCount>0&&r.maxEngineMeanSlope<=4&&r.errors?.length===0);
console.log('M201_CANDIDATE_GATE '+JSON.stringify({pass,targets:candidates.map(r=>({name:r.name,swales:r.publishedFeatureCount,maxSlope:r.maxEngineMeanSlope,elders:r.elderCount,errors:r.errors}))}));
if(!pass)process.exitCode=1;
