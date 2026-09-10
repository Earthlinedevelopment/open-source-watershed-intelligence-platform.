import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/lab.html';
const TARGET={lng:-73.6078954739776,lat:43.5736782555177,label:'Lake George fixed mapped-water Property test'};
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

const prepared=await frame.evaluate(async target=>{
  if(typeof window.earthlineSelectedSiteFromCenter!=='function'||typeof window.applyLocation!=='function'||typeof window.earthlineSetPropertyTarget16201!=='function'||typeof window.earthlineDeclarePropertyAtCrosshair16169!=='function')return {ok:false,reason:'authoritative Property API unavailable'};
  const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
  const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
  if(!applied)return {ok:false,reason:'applyLocation rejected fixed Property site',site};
  const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source:'fixed-ny-water-gate'},{openPanel:false});
  await new Promise(resolve=>setTimeout(resolve,1200));
  const t=window.EARTHLINE_PROPERTY_TARGET_16201||null,b=document.getElementById('earthlineDeclareProperty16169');
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=mp?.getCenter?.();
  return {ok:!!set,site:{lng:site.lng,lat:site.lat,name:site.name,userSelectedSite:site.userSelectedSite},target:t,modelCenter:{lng:M?.centerLng,lat:M?.centerLat},mapCenter:c?{lng:c.lng,lat:c.lat,zoom:mp.getZoom()}:null,ready:document.documentElement.classList.contains('earthline-property-ready-16188'),button:!!b,disabled:!!b?.disabled};
},TARGET);
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
  const centerMatches=Math.abs(Number(result.audit?.center?.lng)-TARGET.lng)<1e-6&&Math.abs(Number(result.audit?.center?.lat)-TARGET.lat)<1e-6;
  const settled=result.audit?.settled===true&&result.propertyState!=='running';
  const pass=!callError&&settled&&centerMatches&&elapsedMs<=HARD_CEILING_MS&&result.audit?.result===true&&result.water?.status==='verified'&&five.mappedWaterFeatures>0&&five.mappedWaterCells>0&&five.cellsInFinalNoBuildMask>0&&five['swale ∩ water/no-build']===0&&five['recharge ∩ water/no-build']===0&&result.finalMaskAvailable&&result.safety?.verified===true&&result.lock?.safetyVerified===true&&result.rechargeGateAvailable&&!result.debugVisible;
  console.log('EARTHLINE_NY_WATER '+JSON.stringify({test:'NY fixed Property mapped-water exclusion',labBuild:16601,acceptedParent:16584,target:TARGET,centerMatches,settled,elapsedMs,hardCeilingMs:HARD_CEILING_MS,callResult,callError,five,pass,result,errors:errors.slice(0,30)}));
  await browser.close();if(!pass)process.exitCode=1;
}
