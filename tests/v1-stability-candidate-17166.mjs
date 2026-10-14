import { chromium } from 'playwright';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const ROOT=process.cwd(),BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/v1-stability-17166';mkdirSync(OUT,{recursive:true});
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json','.png':'image/png','.svg':'image/svg+xml','.py':'text/plain; charset=utf-8'};
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1908,height:882}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('https://earthlinedevelopment.org/**',async route=>{
 const u=new URL(route.request().url());let rel=decodeURIComponent(u.pathname.replace(/^\/+/,''))||'index.html';
 if(rel.endsWith('/'))rel+='index.html';
 const local=resolve(ROOT,rel);
 if(local.startsWith(ROOT)&&existsSync(local)&&statSync(local).isFile()){
  return route.fulfill({status:200,body:readFileSync(local),headers:{'content-type':MIME[extname(local).toLowerCase()]||'application/octet-stream','cache-control':'no-store','x-earthline-v1-candidate':'17166'}});
 }
 return route.continue();
});
await page.goto(BASE+'?v1candidate17166='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});

const input=page.locator('#searchInput');await input.fill('California');await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await opts.count()))throw new Error('No California suggestion');
await opts.first().click();await page.waitForTimeout(250);await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:150});

const hint=page.locator('#earthlineCrosshairMoveHint17093');
if(!(await hint.isVisible()))throw new Error('Approved crosshair movement hint missing');
const got=hint.getByRole('button',{name:/got it|dismiss/i});if(await got.count())await got.click();

const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
if(!(await hit.count()))throw new Error('No Regional corridor');
await hit.click({force:true});await page.waitForTimeout(250);
const beforeZoom=String(await page.locator('#earthlineDeclareProperty16169').innerText()).replace(/\s+/g,' ').trim();
if(!/^[ABC]\d+\s*·\s*ANALYZE/i.test(beforeZoom))throw new Error('Expected corridor-coded Property target before Zoom, got '+beforeZoom);
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count()))throw new Error('Zoom to location button missing');
await zoom.click();
await page.waitForFunction(()=>/^CROSSHAIR\b/i.test(String(document.getElementById('earthlineDeclareProperty16169')?.innerText||'')),{timeout:8000,polling:100});
const crosshair=await page.evaluate(()=>({
 text:String(document.getElementById('earthlineDeclareProperty16169')?.innerText||'').replace(/\s+/g,' ').trim(),
 flag:document.querySelector('#earthlineDeclareProperty16169 [data-crosshair16247]')?.dataset.crosshair16247||'',
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null
}));
if(crosshair.flag!=='1'||crosshair.target?.code)throw new Error('Zoom did not hand target to crosshair: '+JSON.stringify(crosshair));

const btn=page.locator('#earthlineDeclareProperty16169');
const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
const t0=Date.now();await btn.click();
await page.waitForFunction(()=>{
 const x=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
 const gauge=String(document.getElementById('earthlineElderTreesGauge17097')?.textContent||'');
 return x?.state==='property-pending'&&/analyzing Property canopy/i.test(gauge);
},{timeout:5000,polling:80});
const pendingMs=Date.now()-t0;

await page.waitForFunction(({pre})=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return a?.settled===true&&Number(a?.serial||0)>pre},{pre},{timeout:45000,polling:150});
const settledMs=Date.now()-t0;
const property=await page.evaluate(()=>{
 const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
 const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
 let visibleSafe=0;
 try{
  const ids=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'].filter(id=>m?.getLayer?.(id));
  if(ids.length){const r=m.getCanvas().getBoundingClientRect();visibleSafe=m.queryRenderedFeatures([[10,10],[r.width-10,r.height-10]],{layers:ids}).length}
 }catch(_){}
 return {audit:a,visibleSafe};
});
if(property.audit?.result!==true||Number(property.audit?.corridors||0)<=0)throw new Error('Property swale result failed: '+JSON.stringify(property));
if(property.visibleSafe<=0&&property.audit?.renderVerified!==true)throw new Error('Property swales not visibly verified');

await page.waitForFunction(()=>{
 const x=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
 return x?.state==='committed'&&x?.summary?.coverageDatasetIds?.includes('dynamic-property-17130')&&Number(x?.featureCount||0)>0&&Number(x?.summary?.modeled||0)>0;
},{timeout:90000,polling:250});
const elderMs=Date.now()-t0;
let firstVisibleMs=null;
for(let attempt=0;attempt<80;attempt++){
  const n=await page.evaluate(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    try{
      if(!m?.getLayer?.('earthline-elder-tree-points-17097'))return 0;
      const canvas=m.getCanvas();
      return m.queryRenderedFeatures([[0,0],[canvas.clientWidth||canvas.width,canvas.clientHeight||canvas.height]],{layers:['earthline-elder-tree-points-17097']}).length;
    }catch(_){return 0}
  });
  if(n>0){firstVisibleMs=Date.now()-t0;break}
  await page.waitForTimeout(250);
}
const elder=await page.evaluate(()=>{
 const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),x=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
 let rendered=0,coords=[];
 try{const r=m.getCanvas().getBoundingClientRect();const fs=m.queryRenderedFeatures([[10,10],[r.width-10,r.height-10]],{layers:['earthline-elder-tree-points-17097']});rendered=fs.length;coords=fs.map(f=>f.geometry?.coordinates||null)}catch(_){}
 return {last:x,rendered,coords,boundary:window.M?.analysisBoundaryLngLat||[]};
});
if(elder.rendered<=0){
 const diag=await page.evaluate(()=>{
   const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
   const src=m?.getSource?.('earthline-elder-trees-17097');
   const layer=m?.getLayer?.('earthline-elder-tree-points-17097');
   const b=m?.getBounds?.();
   let sourceCount=null,sourceData=null,visibility=null,images={};
   try{sourceData=src?._data||src?._options?.data||null;sourceCount=Array.isArray(sourceData?.features)?sourceData.features.length:null}catch(_){}
   try{visibility=layer?m.getLayoutProperty('earthline-elder-tree-points-17097','visibility'):null}catch(_){}
   for(const id of ['earthline-elder-pin-verified','earthline-elder-pin-lidar','earthline-elder-pin-modeled']){try{images[id]=!!m?.hasImage?.(id)}catch(_){images[id]=false}}
   return {
     sourceExists:!!src,layerExists:!!layer,sourceCount,visibility,images,
     mapBounds:b?{west:b.getWest(),south:b.getSouth(),east:b.getEast(),north:b.getNorth()}:null,
     zoom:m?.getZoom?.(),center:m?.getCenter?.(),
     elderFeatures:window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()||[],
     last:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
     propertyBoundary:window.M?.analysisBoundaryLngLat||[]
   };
 });
 console.log('ELDER_RENDER_DIAG '+JSON.stringify(diag));
 await page.screenshot({path:OUT+'/elder-render-failure.png',animations:'disabled'});
 throw new Error('Fresh Elder data committed but no pins rendered within 20s: '+JSON.stringify({pendingMs,settledMs,elderMs,firstVisibleMs,diag}));
}
await page.screenshot({path:OUT+'/property.png',animations:'disabled'});

// Direct known-positive spatial check: every quadrant with >=3 pool candidates must be represented.
const target={lat:37.41924,lng:-119.30853};
const side=Math.sqrt(20*4046.8564224),half=side/2,dLat=half/111320,dLng=half/(111320*Math.cos(target.lat*Math.PI/180));
const bbox=[target.lng-dLng,target.lat-dLat,target.lng+dLng,target.lat+dLat];
const spatial=await page.evaluate(async bbox=>{
 const worker=new Worker('/earthline-elder-worker-17129.js?spatial='+Date.now(),{type:'module'});let seq=0;const pending=new Map();
 worker.onmessage=e=>{const p=pending.get(e.data?.id);if(p){pending.delete(e.data.id);p.resolve(e.data)}};
 const ask=(payload,timeout=180000)=>new Promise((resolve,reject)=>{const id='q'+(++seq);pending.set(id,{resolve,reject});worker.postMessage({...payload,id});setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(new Error('timeout'))}},timeout)});
 await ask({warm:true},180000);const r=await ask({bbox,options:{displayPerTile:24,maxPerTile:240}},180000);worker.terminate();
 return {pool:r.result?.candidatePool||[],display:r.result?.features||[],earthline:r.result?.earthline||null};
},bbox);
const quadrants=features=>{const [w,s,e,n]=bbox,mx=(w+e)/2,my=(s+n)/2,q=[0,0,0,0];for(const f of features){const c=f?.geometry?.coordinates;if(!c)continue;q[(c[1]>=my?2:0)+(c[0]>=mx?1:0)]++}return q};
const poolQ=quadrants(spatial.pool),displayQ=quadrants(spatial.display);
const missed=[];for(let i=0;i<4;i++)if(poolQ[i]>=3&&displayQ[i]===0)missed.push(i);
if(missed.length)throw new Error('Spatial thinning left populated quadrants empty: '+JSON.stringify({poolQ,displayQ,missed}));

const report={crosshair,pendingMs,settledMs,elderMs,firstVisibleMs,property,elder:{summary:elder.last?.summary,featureCount:elder.last?.featureCount,rendered:elder.rendered},spatial:{pool:Number(spatial.earthline?.candidate_pool_count||0),display:Number(spatial.earthline?.display_count||0),poolQ,displayQ,missed},errors};
writeFileSync(OUT+'/result.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_V1_STABILITY_17166 '+JSON.stringify(report));
await browser.close();
if(errors.length)throw new Error('Page errors '+JSON.stringify(errors));
