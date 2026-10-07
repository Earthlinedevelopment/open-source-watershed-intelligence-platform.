import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{ if(m.type()==='error') errors.push('console:'+m.text()); });

async function regional(){
  await page.goto(URL+'?candidate17027='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value='Colorado'; i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true})); b.click();
  });
  await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    return String(d?.tier||d?.mode||'').toLowerCase()==='regional' && Number(p?.generated||0)>0;
  },{timeout:60000,polling:100});
  await page.waitForTimeout(600);
}

async function setA10(stale=false){
  return page.evaluate(stale=>{
    const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    const f=sw.find(x=>String(x.properties?.display_code||x.properties?.code||'').toUpperCase()==='A10')||sw[9]||sw[0];
    if(!f)return null;
    const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
    const t={lng:Number(c[0]),lat:Number(c[1]),source:'candidate-17027',code:'A10',score:Number(f.properties?.score||0),query:'Colorado',parentRunToken:stale?'stale-regional-token':String(d.runToken||''),at:new Date().toISOString()};
    window.EARTHLINE_PROPERTY_TARGET_16201=t;
    window.earthlineSetPropertyTarget16201?.(t);
    return t;
  },stale);
}

async function runProperty(){
  return page.evaluate(async()=>{
    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof fn!=='function')return {ok:false,error:'no property owner'};
    try{
      const out=await Promise.resolve(fn());
      return {ok:out!==false,out};
    }catch(e){return {ok:false,error:String(e?.stack||e)}}
  });
}

await regional();
const staleTarget=await setA10(true);
const staleResult=await runProperty();
await page.waitForTimeout(250);
const staleSnap=await page.evaluate(()=>({
  handoff:window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null,
  status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),
  tier:String(document.documentElement.dataset.earthlineAnalysisTier||'')
}));
if(staleResult.ok)throw new Error('stale target unexpectedly allowed');
if(staleSnap.handoff?.validParent!==false)throw new Error('stale target did not fail closed');

await regional();
const validTarget=await setA10(false);

// Prove redundant bookkeeping staleness no longer blocks a published visible corridor.
await page.evaluate(()=>{
  try{ if(window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970) window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970={...window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970,runToken:'secondary-stale-live-token'}; }catch(_){}
  try{ window.EARTHLINE_ACTIVE_RUN_TOKEN_16151='secondary-stale-active-token'; }catch(_){}
  try{ document.documentElement.dataset.earthlineRunState='idle'; }catch(_){}
});
const validResult=await runProperty();
if(!validResult.ok)throw new Error('valid published target blocked '+JSON.stringify(validResult));
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:60000,polling:100});
await page.waitForTimeout(1200);

const snap=await page.evaluate(()=>{
  const m=(typeof M!=='undefined'?M:null);
  const fc=m?.authoritativeSafeSwales15815;
  const feats=Array.isArray(fc?.features)?fc.features:[];
  const frame=Array.isArray(m?.analysisBoundaryLngLat)?m.analysisBoundaryLngLat:[];
  const all=frame.filter(p=>Array.isArray(p)&&p.length>=2);
  const xs=all.map(p=>Number(p[0])).filter(Number.isFinite),ys=all.map(p=>Number(p[1])).filter(Number.isFinite);
  const bbox=xs.length&&ys.length?{minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)}:null;
  const cells=new Set(),halves={left:0,right:0,top:0,bottom:0};
  if(bbox){
    for(const f of feats){
      const cs=f?.geometry?.coordinates||[]; if(!cs.length)continue;
      const c=cs[Math.floor((cs.length-1)/2)],x=Number(c?.[0]),y=Number(c?.[1]); if(!Number.isFinite(x)||!Number.isFinite(y))continue;
      const nx=(x-bbox.minX)/Math.max(1e-12,bbox.maxX-bbox.minX),ny=(y-bbox.minY)/Math.max(1e-12,bbox.maxY-bbox.minY);
      const ix=Math.max(0,Math.min(3,Math.floor(nx*4))),iy=Math.max(0,Math.min(3,Math.floor(ny*4)));
      cells.add(ix+','+iy);
      if(nx<.5)halves.left++;else halves.right++;
      if(ny<.5)halves.bottom++;else halves.top++;
    }
  }
  const evidence=window.earthlineGetExclusionEvidence16516?.()||null;
  return {
    handoff:window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null,
    property:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
    scoreOrder:window.EARTHLINE_REGIONAL_SCORE_ORDER_16717||null,
    supportedCapacity:window.EARTHLINE_SUPPORTED_CAPACITY_16843||null,
    evidence,
    safeCount:feats.length,
    occupied4x4Cells:cells.size,
    halves,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),
    evidenceText:String(document.getElementById('earthlineExclusionEvidence16516')?.textContent||''),
    dragPanEnabled:(window.earthlineMap||globalThis.earthlineMap)?.dragPan?.isEnabled?.()??null
  };
});

if(snap.handoff?.validParent!==true)throw new Error('valid handoff audit false '+JSON.stringify(snap.handoff));
if(Number(snap.supportedCapacity?.capacity)!==52)throw new Error('Property capacity is not 52 '+JSON.stringify(snap.supportedCapacity));
if(Number(snap.scoreOrder?.chosen||0)>52)throw new Error('chosen candidates exceed 52 '+JSON.stringify(snap.scoreOrder));
if(snap.evidence?.acquisitionResult==='screened-clear'){
  if(snap.evidence?.kind!=='open-data')throw new Error('screened-clear rendered as wrong kind '+JSON.stringify(snap.evidence));
  if(/must remain blocked/i.test(snap.evidenceText))throw new Error('screened-clear still claims publication blocked');
}
if(snap.dragPanEnabled===false)throw new Error('dragPan disabled after Property');

// Physical map-drag check.
const before=await page.evaluate(()=>{const m=window.earthlineMap||globalThis.earthlineMap;const c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat}:null});
const box=await page.locator('.mapboxgl-canvas').boundingBox();
if(box){
  const x=box.x+box.width*.58,y=box.y+box.height*.55;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+160,y+70,{steps:10});await page.mouse.up();await page.waitForTimeout(500);
}
const after=await page.evaluate(()=>{const m=window.earthlineMap||globalThis.earthlineMap;const c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat}:null});
const moved=!!(before&&after&&(Math.abs(before.lng-after.lng)>1e-7||Math.abs(before.lat-after.lat)>1e-7));
if(box&&!moved)throw new Error('map did not move after Property');

console.log('CANDIDATE_17027_PASS '+JSON.stringify({staleTarget,staleResult,staleSnap,validTarget,validResult,snap,before,after,moved,errors:errors.slice(0,20)}));
await browser.close();