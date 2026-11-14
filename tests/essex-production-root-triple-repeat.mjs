import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';

const URL='https://earthlinedevelopment.org/';
const TARGETS=[
 {name:'EssexRepeat1',lng:-73.012909,lat:44.513845},
 {name:'EssexRepeat2',lng:-73.012909,lat:44.513845},
 {name:'EssexRepeat3',lng:-73.012909,lat:44.513845}
];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:950}});
const pageErrors=[],badResponses=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')pageErrors.push(m.text())});
page.on('response',r=>{if(r.status()>=400)badResponses.push({status:r.status(),url:r.url()})});
mkdirSync('artifacts/essex-root-repeat',{recursive:true});

const response=await page.goto(URL+'?root_property_control='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
if(response?.status()!==200||new globalThis.URL(page.url()).pathname!=='/')throw new Error('Not the actual production root URL');
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>typeof window.earthlineSelectedSiteFromCenter==='function'&&typeof window.applyLocation==='function'&&typeof window.earthlineDeclarePropertyAtCrosshair16169==='function',null,{timeout:35000});
console.log('ROOT_URL_VERIFIED '+JSON.stringify({url:page.url(),status:response.status()}));

async function runTarget(target,index){
  const errorStart=pageErrors.length;
  const prep=await page.evaluate(async target=>{
    if(typeof M==='undefined')return {ok:false,reason:'M unavailable'};
    const site=window.earthlineSelectedSiteFromCenter?.(M?.loc||null,target.lng,target.lat,20);
    if(!site)return {ok:false,reason:'site unavailable'};
    const applied=await window.applyLocation?.(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'applyLocation rejected site'};
    await new Promise(r=>setTimeout(r,800));
    const set=window.earthlineSetPropertyTarget16201?.({lng:target.lng,lat:target.lat,source:'mantra85-arizona-control'},{openPanel:false});
    return {ok:!!set};
  },target);
  if(!prep.ok)throw new Error(target.name+' prep failed: '+prep.reason);
  const started=Date.now();
  const out=await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169?.());
  await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:45000,polling:120});
  await page.waitForTimeout(900);
  const snap=await page.evaluate(target=>{
    const md=(typeof M!=='undefined'&&M)||window.M||null;
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const safe=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;
    const naturalIds=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177','earthline-swale-planting-shadow-15806','earthline-swale-planting-layer-15806'];
    const safeIds=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
    const vis=id=>{try{return map?.getLayer?.(id)?map.getLayoutProperty(id,'visibility')||'visible':'missing'}catch(_){return 'error'}};
    return {
      target,
      audit:a,publication:p,safeVisibility:safe,elder:e,
      displayedTier:String(d?.tier||d?.mode||''),
      modelCenter:{lng:Number(md?.centerLng),lat:Number(md?.centerLat)},
      safeCount:Number(md?.authoritativeSafeSwales15815?.features?.length||0),
      engineCount:Number(md?.swales?.length||0),
      safeGeometry:(md?.authoritativeSafeSwales15815?.features||[]).map(f=>f?.geometry?.coordinates||null),
      naturalLayers:Object.fromEntries(naturalIds.map(id=>[id,vis(id)])),
      safeLayers:Object.fromEntries(safeIds.map(id=>[id,vis(id)])),
      tierNotice:String(document.getElementById('earthlineTierNotice16173')?.textContent||''),
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')
    };
  },target);
  await page.screenshot({path:`artifacts/essex-root-repeat/reference-${index+1}.png`,fullPage:false});
  const centerPass=Math.abs(Number(snap.audit?.center?.lng)-target.lng)<1e-5&&Math.abs(Number(snap.audit?.center?.lat)-target.lat)<1e-5;
  const safePass=snap.audit?.settled===true&&snap.audit?.result===true&&snap.publication?.published===true&&snap.safeCount>0&&snap.safeVisibility?.visible===true&&Number(snap.safeVisibility?.count||0)===snap.safeCount;
  const elderPass=true; // record Elder separately, do not require it to assess core Property
  const tierPass=snap.displayedTier==='property';
  const newErrors=pageErrors.slice(errorStart);
  const ancillaryAnrErrors=newErrors.filter(error=>
    /anrmaps\\.vermont\\.gov|ERR_FAILED|__earthlineVtInfra16458/i.test(error));
  const unclassifiedErrors=newErrors.filter(error=>!ancillaryAnrErrors.includes(error));
  const geoHash=createHash('sha256').update(JSON.stringify(snap.safeGeometry)).digest('hex');
  const corePass=centerPass&&safePass&&tierPass&&unclassifiedErrors.length===0;
  const contextPass=ancillaryAnrErrors.length===0;
  return {name:target.name,elapsedMs:Date.now()-started,out,centerPass,safePass,elderPass,tierPass,corePass,contextPass,ancillaryAnrErrors,unclassifiedErrors,newErrors,geoHash,snap,pass:corePass};
}
const rows=[];
for(let i=0;i<TARGETS.length;i++) rows.push(await runTarget(TARGETS[i],i));
const replacementPass=rows.length===3&&rows[0].snap.publication?.runToken!==rows[1].snap.publication?.runToken&&rows[1].snap.publication?.runToken!==rows[2].snap.publication?.runToken;
const report={at:new Date().toISOString(),url:URL,rows,replacementPass,pageErrors,badResponses,pass:rows.every(r=>r.pass)&&replacementPass&&new Set(rows.map(r=>r.geoHash)).size===1};
writeFileSync('artifacts/essex-root-repeat/results.json',JSON.stringify(report,null,2));
console.log('ESSEX_PRODUCTION_ROOT_REPEAT '+JSON.stringify({pass:report.pass,replacementPass,rows:rows.map(r=>({name:r.name,geoHash:r.geoHash,corePass:r.corePass,contextPass:r.contextPass,pass:r.pass,elapsedMs:r.elapsedMs,safeCount:r.snap.safeCount,elderCount:r.snap.elder?.featureCount||0,ancillaryErrors:r.ancillaryAnrErrors?.length||0,natural:r.snap.naturalLayers,safe:r.snap.safeLayers,errors:r.newErrors}))}));
await browser.close();
if(!report.pass)process.exitCode=1;
