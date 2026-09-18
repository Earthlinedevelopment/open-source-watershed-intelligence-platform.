import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

const patches={};
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();
  let body=await resp.text();

  const sig='  async function hydrology(dem,validityMask16584=null){';
  const renamed='  async function hydrologyUncached16627(dem,validityMask16584=null){';
  patches.rename=body.split(sig).length-1;
  body=body.split(sig).join(renamed);

  const anchor='  function regionalRechargeModel16492(hy,loc){';
  const wrapper=`  const EARTHLINE_HYDRO_CORE_CACHE_16627=new Map();
  const EARTHLINE_HYDRO_CORE_CACHE_MAX_16627=8;
  function earthlineHydroFingerprint16627(dem,validityMask16584){
    let hash16627=2166136261>>>0;
    const mix16627=n16627=>{hash16627^=(Number(n16627)>>>0);hash16627=Math.imul(hash16627,16777619)>>>0;};
    const bits16627=new DataView(new ArrayBuffer(4));
    const elev16627=dem&&dem.elev||[];
    for(let i16627=0;i16627<elev16627.length;i16627++){
      bits16627.setFloat32(0,Number(elev16627[i16627]),true);
      mix16627(bits16627.getUint32(0,true));
    }
    const mask16627=validityMask16584||[];
    for(let i16627=0;i16627<mask16627.length;i16627+=4){
      const packed16627=(Number(mask16627[i16627]||0)&255)|((Number(mask16627[i16627+1]||0)&255)<<8)|((Number(mask16627[i16627+2]||0)&255)<<16)|((Number(mask16627[i16627+3]||0)&255)<<24);
      mix16627(packed16627);
    }
    const b16627=Array.isArray(dem&&dem.bounds)?dem.bounds:[];
    return [Number(dem&&dem.w)||0,Number(dem&&dem.h)||0,String(dem&&dem.source||''),String(dem&&dem.z!=null?dem.z:''),b16627.map(v16627=>Number(v16627).toFixed(8)).join(','),mask16627.length,hash16627.toString(16)].join('|');
  }
  function earthlineCloneHydrology16627(hy16627){
    return {
      filled:new Float32Array(hy16627.filled),
      to:new Int32Array(hy16627.to),
      slope:new Float32Array(hy16627.slope),
      acc:new Float32Array(hy16627.acc),
      cellX:Number(hy16627.cellX),cellY:Number(hy16627.cellY),
      w:Number(hy16627.w),h:Number(hy16627.h),
      bounds:Array.isArray(hy16627.bounds)?hy16627.bounds.slice():hy16627.bounds,
      elev:new Float32Array(hy16627.elev),
      validityMask16584:hy16627.validityMask16584?new Uint8Array(hy16627.validityMask16584):null
    };
  }
  async function hydrology(dem,validityMask16584=null){
    const started16627=performance.now(),key16627=earthlineHydroFingerprint16627(dem,validityMask16584);
    if(EARTHLINE_HYDRO_CORE_CACHE_16627.has(key16627)){
      const hit16627=earthlineCloneHydrology16627(EARTHLINE_HYDRO_CORE_CACHE_16627.get(key16627));
      window.EARTHLINE_HYDRO_CACHE_AUDIT_16627={hit:true,key:key16627,entries:EARTHLINE_HYDRO_CORE_CACHE_16627.size,elapsedMs:Math.round(performance.now()-started16627),at:new Date().toISOString()};
      return hit16627;
    }
    const fresh16627=await hydrologyUncached16627(dem,validityMask16584);
    EARTHLINE_HYDRO_CORE_CACHE_16627.set(key16627,earthlineCloneHydrology16627(fresh16627));
    while(EARTHLINE_HYDRO_CORE_CACHE_16627.size>EARTHLINE_HYDRO_CORE_CACHE_MAX_16627){
      EARTHLINE_HYDRO_CORE_CACHE_16627.delete(EARTHLINE_HYDRO_CORE_CACHE_16627.keys().next().value);
    }
    window.EARTHLINE_HYDRO_CACHE_AUDIT_16627={hit:false,key:key16627,entries:EARTHLINE_HYDRO_CORE_CACHE_16627.size,elapsedMs:Math.round(performance.now()-started16627),at:new Date().toISOString()};
    return fresh16627;
  }

`+anchor;
  patches.wrapper=body.split(anchor).length-1;
  body=body.split(anchor).join(wrapper);
  return route.fulfill({response:resp,body});
});

await page.goto(URL+'?tx_hydro_cache='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});

const rows=[];
for(let repeat=1;repeat<=3;repeat++){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
  const started=Date.now();
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  });
  let timedOut=false;
  try{
    await page.waitForFunction(prev=>{
      const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'');
      const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));
    },prior,{timeout:30000,polling:100});
  }catch(_){timedOut=true;}
  let aqTimeout=false;
  try{await page.waitForFunction(()=>/Principal Aquifers of the United States/i.test(String(window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126?.source||'')),{timeout:12000,polling:100});}catch(_){aqTimeout=true;}
  await page.waitForTimeout(250);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null;
    return {
      swales:sw.length,visible:d?.swaleLines??null,totalMs:p?.totalMs??null,phases:p?.phaseTotalsMs??null,
      hydroCache:window.EARTHLINE_HYDRO_CACHE_AUDIT_16627||null,
      zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),panhandleWestNM:count((x,y)=>x>-103.2&&x<-102&&y>31.8&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),midCoast:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)},
      outside:b?.outsideAfterClip??null,aquifer:a,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
    };
  });
  const row={repeat,elapsedMs:Date.now()-started,timedOut,aqTimeout,state};rows.push(row);console.log('EARTHLINE_TX_HYDRO_CACHE '+JSON.stringify(row));
}
const stable=rows.every(r=>r.state.swales===59&&r.state.visible===59&&r.state.zones.panhandleNorth===1&&r.state.zones.upperCoast===4&&r.state.zones.midCoast===12&&r.state.zones.lowerCoast===4&&r.state.zones.eastInterior===8&&Number(r.state.outside?.swales||0)===0&&/Principal Aquifers of the United States/i.test(String(r.state.aquifer?.source||''))&&!r.state.lastError);
const perf=rows.every(r=>Number(r.state.totalMs)<=15000);
console.log('EARTHLINE_TX_HYDRO_CACHE_SUMMARY '+JSON.stringify({patches,stable,perf,rows,errors:errors.slice(0,20)}));
await browser.close();
if(patches.rename!==1||patches.wrapper!==1||!stable||!perf)process.exitCode=1;
