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

const preparation=await frame.evaluate(async target=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(!mp)throw new Error('map unavailable');
  const before={
    loc:(typeof M!=='undefined'&&M?.loc)||null,
    center:{lng:typeof M!=='undefined'?M?.centerLng:null,lat:typeof M!=='undefined'?M?.centerLat:null},
    jurisdiction:(typeof M!=='undefined'&&M?.propertyJurisdiction16516)||null,
    ready:document.documentElement.classList.contains('earthline-property-ready-16188'),
    button:!!document.getElementById('earthlineDeclareProperty16169'),
    disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled
  };
  mp.stop();mp.jumpTo({center:[target.lng,target.lat],zoom:17});
  let setter='none',setterResult=null,setterError=null;
  try{
    if(typeof window.earthlineSetTarget==='function'){setter='window.earthlineSetTarget';setterResult=window.earthlineSetTarget(target.lng,target.lat,false);}
    else if(typeof earthlineSetTarget==='function'){setter='earthlineSetTarget';setterResult=earthlineSetTarget(target.lng,target.lat,false);}
  }catch(e){setterError=String(e)}
  await new Promise(r=>setTimeout(r,2500));
  const fnNames=Object.keys(window).filter(k=>typeof window[k]==='function'&&/property|target|jurisdiction|location|center|place|declare/i.test(k)).sort().slice(0,120);
  const mKeys=(typeof M!=='undefined'&&M)?Object.keys(M).filter(k=>/property|target|jurisdiction|location|center|place/i.test(k)).sort().slice(0,120):[];
  const c=mp.getCenter();
  return {before,setter,setterResult:setterResult==null?null:String(setterResult),setterError,after:{
    loc:(typeof M!=='undefined'&&M?.loc)||null,
    center:{lng:typeof M!=='undefined'?M?.centerLng:null,lat:typeof M!=='undefined'?M?.centerLat:null},
    mapCenter:{lng:c.lng,lat:c.lat},
    jurisdiction:(typeof M!=='undefined'&&M?.propertyJurisdiction16516)||null,
    ready:document.documentElement.classList.contains('earthline-property-ready-16188'),
    button:!!document.getElementById('earthlineDeclareProperty16169'),
    disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,
    rootRunState:String(document.documentElement.dataset.earthlineRunState||''),
    propertyRunState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1400)
  },fnNames,mKeys};
},TARGET);
console.log('EARTHLINE_NY_PROPERTY_PREPARATION '+JSON.stringify(preparation));

let ready=false;
try{await frame.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&document.documentElement.classList.contains('earthline-property-ready-16188')&&!b.disabled;},null,{timeout:5000,polling:100});ready=true;}catch(_){ }
if(!ready){await browser.close();process.exitCode=1;}else{
  const started=Date.now();
  const clicked=await frame.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b||b.disabled)return false;b.click();return true;});
  if(!clicked){console.log('EARTHLINE_NY_PROPERTY_CLICK false');await browser.close();process.exitCode=1;}else{
    let settled=true;
    try{await frame.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:20000,polling:150});}catch(_){settled=false;}
    const elapsedMs=Date.now()-started;
    const result=await frame.evaluate(()=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
      const w=M?.vectorNoBuildCoverage?.mappedWater16601||null;
      const wm=M?.mappedWaterMask16601||null,nm=M?.noBuildMask||null,s=M?.safetyAudit15806||null,lock=M?.propertyResultLock15815||null;
      let cellsInFinalNoBuildMask=0;if(wm&&nm&&wm.length===nm.length){for(let i=0;i<wm.length;i++)if(wm[i]&&nm[i])cellsInFinalNoBuildMask++;}
      let rechargeWaterIntersections=0,rechargeChecked=0,rechargeGateAvailable=false;
      try{if(typeof earthlineRechargeZoneFitsProperty16326==='function'){rechargeGateAvailable=true;for(const z of (M.rechZones||[])){rechargeChecked++;if(!earthlineRechargeZoneFitsProperty16326(z,1))rechargeWaterIntersections++;}}}catch(_){rechargeWaterIntersections=-1;}
      return {audit:a,water:w,safety:s,lock,jurisdiction:M?.propertyJurisdiction16516||null,mappedWaterFeatures:Number(w?.waterFeatures||0),mappedWaterCells:Number(w?.waterCells||0),cellsInFinalNoBuildMask,swaleWaterIntersections:Number.isFinite(Number(s?.acceptedIntersections))?Number(s.acceptedIntersections):-1,rechargeWaterIntersections,rechargeChecked,rechargeGateAvailable,swaleCount:Number(M?.swales?.length||0),rechargeCount:Number(M?.rechZones?.length||0),finalMaskAvailable:!!(nm&&nm.length),status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')};
    });
    const five={mappedWaterFeatures:result.mappedWaterFeatures,mappedWaterCells:result.mappedWaterCells,cellsInFinalNoBuildMask:result.cellsInFinalNoBuildMask,'swale ∩ water':result.swaleWaterIntersections,'recharge ∩ water':result.rechargeWaterIntersections};
    const pass=settled&&elapsedMs<=HARD_CEILING_MS&&result.audit?.result===true&&result.water?.status==='verified'&&five.mappedWaterFeatures>0&&five.mappedWaterCells>0&&five.cellsInFinalNoBuildMask>0&&five['swale ∩ water']===0&&five['recharge ∩ water']===0&&result.finalMaskAvailable&&result.safety?.verified===true&&result.lock?.safetyVerified===true&&result.rechargeGateAvailable;
    console.log('EARTHLINE_NY_WATER '+JSON.stringify({test:'NY fixed Property mapped-water exclusion',labBuild:16601,acceptedParent:16584,target:TARGET,settled,elapsedMs,hardCeilingMs:HARD_CEILING_MS,five,pass,result,errors:errors.slice(0,30)}));
    await browser.close();if(!pass)process.exitCode=1;
  }
}
