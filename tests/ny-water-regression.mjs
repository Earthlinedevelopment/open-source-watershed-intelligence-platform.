import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/lab.html';
const WATER_SEED={lng:-73.6078954739776,lat:43.5736782555177,label:'Lake George Narrows water seed'};
const HARD_CEILING_MS=15000;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
const host=await page.waitForSelector('#earthline-lab-frame',{timeout:20000});
const frame=await host.contentFrame();
if(!frame)throw new Error('lab iframe unavailable');
await frame.waitForSelector('#searchInput',{timeout:30000});
await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});

const shoreline=await frame.evaluate(async seed=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(!mp)throw new Error('map unavailable');
  mp.stop();mp.jumpTo({center:[seed.lng,seed.lat],zoom:14});
  await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;resolve()};try{mp.once('idle',finish)}catch(_){ }setTimeout(finish,4500)});
  const style=mp.getStyle()||{};
  const layers=(style.layers||[]).filter(l=>{
    const t=(String(l.id||'')+' '+String(l['source-layer']||'')).toLowerCase();
    return /water|river|lake|reservoir|stream|canal|wetland/.test(t)&&(l.type==='fill'||l.type==='line'||l.type==='fill-extrusion');
  }).map(l=>l.id);
  if(!layers.length)throw new Error('no rendered mapped-water layers');
  const classify=(lng,lat)=>{try{const p=mp.project([lng,lat]);return (mp.queryRenderedFeatures([p.x,p.y],{layers})||[]).length>0}catch(_){return false}};
  const points=[],step=.00075,span=.012;
  for(let dy=-span;dy<=span+1e-9;dy+=step)for(let dx=-span;dx<=span+1e-9;dx+=step){const lng=seed.lng+dx,lat=seed.lat+dy;points.push({lng,lat,water:classify(lng,lat)})}
  const water=points.filter(p=>p.water),land=points.filter(p=>!p.water);
  if(!water.length||!land.length)throw new Error('shoreline discriminator unavailable');
  let best=null;
  for(const l of land){for(const w of water){const d=Math.hypot((l.lng-w.lng)*Math.cos(l.lat*Math.PI/180),l.lat-w.lat);if(!best||d<best.d)best={land:l,water:w,d}}}
  if(!best||best.d>.0020)throw new Error('no land point close enough to mapped water');
  return {seed,waterLayerCount:layers.length,landCenter:best.land,nearestWater:best.water,separationDegrees:best.d,landConfirmed:!classify(best.land.lng,best.land.lat),waterConfirmed:classify(best.water.lng,best.water.lat)};
},WATER_SEED);
console.log('EARTHLINE_NY_SHORELINE '+JSON.stringify(shoreline));

const prepared=await frame.evaluate(async target=>{
  if(typeof window.earthlineSelectedSiteFromCenter!=='function'||typeof window.applyLocation!=='function'||typeof window.earthlineSetPropertyTarget16201!=='function'||typeof window.earthlineDeclarePropertyAtCrosshair16169!=='function')return {ok:false,reason:'authoritative Property API unavailable'};
  const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
  const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
  if(!applied)return {ok:false,reason:'applyLocation rejected fixed Property site',site};
  const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source:'fixed-ny-water-gate'},{openPanel:false});
  await new Promise(resolve=>setTimeout(resolve,1000));
  const t=window.EARTHLINE_PROPERTY_TARGET_16201||null,b=document.getElementById('earthlineDeclareProperty16169');
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=mp?.getCenter?.();
  return {ok:!!set,site:{lng:site.lng,lat:site.lat,name:site.name,userSelectedSite:site.userSelectedSite},target:t,modelCenter:{lng:M?.centerLng,lat:M?.centerLat},mapCenter:c?{lng:c.lng,lat:c.lat,zoom:mp.getZoom()}:null,ready:document.documentElement.classList.contains('earthline-property-ready-16188'),button:!!b,disabled:!!b?.disabled};
},shoreline.landCenter);
console.log('EARTHLINE_NY_PROPERTY_PREPARED '+JSON.stringify(prepared));
if(!prepared.ok){await browser.close();process.exitCode=1;}else{
  const started=Date.now();
  let callResult=null,callError=null;
  try{callResult=await frame.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());}catch(e){callError=String(e);}
  const elapsedMs=Date.now()-started;
  const result=await frame.evaluate(()=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    const w=M?.vectorNoBuildCoverage?.mappedWater16601||null;
    const wm=M?.mappedWaterMask16601||null,nm=M?.noBuildMask||null,s=M?.safetyAudit15806||null,lock=M?.propertyResultLock15815||null;
    let cellsInFinalNoBuildMask=0;if(wm&&nm&&wm.length===nm.length){for(let i=0;i<wm.length;i++)if(wm[i]&&nm[i])cellsInFinalNoBuildMask++;}
    let rechargeBlockedIntersections=0,rechargeChecked=0,rechargeGateAvailable=false;
    try{if(typeof earthlineRechargeZoneFitsProperty16326==='function'){rechargeGateAvailable=true;for(const z of (M.rechZones||[])){rechargeChecked++;if(!earthlineRechargeZoneFitsProperty16326(z,1))rechargeBlockedIntersections++;}}}catch(_){rechargeBlockedIntersections=-1;}
    return {audit:a,water:w,safety:s,lock,jurisdiction:M?.propertyJurisdiction16516||null,mappedWaterFeatures:Number(w?.waterFeatures||0),mappedWaterCells:Number(w?.waterCells||0),cellsInFinalNoBuildMask,swaleBlockedIntersections:Number.isFinite(Number(s?.acceptedIntersections))?Number(s.acceptedIntersections):-1,rechargeBlockedIntersections,rechargeChecked,rechargeGateAvailable,swaleCount:Number(M?.swales?.length||0),rechargeCount:Number(M?.rechZones?.length||0),finalMaskAvailable:!!(nm&&nm.length),modelCenter:{lng:M?.centerLng,lat:M?.centerLat},mapCenter:(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);const c=m.getCenter();return {lng:c.lng,lat:c.lat,zoom:m.getZoom()}}catch(_){return null}})(),propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1600),debugVisible:(()=>{const e=document.getElementById('earthlineWhyNotHere15803');if(!e)return false;const c=getComputedStyle(e),b=e.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&b.width>1&&b.height>1})()};
  });
  const five={mappedWaterFeatures:result.mappedWaterFeatures,mappedWaterCells:result.mappedWaterCells,cellsInFinalNoBuildMask:result.cellsInFinalNoBuildMask,'swale ∩ water/no-build':result.swaleBlockedIntersections,'recharge ∩ water/no-build':result.rechargeBlockedIntersections};
  const centerMatches=Math.abs(Number(result.audit?.center?.lng)-shoreline.landCenter.lng)<1e-6&&Math.abs(Number(result.audit?.center?.lat)-shoreline.landCenter.lat)<1e-6;
  const settled=result.audit?.settled===true&&result.propertyState!=='running';
  const pass=shoreline.landConfirmed&&shoreline.waterConfirmed&&!callError&&settled&&centerMatches&&elapsedMs<=HARD_CEILING_MS&&result.audit?.result===true&&result.water?.status==='verified'&&five.mappedWaterFeatures>0&&five.mappedWaterCells>0&&five.cellsInFinalNoBuildMask>0&&five['swale ∩ water/no-build']===0&&five['recharge ∩ water/no-build']===0&&result.finalMaskAvailable&&result.safety?.verified===true&&result.lock?.safetyVerified===true&&result.rechargeGateAvailable&&!result.debugVisible;
  console.log('EARTHLINE_NY_WATER '+JSON.stringify({test:'NY shoreline-adjacent Property mapped-water exclusion',labBuild:16601,acceptedParent:16584,shoreline,centerMatches,settled,elapsedMs,hardCeilingMs:HARD_CEILING_MS,callResult,callError,five,pass,result,errors:errors.slice(0,30)}));
  await browser.close();if(!pass)process.exitCode=1;
}
