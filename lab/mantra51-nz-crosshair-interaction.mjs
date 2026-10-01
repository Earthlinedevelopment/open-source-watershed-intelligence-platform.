import { chromium } from 'playwright';

const PROD=process.env.EARTHLINE_PROD||'https://earthlinedevelopment.org/';
const CAND=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});

async function nzFixture(){
  const page=await browser.newPage({viewport:{width:1500,height:860}});
  await page.goto(PROD+'?m51-nz-fixture='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof window.geocodeMapbox==='function',{timeout:30000});
  const raw=await page.evaluate(async()=>{
    const original=window.fetch.bind(window);
    let captured=null;
    window.fetch=async(...args)=>{
      const r=await original(...args);
      try{
        const u=String(args[0]||'');
        if(u.includes('api.mapbox.com/geocoding/'))captured=await r.clone().json();
      }catch{}
      return r;
    };
    await geocodeMapbox('New Zealand');
    return captured;
  });
  await page.close();
  if(!raw?.features?.length)throw new Error('NZ production geocoder fixture unavailable');
  return raw;
}

const fixture=await nzFixture();
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.goto(CAND+'?m51-nz-interaction='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});

await page.evaluate(raw=>{
  const original=window.fetch.bind(window);
  window.fetch=async(url,opts)=>{
    const u=String(url||'');
    if(u.includes('api.mapbox.com/geocoding/'))return new Response(JSON.stringify(raw),{status:200,headers:{'content-type':'application/json'}});
    return original(url,opts);
  };
  const i=document.getElementById('searchInput');
  const b=document.getElementById('runBtn');
  i.value='New Zealand';
  i.dispatchEvent(new Event('input',{bubbles:true}));
  i.dispatchEvent(new Event('change',{bubbles:true}));
  b.click();
},fixture);

await page.waitForFunction(()=>{
  const d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;
  const t=window.EARTHLINE_PROPERTY_TARGET_16201;
  return String(d?.query||'').trim().toLowerCase()==='new zealand' && t?.source==='country-center';
},{timeout:100000,polling:100});

const before=await page.evaluate(()=>{
  const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.map||window.mapboxMap;
  const c=m?.getCenter?.();
  const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  return {center:c?[+c.lng,+c.lat]:null,target:t?{lng:+t.lng,lat:+t.lat,source:String(t.source||'')}:null,lock:window.EARTHLINE_COUNTRY_TARGET_LOCK_16845};
});

await page.evaluate(()=>{
  window.__M51_POINTERS=[];
  window.__M51_MOVEENDS=0;
  document.addEventListener('pointerdown',e=>{
    const mapEl=document.getElementById('map');
    window.__M51_POINTERS.push({tag:e.target&&e.target.tagName||'',id:e.target&&e.target.id||'',insideMap:!!(mapEl&&(e.target===mapEl||mapEl.contains(e.target))),lock:window.EARTHLINE_COUNTRY_TARGET_LOCK_16845});
  },true);
  const m=window.map||window.mapboxMap;
  try{m&&m.on&&m.on('moveend',()=>{window.__M51_MOVEENDS++})}catch{}
});
const canvas=page.locator('#mapboxBase canvas.mapboxgl-canvas').first();
const mapBox=await canvas.boundingBox();
if(!mapBox)throw new Error('real Mapbox canvas unavailable');
const x=mapBox.x+mapBox.width*0.55, y=mapBox.y+mapBox.height*0.55;
const realDiag=await page.evaluate(({x,y})=>{
  const c=document.querySelector('#mapboxBase canvas.mapboxgl-canvas');
  const b=document.getElementById('mapboxBase');
  const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||null;
  return {
    canvasPointerEvents:c?getComputedStyle(c).pointerEvents:null,
    basePointerEvents:b?getComputedStyle(b).pointerEvents:null,
    dragPan:m?.dragPan?.isEnabled?.()??null,
    center:m?.getCenter?.()?.toArray?.()||null,
    nzRelease:!!window.EARTHLINE_NZ_REAL_CANVAS_RELEASE_16913,
    hit:document.elementsFromPoint(x,y).slice(0,12).map(el=>{let a=el,p=[];for(let i=0;i<5&&a;i++,a=a.parentElement)p.push({tag:a.tagName,id:a.id||'',cls:String(a.className?.baseVal||a.className||''),pe:getComputedStyle(a).pointerEvents,z:getComputedStyle(a).zIndex});return {tag:el.tagName,id:el.id||'',cls:String(el.className?.baseVal||el.className||''),pe:getComputedStyle(el).pointerEvents,z:getComputedStyle(el).zIndex,ancestors:p}})
  };
},{x,y});
console.log(JSON.stringify({realDiag,mapBox}));
await page.mouse.move(x,y);
await page.mouse.down();
await page.mouse.move(x+180,y+90,{steps:12});
await page.mouse.up();

await page.waitForTimeout(2500);

const after=await page.evaluate(()=>{
  const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.map||window.mapboxMap;
  const c=m?.getCenter?.();
  const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  const mapEl=document.getElementById('map');
  const style=mapEl?getComputedStyle(mapEl):null;
  return {center:c?[+c.lng,+c.lat]:null,target:t?{lng:+t.lng,lat:+t.lat,source:String(t.source||'')}:null,lock:window.EARTHLINE_COUNTRY_TARGET_LOCK_16845,pointers:window.__M51_POINTERS||[],moveends:window.__M51_MOVEENDS||0,mapPointerEvents:style?.pointerEvents||null};
});
console.log(JSON.stringify({diagnostic:true,before,after}));


const ui=await page.evaluate(()=>Array.from(document.querySelectorAll('button')).map(b=>({id:b.id||'',text:(b.innerText||b.textContent||'').trim(),disabled:!!b.disabled,display:getComputedStyle(b).display,visibility:getComputedStyle(b).visibility})).filter(x=>x.text||x.id));
console.log(JSON.stringify({uiButtons:ui}));

const moved=Math.hypot(after.target.lng-before.target.lng,after.target.lat-before.target.lat);
console.log(JSON.stringify({before,after,movedDegrees:moved}));
if(before.target?.source!=='country-center')throw new Error('NZ did not start at authoritative country center');
if(after.target?.source!=='crosshair')throw new Error('target did not transfer to user crosshair');
if(moved<0.02)throw new Error('crosshair target did not materially move');

// NZ dateline direction gate: drag the map LEFT (toward +180 / the dateline).
const beforeLeft=await page.evaluate(()=>({
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  dateline:window.EARTHLINE_NZ_DATELINE_NAV_16845||null
}));
await page.mouse.move(x,y);
await page.mouse.down();
await page.mouse.move(x-420,y,{steps:14});
await page.mouse.up();
await page.waitForTimeout(1800);
const afterLeft=await page.evaluate(()=>({
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  dateline:window.EARTHLINE_NZ_DATELINE_NAV_16845||null
}));
console.log(JSON.stringify({beforeLeft,afterLeft}));
if(afterLeft.dateline?.enabled!==true)throw new Error('NZ dateline navigation was not enabled');
const leftMoved=Math.hypot(Number(afterLeft.target?.lng)-Number(beforeLeft.target?.lng),Number(afterLeft.target?.lat)-Number(beforeLeft.target?.lat));
if(!(leftMoved>0.02))throw new Error('NZ map still cannot move left toward/across dateline');

// Exact user path: launch the actual Property Analysis control after moving the crosshair.
await page.evaluate(()=>{
  window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529=null;
  window.EARTHLINE_PROPERTY_DECLARATION_16169=null;
  const b=document.getElementById('earthlineDeclareProperty16169');
  if(!b)throw new Error('PROPERTY ANALYSIS button missing');
  b.click();
});
await page.waitForFunction(()=>{
  const g=window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529;
  const d=window.EARTHLINE_PROPERTY_DECLARATION_16169;
  return !!g||!!d;
},{timeout:15000,polling:100});
const propertyStart=await page.evaluate(()=>({
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  waterGate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null,
  declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
  launchAudit:(window.EARTHLINE_PROPERTY_LAUNCH_AUDIT_16322||[]).slice(-5)
}));
console.log(JSON.stringify({propertyStart}));
const consumed=(propertyStart.waterGate&&propertyStart.waterGate.center)||(propertyStart.declaration&&propertyStart.declaration.center)||null;
if(!consumed||!Number.isFinite(Number(consumed.lng))||!Number.isFinite(Number(consumed.lat)))throw new Error('Property engine did not expose consumed center');
const consumeDelta=Math.hypot(Number(consumed.lng)-after.target.lng,Number(consumed.lat)-after.target.lat);
console.log(JSON.stringify({crosshairTarget:after.target,propertyConsumedCenter:consumed,consumeDelta}));
if(consumeDelta>0.02)throw new Error('Property engine replaced the moved NZ crosshair target');

// Require the final published Property result to retain the moved crosshair center.
let finalWaitError=null;
try{
  await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
    const root=document.documentElement;
    const failed=String(root.dataset.earthlinePropertyRunState||'').toLowerCase()==='failed'||
                 String(root.dataset.earthlineRunState||'').toLowerCase()==='failed';
    return (tier==='property' && p && p.published===true)||failed;
  },null,{timeout:70000,polling:250});
}catch(e){finalWaitError=String(e&&e.message||e)}

const propertyFinal=await page.evaluate(()=>({
  displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
  publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
  declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  waterGate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null,
  modelLoc:(window.earthlineModel&&window.earthlineModel.loc)||null,
  timeoutAudit:window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178||null,
  runAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  phaseTrace:window.EARTHLINE_PROPERTY_PHASE_TRACE_16319||null,
  activeStage:window.EARTHLINE_PROPERTY_ACTIVE_STAGE_16178||null,
  lastFailure:window.EARTHLINE_PROPERTY_LAST_FAILURE_16539||window.EARTHLINE_PROPERTY_FAILURE_16539||null,
  dataset:{
    tier:document.documentElement.dataset.earthlineAnalysisTier||'',
    runState:document.documentElement.dataset.earthlineRunState||'',
    propertyState:document.documentElement.dataset.earthlinePropertyRunState||''
  }
}));
console.log(JSON.stringify({finalWaitError,propertyFinal}));
const finalCenter=(propertyFinal.declaration&&propertyFinal.declaration.center)||
                  (propertyFinal.waterGate&&propertyFinal.waterGate.center)||
                  (propertyFinal.publication&&propertyFinal.publication.center)||null;
if(finalWaitError)throw new Error('NZ Property did not reach terminal publication: '+finalWaitError+' state='+JSON.stringify(propertyFinal));
if(String(propertyFinal.dataset?.runState||'').toLowerCase()==='failed'||String(propertyFinal.dataset?.propertyState||'').toLowerCase()==='failed')throw new Error('NZ Property pipeline failed after moved crosshair: '+JSON.stringify(propertyFinal));
if(!finalCenter)throw new Error('final Property publication exposed no center: '+JSON.stringify(propertyFinal));
const finalDelta=Math.hypot(Number(finalCenter.lng)-after.target.lng,Number(finalCenter.lat)-after.target.lat);
console.log(JSON.stringify({finalCrosshairTarget:after.target,finalPublishedCenter:finalCenter,finalDelta}));
if(finalDelta>0.02)throw new Error('Final NZ Property publication is not centered on moved crosshair');

await browser.close();
