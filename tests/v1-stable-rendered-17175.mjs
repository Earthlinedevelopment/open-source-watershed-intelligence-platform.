import { chromium } from 'playwright';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const BASE='https://earthlinedevelopment.org/';
const ROOT=process.cwd();
const OUT='artifacts/v1-stable-rendered-17175';
mkdirSync(OUT,{recursive:true});
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.py':'text/plain; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
const KNOWN={lat:37.41924,lng:-119.30853};

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1908,height:882},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.route('https://earthlinedevelopment.org/**',async route=>{
  const u=new URL(route.request().url());
  let rel=decodeURIComponent(u.pathname.replace(/^\/+/,''))||'index.html';
  if(rel.endsWith('/'))rel+='index.html';
  const local=resolve(ROOT,rel);
  if(local.startsWith(ROOT)&&existsSync(local)&&statSync(local).isFile()){
    return route.fulfill({status:200,body:readFileSync(local),headers:{'content-type':MIME[extname(local).toLowerCase()]||'application/octet-stream','cache-control':'no-store','x-earthline-v1-candidate':'17175'}});
  }
  return route.continue();
});

await page.goto(BASE+'?v1stable17175='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
const input=page.locator('#searchInput');
await input.fill('California'); await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await opts.count()))throw new Error('No California suggestion');
await opts.first().click(); await page.waitForTimeout(250);
await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:150});
const regionalElder=await page.evaluate(()=>window.EARTHLINE_ELDER_TREE_LAST_17097||null);

const hint=page.locator('#earthlineCrosshairMoveHint17093');
if(await hint.isVisible()){const b=hint.getByRole('button',{name:/dismiss crosshair movement hint|got it/i});if(await b.count())await b.click()}

const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
if(!(await hit.count()))throw new Error('No Regional corridor');
await hit.click({force:true}); await page.waitForTimeout(250);
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count()))throw new Error('Zoom button missing');
await zoom.click();
await page.waitForTimeout(1600);
const zoomButtonText=String(await page.locator('#earthlineDeclareProperty16169').innerText()).replace(/\s+/g,' ').trim();
if(!/^CROSSHAIR\b/i.test(zoomButtonText))throw new Error('Zoom did not hand Property button to CROSSHAIR: '+zoomButtonText);

// Retarget to known forested control, preserving the real map/crosshair path.
await page.evaluate(({lng,lat})=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  m.jumpTo({center:[lng,lat],zoom:16.5});
},KNOWN);
await page.waitForTimeout(900);
const canvas=page.locator('.mapboxgl-canvas').first(), box=await canvas.boundingBox();
if(!box)throw new Error('map missing');
const sx=box.x+box.width*.70,sy=box.y+box.height*.60;
await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(sx-5,sy+2,{steps:4});await page.mouse.up();
await page.waitForTimeout(900);
const propertyButton=page.locator('#earthlineDeclareProperty16169');
const propertyText=String(await propertyButton.innerText()).replace(/\s+/g,' ').trim();
if(!/^CROSSHAIR\b/i.test(propertyText))throw new Error('Known target not CROSSHAIR: '+propertyText);

const t0=Date.now();
const preSerial=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await propertyButton.click();
await page.waitForTimeout(250);
const immediate=await page.evaluate(()=>({
  elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
  gauge:String(document.getElementById('earthlineElderTreesGauge17097')?.textContent||'').trim()
}));
if(immediate.elder?.summary?.coverageDatasetIds?.includes('california-regional-overview-17130')){
  throw new Error('Regional Elder state survived Property click: '+JSON.stringify(immediate));
}

await page.waitForFunction(({preSerial})=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
  return a?.settled===true&&Number(a?.serial||0)>preSerial;
},{preSerial},{timeout:45000,polling:100});
const settledMs=Date.now()-t0;

let swaleVisibleMs=null;
for(let i=0;i<40;i++){
  const count=await page.evaluate(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const layers=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'].filter(id=>m?.getLayer?.(id));
    if(!layers.length)return 0;
    const r=m.getCanvas().getBoundingClientRect();
    try{return m.queryRenderedFeatures([[10,10],[r.width-10,r.height-10]],{layers}).length}catch(_){return 0}
  });
  if(count>0){swaleVisibleMs=Date.now()-t0;break}
  await page.waitForTimeout(100);
}
if(swaleVisibleMs==null)throw new Error('No Property swales visibly rendered');

await page.waitForFunction(()=> {
  const x=window.EARTHLINE_ELDER_TREE_LAST_17097;
  return x?.state==='committed'&&x?.summary?.coverageDatasetIds?.includes('dynamic-property-17130')&&Number(x?.featureCount||0)>0&&Number(x?.dynamicCandidatePoolCount||0)>0;
},{timeout:60000,polling:200});
const elderVisibleMs=Date.now()-t0;
await page.waitForTimeout(400);

const state=await page.evaluate(()=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const x=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
  const src=m?.getSource?.('earthline-elder-trees-17097');
  const d=src?._data||src?._options?.data||null;
  const coords=(d?.features||[]).map(f=>f.geometry?.coordinates).filter(Boolean);
  const poly=window.M?.analysisBoundaryLngLat||[];
  let w=Infinity,s=Infinity,e=-Infinity,n=-Infinity;
  for(const p of poly){w=Math.min(w,+p[0]);e=Math.max(e,+p[0]);s=Math.min(s,+p[1]);n=Math.max(n,+p[1])}
  let rendered=0;try{const r=m.getCanvas().getBoundingClientRect();rendered=m.queryRenderedFeatures([[10,10],[r.width-10,r.height-10]],{layers:['earthline-elder-tree-points-17097']}).length}catch(_){}
  return {elder:x,coords,bbox:[w,s,e,n],rendered,audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null};
});
const [w,s,e,n]=state.bbox,mx=(w+e)/2,my=(s+n)/2;
const quadrants=[0,0,0,0];
for(const c of state.coords){const ix=c[0]>=mx?1:0,iy=c[1]>=my?1:0;quadrants[iy*2+ix]++}
const occupied=quadrants.filter(x=>x>0).length;
const xs=state.coords.map(c=>c[0]),ys=state.coords.map(c=>c[1]);
const xSpan=(Math.max(...xs)-Math.min(...xs))/Math.max(1e-12,e-w);
const ySpan=(Math.max(...ys)-Math.min(...ys))/Math.max(1e-12,n-s);
const failures=[];
if(state.rendered<=0)failures.push('Elder committed but zero pins rendered');
if(occupied<3)failures.push('Elder display covers fewer than 3 parcel quadrants '+JSON.stringify(quadrants));
if(xSpan<.45||ySpan<.45)failures.push('Elder display spatial span too narrow '+JSON.stringify({xSpan,ySpan}));
if(elderVisibleMs>12000)failures.push('Elder visible too late '+elderVisibleMs+'ms');
if(settledMs>15000)failures.push('Property exceeded 15s '+settledMs+'ms');
if(swaleVisibleMs>settledMs+3000)failures.push('Swales visible too late '+JSON.stringify({settledMs,swaleVisibleMs}));
if(errors.length)failures.push('page errors '+JSON.stringify(errors));

await page.screenshot({path:OUT+'/property.png',animations:'disabled'});
const report={regionalElder,zoomButtonText,propertyText,immediate,settledMs,swaleVisibleMs,elderVisibleMs,quadrants,occupied,xSpan,ySpan,state,errors,failures};
writeFileSync(OUT+'/result.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_V1_STABLE_17175 '+JSON.stringify(report));
await browser.close();
if(failures.length)throw new Error('V1 stable rendered failed: '+JSON.stringify(failures));
