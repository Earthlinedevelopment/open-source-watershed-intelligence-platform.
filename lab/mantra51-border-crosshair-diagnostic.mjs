import { chromium } from 'playwright';

const PROD=process.env.EARTHLINE_PROD||'https://earthlinedevelopment.org/';
const CAND=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const TARGETS=(process.env.M51_TARGETS||'New Zealand|India|Mexico|Alaska|Vancouver Island').split('|').map(s=>s.trim()).filter(Boolean);

const browser=await chromium.launch({headless:true});

async function captureFixture(target){
  const page=await browser.newPage({viewport:{width:1500,height:860}});
  let result={target,error:null,raw:null,resolved:null};
  try{
    await page.goto(PROD+'?m51-fixture='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>typeof window.geocodeMapbox==='function',{timeout:30000});
    result=await page.evaluate(async target=>{
      const originalFetch=window.fetch.bind(window);
      let raw=null;
      window.fetch=async(...args)=>{
        const r=await originalFetch(...args);
        try{
          const u=String(args[0]||'');
          if(u.includes('api.mapbox.com/geocoding/')) raw=await r.clone().json();
        }catch{}
        return r;
      };
      let resolved=null,error=null;
      try{resolved=await geocodeMapbox(target);}catch(e){error=String(e?.message||e);}
      return {target,error,raw,resolved};
    },target);
  }catch(e){result.error=String(e?.message||e);}
  await page.close();
  return result;
}

function cellsFromFeatures(features,bounds){
  const out=new Set();
  if(!Array.isArray(bounds)||bounds.length!==4)return out;
  const [w,s,e,n]=bounds, dx=Math.max(1e-9,e-w), dy=Math.max(1e-9,n-s);
  for(const f of features||[]){
    const g=f?.geometry;
    const lines=g?.type==='LineString'?[g.coordinates]:g?.type==='MultiLineString'?(g.coordinates||[]):[];
    for(const line of lines)for(const p of line||[]){
      if(!Array.isArray(p)||!Number.isFinite(+p[0])||!Number.isFinite(+p[1]))continue;
      const x=Math.max(0,Math.min(11,Math.floor((+p[0]-w)/dx*12)));
      const y=Math.max(0,Math.min(11,Math.floor((+p[1]-s)/dy*12)));
      out.add(x+','+y);
    }
  }
  return out;
}

const rows=[];
for(const target of TARGETS){
  const fixture=await captureFixture(target);
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  let harnessError=null;
  try{
    await page.goto(CAND+'?m51-boundary-diag='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    if(!fixture.raw?.features?.length)throw new Error('production geocoder fixture unavailable: '+String(fixture.error||'no features'));
    await page.evaluate(({target,raw})=>{
      if(target==='New Zealand'){
        try{
          let __m51pt=window.EARTHLINE_PROPERTY_TARGET_16201;
          window.__M51_TARGET_WRITES=[];
          Object.defineProperty(window,'EARTHLINE_PROPERTY_TARGET_16201',{configurable:true,get(){return __m51pt},set(v){
            window.__M51_TARGET_WRITES.push({at:Date.now(),value:v?{lng:Number(v.lng),lat:Number(v.lat),source:String(v.source||''),code:String(v.code||'')}:v,stack:(new Error()).stack?.split('\n').slice(1,5)});
            __m51pt=v;
          }});
        }catch(e){window.__M51_TARGET_TRACE_ERROR=String(e?.message||e)}
      }
      const original=window.fetch.bind(window);
      window.fetch=async(url,opts)=>{
        const u=String(url||'');
        if(u.includes('api.mapbox.com/geocoding/'))return new Response(JSON.stringify(raw),{status:200,headers:{'content-type':'application/json'}});
        return original(url,opts);
      };
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=target;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },{target,raw:fixture.raw});
    await page.waitForFunction(target=>{
      const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
      const d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;
      return !!e||String(d?.query||'').trim().toLowerCase()===String(target).trim().toLowerCase();
    },target,{timeout:100000,polling:100});
    await page.waitForTimeout(500);
    if(target==='New Zealand'){
      const before=await page.evaluate(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;return t?{lng:+t.lng,lat:+t.lat,source:String(t.source||''),code:String(t.code||'')}:null});
      const box=await page.locator('#map').boundingBox();
      if(!box)throw new Error('New Zealand map box unavailable for user-drag gate');
      const x=box.x+box.width*0.55,y=box.y+box.height*0.55;
      await page.mouse.move(x,y);
      await page.mouse.down();
      await page.mouse.move(x+140,y+70,{steps:12});
      await page.mouse.up();
      await page.waitForTimeout(900);
      const after=await page.evaluate(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;return t?{lng:+t.lng,lat:+t.lat,source:String(t.source||''),code:String(t.code||'')}:null});
      await page.evaluate(({before,after})=>{window.__M51_USER_DRAG_AUDIT={before,after,at:new Date().toISOString()}},{before,after});
    }
  }catch(e){harnessError=String(e?.message||e);}

  const snap=await page.evaluate(({target,fixture,harnessError})=>{
    const run=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
    const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
    const vis=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const final=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null;
    const pkg=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||window.EARTHLINE_LAST_ATOMIC_COUNTRY_PACKAGE_16845||null;
    const m=window.map||window.mapboxMap||null;
    let mapCenter=null;
    try{const c=m?.getCenter?.();if(c)mapCenter=[+c.lng,+c.lat];}catch{}
    const targetState=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const mapEl=document.getElementById('map');
    const mapStyle=mapEl?getComputedStyle(mapEl):null;
    return {
      target,harnessError,error:err&&String(err.error||err.message||err),
      fixtureResolved:fixture.resolved||null,
      runBounds:run?.bounds||vis?.bounds||null,
      visualFeatures:vis?.swales?.features||[],
      generated:Number(pub?.generated||0),visible:Number(disp?.swaleLines??pub?.generated??0),
      waterPaths:Number(run?.derived?.waterPaths||0),totalMs:Number(perf?.totalMs||0),
      finalSpread:final,
      packageKind:pkg?.packageKind||null,profileId:pkg?.profileId||null,
      packageBounds:pkg?.regionalExtent?.bbox||pkg?.location?.bbox||null,
      packageCenter:pkg?.center?[Number(pkg.center.lng),Number(pkg.center.lat)]:null,
      mapCenter,propertyTarget:targetState?{lng:+targetState.lng,lat:+targetState.lat,code:targetState.code||'',source:targetState.source||''}:null,
      targetWrites:target==='New Zealand'?(window.__M51_TARGET_WRITES||[]):undefined,
      targetTraceError:target==='New Zealand'?(window.__M51_TARGET_TRACE_ERROR||null):undefined,
      countryHandoffAudit:target==='New Zealand'?(window.EARTHLINE_COUNTRY_HANDOFF_AUDIT_16845||null):undefined,
      userDragAudit:target==='New Zealand'?(window.__M51_USER_DRAG_AUDIT||null):undefined,
      mapPointerEvents:mapStyle?.pointerEvents||null
    };
  },{target,fixture,harnessError});

  const bounds=snap.runBounds;
  const features=snap.visualFeatures||[];
  const vcells=cellsFromFeatures(features,bounds);
  const candidates=new Set(snap.finalSpread?.candidateCoverageCellKeys||[]);
  const centerCandidates=new Set(snap.finalSpread?.candidateCellKeys||[]);
  let swaleBounds=null;
  const pts=[];
  for(const f of features){
    const g=f?.geometry;
    const lines=g?.type==='LineString'?[g.coordinates]:g?.type==='MultiLineString'?(g.coordinates||[]):[];
    for(const line of lines)for(const p of line||[])if(Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]))pts.push([+p[0],+p[1]]);
  }
  if(pts.length){
    swaleBounds=[Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))];
  }
  let margins=null;
  if(swaleBounds&&Array.isArray(bounds)){
    const dx=Math.max(1e-9,bounds[2]-bounds[0]),dy=Math.max(1e-9,bounds[3]-bounds[1]);
    margins={
      west:(swaleBounds[0]-bounds[0])/dx,
      east:(bounds[2]-swaleBounds[2])/dx,
      south:(swaleBounds[1]-bounds[1])/dy,
      north:(bounds[3]-swaleBounds[3])/dy
    };
  }
  const missing=[...candidates].filter(k=>!vcells.has(k));
  const edge=k=>{const [x,y]=k.split(',').map(Number);return x<=1||x>=10||y<=1||y>=10;};
  rows.push({
    ...snap,visualFeatures:undefined,
    swaleBounds,margins,
    candidateCoverageCells:candidates.size,
    candidateCenterCells:centerCandidates.size,
    visibleCoverageCells:vcells.size,
    missingCandidateCoverageCells:missing.length,
    edgeCandidateCoverageCells:[...candidates].filter(edge).length,
    edgeVisibleCoverageCells:[...vcells].filter(edge).length,
    edgeMissing:missing.filter(edge),
  });
  console.log(JSON.stringify(rows[rows.length-1]));
  await page.close();
}
await browser.close();
console.log(JSON.stringify({summary:rows.map(r=>({target:r.target,generated:r.generated,visible:r.visible,totalMs:r.totalMs,margins:r.margins,candidateCoverageCells:r.candidateCoverageCells,visibleCoverageCells:r.visibleCoverageCells,edgeCandidateCoverageCells:r.edgeCandidateCoverageCells,edgeVisibleCoverageCells:r.edgeVisibleCoverageCells,edgeMissing:r.edgeMissing?.length,mapPointerEvents:r.mapPointerEvents,packageCenter:r.packageCenter,mapCenter:r.mapCenter,propertyTarget:r.propertyTarget,harnessError:r.harnessError,error:r.error}))}));
