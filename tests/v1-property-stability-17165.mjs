import { chromium } from 'playwright';
import { mkdirSync, readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const BASE='https://earthlinedevelopment.org/';
const ROOT=process.cwd();
const OUT='artifacts/v1-property-stability-17165';
mkdirSync(OUT,{recursive:true});
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json','.png':'image/png','.svg':'image/svg+xml','.py':'text/plain; charset=utf-8'};

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1908,height:882},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.route('https://earthlinedevelopment.org/**',async route=>{
  const u=new URL(route.request().url());
  let rel=decodeURIComponent(u.pathname.replace(/^\/+/,''))||'index.html';
  if(rel.endsWith('/'))rel+='index.html';
  const local=resolve(ROOT,rel);
  if(local.startsWith(ROOT)&&existsSync(local)&&statSync(local).isFile()){
    return route.fulfill({status:200,body:readFileSync(local),headers:{'content-type':MIME[extname(local).toLowerCase()]||'application/octet-stream','cache-control':'no-store','x-earthline-v1-repair':'17165'}});
  }
  return route.continue();
});

await page.goto(BASE+'?v1stability17165='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
const input=page.locator('#searchInput');
await input.fill('California');
await page.waitForTimeout(900);
const options=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await options.count()))throw new Error('No California suggestion');
await options.first().click();
await page.waitForTimeout(250);
await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:150});

const hint=page.locator('#earthlineCrosshairMoveHint17093');
if(!(await hint.isVisible()))throw new Error('Approved bare-land crosshair hint missing');
const gotIt=hint.getByRole('button',{name:/got it|dismiss/i});
if(await gotIt.count())await gotIt.click();

const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
if(!(await hit.count()))throw new Error('No Regional corridor');
await hit.click({force:true});
await page.waitForTimeout(250);
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count()))throw new Error('Zoom button missing');
await zoom.click();
await page.waitForTimeout(900);

const prop=page.locator('#earthlineDeclareProperty16169');
const zoomButtonText=String(await prop.innerText()).replace(/\s+/g,' ').trim();
const zoomButtonHtml=await prop.evaluate(el=>el.outerHTML);
if(!/^CROSSHAIR\b/i.test(zoomButtonText))throw new Error('Zoom did not expose CROSSHAIR Property button: '+zoomButtonText);
if(!/data-crosshair16247="1"/.test(zoomButtonHtml))throw new Error('Crosshair state marker missing after Zoom');

const prePrime=await page.evaluate(()=>window.EARTHLINE_ELDER_PROPERTY_PRIME_17165||null);
if(!prePrime)throw new Error('Elder prefetch did not begin from Zoom');

const preSerial=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
const clickAt=Date.now();
await prop.click();
await page.waitForTimeout(100);
const immediateGauge=await page.evaluate(()=>String(document.getElementById('earthlineElderTreesGauge17097')?.textContent||'').trim());
if(!/analyzing Property canopy/i.test(immediateGauge))throw new Error('Stale Regional Elder count remained after Property click: '+immediateGauge);

await page.waitForFunction(({preSerial})=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
  return a?.settled===true&&Number(a?.serial||0)>preSerial;
},{preSerial},{timeout:45000,polling:150});
const settledAt=Date.now();

const swale=await page.evaluate(()=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  const layers=(a?.safeFallback?.audit?.visibleLayers||[]).filter(id=>m?.getLayer?.(id));
  let rendered=0;
  try{
    const r=m?.getCanvas?.()?.getBoundingClientRect?.();
    if(r&&layers.length)rendered=m.queryRenderedFeatures([[10,10],[Math.max(11,r.width-10),Math.max(11,r.height-10)]],{layers}).length;
  }catch(_){}
  return {
    corridors:Number(a?.corridors||0),
    settled:a?.settled===true,
    renderVerified:a?.renderVerified===true,
    renderMode:a?.renderMode||'',
    fallbackVisible:a?.safeFallback?.visible===true,
    fallbackCount:Number(a?.safeFallback?.count||0),
    layers,
    rendered
  };
});
if(!swale.settled||swale.corridors<=0)throw new Error('Property produced no swale corridors: '+JSON.stringify(swale));
if(!swale.fallbackVisible||swale.fallbackCount<=0)throw new Error('Property swales computed but visible fallback failed: '+JSON.stringify(swale));
if(swale.rendered<=0)throw new Error('Property swales not actually rendered: '+JSON.stringify(swale));

await page.waitForFunction(()=>{
  const x=window.EARTHLINE_ELDER_TREE_LAST_17097;
  return x?.summary?.coverageDatasetIds?.includes('dynamic-property-17130')&&Number(x?.featureCount||0)>0&&Number(x?.summary?.modeled||0)>0;
},{timeout:120000,polling:250});
const elderAt=Date.now();

await page.waitForTimeout(500);
await page.screenshot({path:OUT+'/property-1.png',animations:'disabled'});

const first=await page.evaluate(()=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const last=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
  const src=m?.getSource?.('earthline-elder-trees-17097');
  let data=null;try{data=src?._data||src?._options?.data||null}catch(_){}
  let rendered=0;
  try{
    const r=m.getCanvas().getBoundingClientRect();
    rendered=m.queryRenderedFeatures([[10,10],[r.width-10,r.height-10]],{layers:['earthline-elder-tree-points-17097']}).length;
  }catch(_){}
  const poly=window.M?.analysisBoundaryLngLat||[];
  return {last,features:data?.features||[],rendered,poly,audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null};
});
if(first.rendered<=0)throw new Error('Fresh Elder points exist but are not rendered');

let bbox=[Infinity,Infinity,-Infinity,-Infinity];
for(const p of first.poly){
  if(!Array.isArray(p))continue;
  bbox[0]=Math.min(bbox[0],+p[0]);bbox[1]=Math.min(bbox[1],+p[1]);bbox[2]=Math.max(bbox[2],+p[0]);bbox[3]=Math.max(bbox[3],+p[1]);
}
const full=await page.evaluate(async bbox=>{
  const worker=new Worker('/earthline-elder-worker-17129.js?full17165='+Date.now(),{type:'module'});
  let seq=0;const pending=new Map();
  worker.onmessage=e=>{const p=pending.get(e.data?.id);if(p){pending.delete(e.data.id);p.resolve(e.data)}};
  const ask=(payload,timeout=180000)=>new Promise((resolve,reject)=>{
    const id='q'+(++seq);pending.set(id,{resolve,reject});worker.postMessage({...payload,id});
    setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(new Error('worker timeout'))}},timeout);
  });
  await ask({warm:true},180000);
  const r=await ask({bbox,options:{displayPerTile:240,maxPerTile:240}},180000);
  worker.terminate();
  return {features:r.result?.features||[],pool:Number(r.result?.earthline?.candidate_pool_count||0)};
},bbox);

function quadrants(features,b){
  const [w,s,e,n]=b,mx=(w+e)/2,my=(s+n)/2,q=[0,0,0,0];
  for(const f of features){
    const c=f?.geometry?.coordinates;if(!Array.isArray(c))continue;
    const ix=Number(c[0])>=mx?1:0,iy=Number(c[1])>=my?1:0;q[iy*2+ix]++;
  }
  return q;
}
const displayQ=quadrants(first.features,bbox),fullQ=quadrants(full.features,bbox);
for(let i=0;i<4;i++){
  if(fullQ[i]>=3&&displayQ[i]===0)throw new Error('Spatial Elder thinning left candidate-rich quadrant '+i+' blank: '+JSON.stringify({displayQ,fullQ}));
}

// Repeat Property after a real user drag; must be fresh, not the first result.
const firstAt=String(first.last?.at||'');
const canvas=page.locator('.mapboxgl-canvas').first();
const mb=await canvas.boundingBox();
if(!mb)throw new Error('Map canvas missing');
const sx=mb.x+mb.width*.70,sy=mb.y+mb.height*.60;
await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(sx-55,sy+4,{steps:8});await page.mouse.up();
await page.waitForTimeout(900);
const repeatText=String(await prop.innerText()).replace(/\s+/g,' ').trim();
if(!/^CROSSHAIR\b/i.test(repeatText))throw new Error('Map drag lost CROSSHAIR Property state: '+repeatText);
const serial2=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await prop.click();
await page.waitForFunction(({serial2})=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return a?.settled===true&&Number(a?.serial||0)>serial2},{serial2},{timeout:45000,polling:150});
await page.waitForFunction(({firstAt})=>{
  const x=window.EARTHLINE_ELDER_TREE_LAST_17097;
  return x?.summary?.coverageDatasetIds?.includes('dynamic-property-17130')&&Number(x?.featureCount||0)>0&&Number(x?.summary?.modeled||0)>0&&String(x?.at||'')!==firstAt;
},{firstAt},{timeout:120000,polling:250});
await page.waitForTimeout(500);
await page.screenshot({path:OUT+'/property-2.png',animations:'disabled'});

const second=await page.evaluate(()=>{
 const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
 const x=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
 let rendered=0;try{const r=m.getCanvas().getBoundingClientRect();rendered=m.queryRenderedFeatures([[10,10],[r.width-10,r.height-10]],{layers:['earthline-elder-tree-points-17097']}).length}catch(_){}
 return {elder:x,rendered,audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null};
});
if(second.rendered<=0)throw new Error('Second Property has no rendered Elder points');
if(Number(second.audit?.corridors||0)<=0||second.audit?.safeFallback?.visible!==true)throw new Error('Second Property swales regressed');

const report={
  zoomButtonText,
  prePrime,
  immediateGauge,
  timing:{propertySettleMs:settledAt-clickAt,elderReadyMs:elderAt-clickAt,elderAfterPropertySettleMs:elderAt-settledAt},
  swale,
  first:{summary:first.last?.summary||null,featureCount:first.last?.featureCount||0,rendered:first.rendered,candidatePool:first.last?.dynamicCandidatePoolCount||0},
  spatial:{displayQ,fullQ,fullPool:full.pool},
  second:{summary:second.elder?.summary||null,featureCount:second.elder?.featureCount||0,rendered:second.rendered,corridors:second.audit?.corridors||0},
  errors
};
writeFileSync(OUT+'/result.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_V1_PROPERTY_STABILITY_17165 '+JSON.stringify(report));
await browser.close();
if(errors.length)throw new Error('Page errors: '+JSON.stringify(errors));
