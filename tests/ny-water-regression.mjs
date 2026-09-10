import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/lab.html';
const REGION_QUERY='Lake George, New York';
const TARGET={lng:-73.6078954739776,lat:43.5736782555177,label:'Lake George fixed mapped-water test center'};
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

await frame.evaluate(query=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=query;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},REGION_QUERY);
await frame.waitForFunction(()=>/new york|lake george/i.test(String([M?.loc?.name,M?.loc?.fullName].filter(Boolean).join(' '))),null,{timeout:20000,polling:100});

try{
  await frame.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&document.documentElement.classList.contains('earthline-property-ready-16188')&&!b.disabled;},null,{timeout:60000,polling:150});
}catch(_){
  const pre=await frame.evaluate(()=>({loc:M?.loc||null,center:{lng:M?.centerLng,lat:M?.centerLat},jurisdiction:M?.propertyJurisdiction16516||null,regional:window.earthlineRegional15778||null,propertyReady:document.documentElement.classList.contains('earthline-property-ready-16188'),propertyButton:!!document.getElementById('earthlineDeclareProperty16169'),propertyDisabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1200)}));
  console.log('EARTHLINE_NY_PROPERTY_UNAVAILABLE '+JSON.stringify(pre));
  throw new Error('Property control unavailable or disabled');
}

const started=Date.now();
const clickState=await frame.evaluate(target=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(!mp)throw new Error('map unavailable');
  mp.stop();
  mp.jumpTo({center:[target.lng,target.lat],zoom:17});
  try{M.centerLng=target.lng;M.centerLat=target.lat}catch(_){ }
  try{if(M.loc){M.loc.lat=target.lat;M.loc.lng=target.lng;}}catch(_){ }
  const c=mp.getCenter();
  const b=document.getElementById('earthlineDeclareProperty16169');
  if(!b||b.disabled)return {clicked:false,mapCenter:{lng:c.lng,lat:c.lat},modelCenter:{lng:M?.centerLng,lat:M?.centerLat}};
  b.click();
  return {clicked:true,mapCenter:{lng:c.lng,lat:c.lat},modelCenter:{lng:M?.centerLng,lat:M?.centerLat}};
},TARGET);
console.log('EARTHLINE_NY_TARGET_AT_CLICK '+JSON.stringify(clickState));
if(!clickState.clicked)throw new Error('Property control unavailable or disabled');

await frame.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:30000,polling:150});
const elapsedMs=Date.now()-started;

const result=await frame.evaluate(()=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
  const w=M?.vectorNoBuildCoverage?.mappedWater16601||null;
  const wm=M?.mappedWaterMask16601||null;
  const nm=M?.noBuildMask||null;
  const s=M?.safetyAudit15806||null;
  const lock=M?.propertyResultLock15815||null;
  let cellsInFinalNoBuildMask=0;
  if(wm&&nm&&wm.length===nm.length){for(let i=0;i<wm.length;i++)if(wm[i]&&nm[i])cellsInFinalNoBuildMask++;}
  let rechargeWaterIntersections=0,rechargeChecked=0,rechargeGateAvailable=false;
  try{if(typeof earthlineRechargeZoneFitsProperty16326==='function'){rechargeGateAvailable=true;for(const z of (M.rechZones||[])){rechargeChecked++;if(!earthlineRechargeZoneFitsProperty16326(z,1))rechargeWaterIntersections++;}}}catch(_){rechargeWaterIntersections=-1;}
  const swaleWaterIntersections=Number.isFinite(Number(s?.acceptedIntersections))?Number(s.acceptedIntersections):-1;
  return {audit:a,water:w,safety:s,lock,jurisdiction:M?.propertyJurisdiction16516||null,mappedWaterFeatures:Number(w?.waterFeatures||0),mappedWaterCells:Number(w?.waterCells||0),cellsInFinalNoBuildMask,swaleWaterIntersections,rechargeWaterIntersections,rechargeChecked,rechargeGateAvailable,swaleCount:Number(M?.swales?.length||0),rechargeCount:Number(M?.rechZones?.length||0),finalMaskAvailable:!!(nm&&nm.length),status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),debugVisible:(()=>{const e=document.getElementById('earthlineWhyNotHere15803');if(!e)return false;const c=getComputedStyle(e),b=e.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&b.width>1&&b.height>1})()};
});

const five={mappedWaterFeatures:result.mappedWaterFeatures,mappedWaterCells:result.mappedWaterCells,cellsInFinalNoBuildMask:result.cellsInFinalNoBuildMask,'swale ∩ water':result.swaleWaterIntersections,'recharge ∩ water':result.rechargeWaterIntersections};
const centerMatches=Math.abs(Number(result.audit?.center?.lng)-TARGET.lng)<1e-6&&Math.abs(Number(result.audit?.center?.lat)-TARGET.lat)<1e-6;
const pass=centerMatches&&elapsedMs<=HARD_CEILING_MS&&result.audit?.result===true&&result.water?.status==='verified'&&five.mappedWaterFeatures>0&&five.mappedWaterCells>0&&five.cellsInFinalNoBuildMask>0&&five['swale ∩ water']===0&&five['recharge ∩ water']===0&&result.finalMaskAvailable&&result.safety?.verified===true&&result.lock?.safetyVerified===true&&result.rechargeGateAvailable&&!result.debugVisible;
const report={test:'NY fixed Property mapped-water exclusion',labBuild:16601,acceptedParent:16584,url:URL,target:TARGET,centerMatches,elapsedMs,hardCeilingMs:HARD_CEILING_MS,five,pass,result,errors:errors.slice(0,30)};
console.log('EARTHLINE_NY_WATER '+JSON.stringify(report));
await browser.close();
if(!pass)process.exitCode=1;
