import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/lab.html';
const REGION_QUERY='Lake George, New York';
const WATER_SEED={lng:-73.6078954739776,lat:43.5736782555177,label:'Lake George Narrows water seed'};
const HARD_CEILING_MS=15000;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
const host=await page.waitForSelector('#earthline-lab-frame',{timeout:20000});
const frame=await host.contentFrame();
if(!frame)throw new Error('lab iframe unavailable');
await frame.waitForSelector('#searchInput',{timeout:30000});
await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});

// Start the location acquisition, but do NOT wait for Regional publication.
await frame.evaluate(query=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=query;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},REGION_QUERY);
await frame.waitForFunction(seed=>{
  const text=String([M?.loc?.name,M?.loc?.fullName].filter(Boolean).join(' ')).toLowerCase();
  const lat=Number(M?.centerLat),lng=Number(M?.centerLng);
  const near=Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat-seed.lat)<0.75&&Math.abs(lng-seed.lng)<0.75;
  return near||/lake george|new york/.test(text);
},WATER_SEED,{timeout:20000,polling:100});

const shoreline=await frame.evaluate(async seed=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);if(!mp)throw new Error('map unavailable');
  mp.jumpTo({center:[seed.lng,seed.lat],zoom:14});
  await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;resolve()};try{mp.once('idle',finish)}catch(_){ }setTimeout(finish,3500)});
  const style=mp.getStyle()||{};
  const layers=(style.layers||[]).filter(l=>{const t=(String(l.id||'')+' '+String(l['source-layer']||'')).toLowerCase();return /water|river|lake|reservoir|stream|canal|wetland/.test(t)&&(l.type==='fill'||l.type==='line'||l.type==='fill-extrusion')}).map(l=>l.id);
  if(!layers.length)throw new Error('no rendered mapped-water layers');
  const classify=(lng,lat)=>{try{const p=mp.project([lng,lat]);return (mp.queryRenderedFeatures([p.x,p.y],{layers})||[]).length>0}catch(_){return false}};
  const points=[];const step=.00075;const span=.012;
  for(let dy=-span;dy<=span+1e-9;dy+=step)for(let dx=-span;dx<=span+1e-9;dx+=step){const lng=seed.lng+dx,lat=seed.lat+dy;points.push({lng,lat,water:classify(lng,lat)})}
  const water=points.filter(p=>p.water),land=points.filter(p=>!p.water);if(!water.length||!land.length)throw new Error('shoreline discriminator unavailable');
  let best=null;
  for(const l of land){for(const w of water){const d=Math.hypot((l.lng-w.lng)*Math.cos(l.lat*Math.PI/180),l.lat-w.lat);if(!best||d<best.d)best={land:l,water:w,d}}}
  if(!best||best.d>.0020)throw new Error('no land point close enough to mapped water');
  mp.jumpTo({center:[best.land.lng,best.land.lat],zoom:17});
  try{if(typeof window.earthlineSetTarget==='function')window.earthlineSetTarget(best.land.lng,best.land.lat,false);else if(typeof earthlineSetTarget==='function')earthlineSetTarget(best.land.lng,best.land.lat,false);}catch(_){ }
  await new Promise(resolve=>setTimeout(resolve,500));
  return {seed,waterLayerCount:layers.length,landCenter:best.land,nearestWater:best.water,separationDegrees:best.d,landConfirmed:!classify(best.land.lng,best.land.lat),waterConfirmed:classify(best.water.lng,best.water.lat)};
},WATER_SEED);

// Wait only for the authoritative Property control. Regional success/failure is irrelevant here.
try{await frame.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&document.documentElement.classList.contains('earthline-property-ready-16188')&&!b.disabled;},null,{timeout:10000,polling:100});}catch(_){ }
const pre=await frame.evaluate(()=>({
  loc:M?.loc||null,jurisdiction:M?.propertyJurisdiction16516||null,regional:window.earthlineRegional15778||null,
  propertyReady:document.documentElement.classList.contains('earthline-property-ready-16188'),
  propertyButton:!!document.getElementById('earthlineDeclareProperty16169'),propertyDisabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,
  status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1200)
}));
console.log('EARTHLINE_NY_PROPERTY_PRE '+JSON.stringify({shoreline,pre}));
const started=Date.now();
const clicked=await frame.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b||b.disabled)return false;b.click();return true});
if(!clicked)throw new Error('Property control unavailable or disabled');
await frame.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:30000,polling:150});
const elapsedMs=Date.now()-started;
const result=await frame.evaluate(()=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
  const w=M?.vectorNoBuildCoverage?.mappedWater16601||null;
  const s=M?.safetyAudit15806||null;
  const lock=M?.propertyResultLock15815||null;
  let rechargeAllClear=true,rechargeChecked=0;
  try{if(typeof earthlineRechargeZoneFitsProperty16326==='function'){for(const z of (M.rechZones||[])){rechargeChecked++;if(!earthlineRechargeZoneFitsProperty16326(z,1))rechargeAllClear=false}}}catch(_){rechargeAllClear=false}
  return {audit:a,water:w,safety:s,lock,rechargeSelection:M?.rechargeTargetSelection16332||null,rechargeCount:Number(M?.rechZones?.length||0),rechargeChecked,rechargeAllClear,swaleCount:Number(M?.swales?.length||0),finalMaskAvailable:!!(M?.noBuildMask&&M.noBuildMask.length),jurisdiction:M?.propertyJurisdiction16516||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),debugVisible:(()=>{const e=document.getElementById('earthlineWhyNotHere15803');if(!e)return false;const c=getComputedStyle(e),b=e.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&b.width>1&&b.height>1})()};
});
const pass=shoreline.landConfirmed&&shoreline.waterConfirmed&&elapsedMs<=HARD_CEILING_MS&&result.audit?.result===true&&result.water?.status==='verified'&&Number(result.water?.waterFeatures||0)>0&&Number(result.water?.waterCells||0)>0&&result.finalMaskAvailable&&result.safety?.verified===true&&Number(result.safety?.acceptedIntersections)===0&&result.lock?.safetyVerified===true&&result.rechargeAllClear===true&&!result.debugVisible;
const report={test:'NY fixed Property mapped-water exclusion',labBuild:16601,acceptedParent:16584,url:URL,regionQuery:REGION_QUERY,shoreline,elapsedMs,hardCeilingMs:HARD_CEILING_MS,pass,result,errors:errors.slice(0,30)};
console.log('EARTHLINE_NY_WATER '+JSON.stringify(report));
await browser.close();
if(!pass)process.exitCode=1;
