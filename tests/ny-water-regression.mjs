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
const frame=await host.contentFrame();if(!frame)throw new Error('lab iframe unavailable');
await frame.waitForSelector('#searchInput',{timeout:30000});
await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});

const shoreline=await frame.evaluate(async seed=>{
  if(typeof window.earthlineSelectedSiteFromCenter!=='function'||typeof window.applyLocation!=='function')throw new Error('location preparation API unavailable');
  const seedSite=window.earthlineSelectedSiteFromCenter(M?.loc||null,seed.lng,seed.lat,20);
  if(!await window.applyLocation(seedSite,null,M.searchGen,{analyzeNow:false,preserveMapView:false}))throw new Error('applyLocation rejected seed');
  await new Promise(r=>setTimeout(r,2500));
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);if(!mp)throw new Error('map unavailable');
  const waterFeatures=mp.querySourceFeatures('composite',{sourceLayer:'water'})||[];
  if(!waterFeatures.length)throw new Error('loaded vector source returned zero mapped-water features');
  const pointInRing=(p,ring)=>{let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];const hit=((yi>p.lat)!==(yj>p.lat))&&(p.lng<(xj-xi)*(p.lat-yi)/((yj-yi)||1e-15)+xi);if(hit)inside=!inside;}return inside};
  const pointInPoly=(p,rings)=>!!(rings&&rings[0]&&pointInRing(p,rings[0])&&!rings.slice(1).some(r=>pointInRing(p,r)));
  const isWater=p=>waterFeatures.some(f=>{const g=f?.geometry;if(!g)return false;if(g.type==='Polygon')return pointInPoly(p,g.coordinates);if(g.type==='MultiPolygon')return g.coordinates.some(poly=>pointInPoly(p,poly));return false;});
  const span=.006,step=.00015;let bestLand=null,bestWater=null;
  for(let dy=-span;dy<=span+1e-9;dy+=step)for(let dx=-span;dx<=span+1e-9;dx+=step){const p={lng:seed.lng+dx,lat:seed.lat+dy};const d=Math.hypot(dx*Math.cos(seed.lat*Math.PI/180),dy);if(isWater(p)){if(!bestWater||d<bestWater.d)bestWater={...p,d};}else if(!bestLand||d<bestLand.d)bestLand={...p,d};}
  if(!bestLand||!bestWater)throw new Error('could not resolve adjacent land and water from loaded source');
  let nearestWater=null;
  for(let dy=-.0015;dy<=.0015+1e-9;dy+=step)for(let dx=-.0015;dx<=.0015+1e-9;dx+=step){const p={lng:bestLand.lng+dx,lat:bestLand.lat+dy};if(!isWater(p))continue;const d=Math.hypot(dx*Math.cos(bestLand.lat*Math.PI/180),dy);if(!nearestWater||d<nearestWater.d)nearestWater={...p,d};}
  if(!nearestWater)throw new Error('land point was not adjacent enough to mapped water');
  return {seed,sourceWaterFeatures:waterFeatures.length,seedIsWater:isWater(seed),landCenter:{lng:bestLand.lng,lat:bestLand.lat},nearestWater:{lng:nearestWater.lng,lat:nearestWater.lat},separationDegrees:nearestWater.d,landConfirmed:!isWater(bestLand),waterConfirmed:isWater(nearestWater)};
},WATER_SEED);
console.log('EARTHLINE_NY_SHORELINE '+JSON.stringify(shoreline));

const prepared=await frame.evaluate(async target=>{
  const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
  const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
  if(!applied)return {ok:false,reason:'applyLocation rejected land target'};
  const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source:'fixed-ny-water-gate'},{openPanel:false});
  await new Promise(r=>setTimeout(r,1000));
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=mp?.getCenter?.(),b=document.getElementById('earthlineDeclareProperty16169');
  return {ok:!!set,modelCenter:{lng:M?.centerLng,lat:M?.centerLat},mapCenter:c?{lng:c.lng,lat:c.lat,zoom:mp.getZoom()}:null,ready:document.documentElement.classList.contains('earthline-property-ready-16188'),button:!!b,disabled:!!b?.disabled};
},shoreline.landCenter);
console.log('EARTHLINE_NY_PROPERTY_PREPARED '+JSON.stringify(prepared));
if(!prepared.ok){await browser.close();process.exitCode=1;}else{
  const started=Date.now();let callResult=null,callError=null;
  try{callResult=await frame.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());}catch(e){callError=String(e)}
  const elapsedMs=Date.now()-started;
  const result=await frame.evaluate(()=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    const w=M?.vectorNoBuildCoverage?.mappedWater16601||null,wm=M?.mappedWaterMask16601||null,nm=M?.noBuildMask||null,s=M?.safetyAudit15806||null,lock=M?.propertyResultLock15815||null;
    let cellsInFinalNoBuildMask=0;if(wm&&nm&&wm.length===nm.length){for(let i=0;i<wm.length;i++)if(wm[i]&&nm[i])cellsInFinalNoBuildMask++;}
    let rechargeBlockedIntersections=0,rechargeChecked=0,rechargeGateAvailable=false;
    try{if(typeof earthlineRechargeZoneFitsProperty16326==='function'){rechargeGateAvailable=true;for(const z of (M.rechZones||[])){rechargeChecked++;if(!earthlineRechargeZoneFitsProperty16326(z,1))rechargeBlockedIntersections++;}}}catch(_){rechargeBlockedIntersections=-1;}
    return {audit:a,water:w,safety:s,lock,jurisdiction:M?.propertyJurisdiction16516||null,mappedWaterFeatures:Number(w?.waterFeatures||0),mappedWaterCells:Number(w?.waterCells||0),cellsInFinalNoBuildMask,swaleBlockedIntersections:Number.isFinite(Number(s?.acceptedIntersections))?Number(s.acceptedIntersections):-1,rechargeBlockedIntersections,rechargeChecked,rechargeGateAvailable,swaleCount:Number(M?.swales?.length||0),rechargeCount:Number(M?.rechZones?.length||0),finalMaskAvailable:!!(nm&&nm.length),propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1600),debugVisible:(()=>{const e=document.getElementById('earthlineWhyNotHere15803');if(!e)return false;const c=getComputedStyle(e),b=e.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&b.width>1&&b.height>1})()};
  });
  const five={mappedWaterFeatures:result.mappedWaterFeatures,mappedWaterCells:result.mappedWaterCells,cellsInFinalNoBuildMask:result.cellsInFinalNoBuildMask,'swale ∩ water/no-build':result.swaleBlockedIntersections,'recharge ∩ water/no-build':result.rechargeBlockedIntersections};
  const centerMatches=Math.abs(Number(result.audit?.center?.lng)-shoreline.landCenter.lng)<1e-6&&Math.abs(Number(result.audit?.center?.lat)-shoreline.landCenter.lat)<1e-6;
  const settled=result.audit?.settled===true&&result.propertyState!=='running';
  const pass=shoreline.sourceWaterFeatures>0&&shoreline.landConfirmed&&shoreline.waterConfirmed&&!callError&&settled&&centerMatches&&elapsedMs<=HARD_CEILING_MS&&result.audit?.result===true&&result.water?.status==='verified'&&five.mappedWaterFeatures>0&&five.mappedWaterCells>0&&five.cellsInFinalNoBuildMask>0&&five['swale ∩ water/no-build']===0&&five['recharge ∩ water/no-build']===0&&result.finalMaskAvailable&&result.safety?.verified===true&&result.lock?.safetyVerified===true&&result.rechargeGateAvailable&&!result.debugVisible;
  console.log('EARTHLINE_NY_WATER '+JSON.stringify({test:'NY source-confirmed shoreline Property exclusion',labBuild:16601,acceptedParent:16584,shoreline,centerMatches,settled,elapsedMs,hardCeilingMs:HARD_CEILING_MS,callResult,callError,five,pass,result,errors:errors.slice(0,30)}));
  await browser.close();if(!pass)process.exitCode=1;
}
