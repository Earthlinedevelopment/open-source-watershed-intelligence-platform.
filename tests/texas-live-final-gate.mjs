import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const rows=[],patches={};
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1 match, found '+n);body=body.replace(needle,replacement);};
  apply('demCacheEntry',
`  async function loadDEM(b,w=240,h=240,requestTimeoutMs=30000,timeoutLabel='open elevation'){`,
`  const EARTHLINE_REGIONAL_DEM_CACHE_16645=new Map();
  const EARTHLINE_REGIONAL_DEM_CACHE_MAX_16645=8;
  function earthlineCloneDEM16645(d16645){
    return Object.assign({},d16645,{elev:new Float32Array(d16645.elev),bounds:Array.isArray(d16645.bounds)?d16645.bounds.slice():d16645.bounds});
  }
  function earthlineRememberDEM16645(key16645,d16645){
    EARTHLINE_REGIONAL_DEM_CACHE_16645.delete(key16645);
    EARTHLINE_REGIONAL_DEM_CACHE_16645.set(key16645,earthlineCloneDEM16645(d16645));
    while(EARTHLINE_REGIONAL_DEM_CACHE_16645.size>EARTHLINE_REGIONAL_DEM_CACHE_MAX_16645)EARTHLINE_REGIONAL_DEM_CACHE_16645.delete(EARTHLINE_REGIONAL_DEM_CACHE_16645.keys().next().value);
  }
  async function loadDEM(b,w=240,h=240,requestTimeoutMs=30000,timeoutLabel='open elevation'){
    const demKey16645=[w,h,(b||[]).map(v16645=>Number(v16645).toFixed(8)).join(',')].join('|');
    if(EARTHLINE_REGIONAL_DEM_CACHE_16645.has(demKey16645)){
      const cached16645=EARTHLINE_REGIONAL_DEM_CACHE_16645.get(demKey16645);
      earthlineRememberDEM16645(demKey16645,cached16645);
      window.EARTHLINE_DEM_CACHE_AUDIT_16645={hit:true,key:demKey16645,entries:EARTHLINE_REGIONAL_DEM_CACHE_16645.size,at:new Date().toISOString()};
      return earthlineCloneDEM16645(cached16645);
    }`);
  apply('demCacheReturn',
`    return {elev,w,h,bounds:b,z,min,max,source:'Open Terrarium elevation tiles'};
  }
  function mapFallbackAbortError16353(signal,label){`,
`    const dem16645={elev,w,h,bounds:b,z,min,max,source:'Open Terrarium elevation tiles'};
    earthlineRememberDEM16645(demKey16645,dem16645);
    window.EARTHLINE_DEM_CACHE_AUDIT_16645={hit:false,key:demKey16645,entries:EARTHLINE_REGIONAL_DEM_CACHE_16645.size,at:new Date().toISOString()};
    return earthlineCloneDEM16645(dem16645);
  }
  function mapFallbackAbortError16353(signal,label){`);
  apply('cameraFinalFrameGuard',
`    const cameraReady16334=await cameraSettle16310;`,
`    let cameraReady16334=await cameraSettle16310;
    try{
      const cb16645=m&&m.getBounds&&m.getBounds(),targetSpan16645=Math.max(Math.abs(b[2]-b[0]),Math.abs(b[3]-b[1]));
      const cameraSpan16645=cb16645?Math.max(Math.abs(cb16645.getEast()-cb16645.getWest()),Math.abs(cb16645.getNorth()-cb16645.getSouth())):Infinity;
      const frameRatio16645=targetSpan16645>0&&Number.isFinite(cameraSpan16645)?cameraSpan16645/targetSpan16645:Infinity;
      const reassert16645=frameRatio16645>4;
      window.EARTHLINE_CAMERA_FINAL_GUARD_16645={runToken,targetSpan:targetSpan16645,cameraSpanBefore:cameraSpan16645,frameRatio:frameRatio16645,reasserted:reassert16645,at:new Date().toISOString()};
      if(reassert16645&&isCurrentRun(runToken))cameraReady16334=await settleRegionalCamera(m,b,runToken);
    }catch(error16645){window.EARTHLINE_CAMERA_FINAL_GUARD_16645={runToken,error:String(error16645),at:new Date().toISOString()};}`);
  return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_dem_cache16645='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
for(let repeat=1;repeat<=3;repeat++){
 const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
 await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:30000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(500);
 const state=await page.evaluate(()=>{
  const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
  const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
  const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
  const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
  return {swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,phases:p?.phaseTotalsMs??null,demCache:window.EARTHLINE_DEM_CACHE_AUDIT_16645||null,cameraGuard:window.EARTHLINE_CAMERA_FINAL_GUARD_16645||null,gridW:flow?.gridAudit?.grid?.w??null,gridH:flow?.gridAudit?.grid?.h??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,aquifer:a,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
 });
 const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_DEM_CACHE_16645 '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_DEM_CACHE_16645_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
const bad=rows.some(r=>r.timedOut||r.state.lastError||r.state.visible!==66||r.state.published!==66||!(r.state.totalMs<=15000)||Number(r.state.gridW)!==96||Number(r.state.gridH)!==96||Number(r.state.unsafe)!==0||Number(r.state.outside?.swales||0)!==0||r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10);
if(bad)process.exitCode=1;
