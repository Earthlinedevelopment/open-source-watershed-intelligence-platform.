import { chromium } from 'playwright';
const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1908,height:882}});
await page.goto(BASE+'?a10exact17162='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
const input=page.locator('#searchInput');
await input.fill('California');await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await opts.count()))throw new Error('No California suggestion');
await opts.first().click();await page.waitForTimeout(250);
await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:150});
const hint=page.locator('#earthlineCrosshairMoveHint17093');if(await hint.isVisible()){const b=hint.getByRole('button',{name:/got it|dismiss/i});if(await b.count())await b.click()}

const hits=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070');
const n=await hits.count();
let found=-1,labels=[];
for(let i=0;i<n;i++){
  await hits.nth(i).click({force:true}); await page.waitForTimeout(100);
  const txt=String(await page.locator('#earthlineDeclareProperty16169').innerText()).replace(/\s+/g,' ').trim();
  labels.push({i,txt});
  if(/^A10\b/i.test(txt)){found=i;break}
}
console.log('A10_LABEL_SCAN '+JSON.stringify(labels.slice(0,120)));
if(found<0)throw new Error('Exact A10 not found');
await hits.nth(found).click({force:true});await page.waitForTimeout(150);
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count()))throw new Error('Zoom missing for A10');
await zoom.click();await page.waitForTimeout(1200);
const pre=await page.evaluate(()=>({
  btn:document.getElementById('earthlineDeclareProperty16169')?.innerText||'',
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  center:(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);return m?.getCenter?.()||null})()
}));
console.log('A10_EXACT_BEFORE '+JSON.stringify(pre));
const btn=page.locator('#earthlineDeclareProperty16169');
const serial=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await btn.click();
await page.waitForFunction(({serial})=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return a?.settled===true&&Number(a?.serial||0)>serial},{serial},{timeout:45000,polling:150});
await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.summary?.coverageDatasetIds?.includes('dynamic-property-17130'),{timeout:120000,polling:500});
const final=await page.evaluate(()=>{
 const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
 const last=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
 const src=m?.getSource?.('earthline-elder-trees-17097');
 let data=null;try{data=src?._data||src?._options?.data||null}catch(_){}
 return {
  audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  elder:last,
  displayCoords:(data?.features||[]).map(f=>f.geometry?.coordinates||null),
  boundary:(window.M?.analysisBoundaryLngLat||[]),
  center:m?.getCenter?.()||null
 };
});
console.log('A10_EXACT_FINAL '+JSON.stringify(final));

const b=final.boundary;
let west=Infinity,south=Infinity,east=-Infinity,north=-Infinity;
for(const p of b){west=Math.min(west,+p[0]);east=Math.max(east,+p[0]);south=Math.min(south,+p[1]);north=Math.max(north,+p[1])}
const bbox=[west,south,east,north];
const full=await page.evaluate(async bbox=>{
 const worker=new Worker('/earthline-elder-worker-17129.js?full='+Date.now(),{type:'module'});let seq=0;const pending=new Map();
 worker.onmessage=e=>{const p=pending.get(e.data?.id);if(p){pending.delete(e.data.id);p.resolve(e.data)}};
 const ask=(payload,timeout=180000)=>new Promise((resolve,reject)=>{const id='q'+(++seq);pending.set(id,{resolve,reject});worker.postMessage({...payload,id});setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(new Error('timeout'))}},timeout)});
 await ask({warm:true},180000);const r=await ask({bbox,options:{displayPerTile:240,maxPerTile:240}},180000);worker.terminate();
 return {pool:Number(r.result?.earthline?.candidate_pool_count||0),features:r.result?.features||[],tiles:r.result?.earthline?.tile_results||[]};
},bbox);
function quadrantCounts(coords,bbox){
 const [w,s,e,n]=bbox,mx=(w+e)/2,my=(s+n)/2,q=[0,0,0,0];
 for(const c of coords){if(!c)continue;const ix=c[0]>=mx?1:0,iy=c[1]>=my?1:0;q[iy*2+ix]++}
 return q;
}
console.log('A10_SPATIAL '+JSON.stringify({
 bbox,
 liveDisplayCount:final.displayCoords.length,
 liveQuadrants:quadrantCounts(final.displayCoords,bbox),
 fullCount:full.features.length,
 fullQuadrants:quadrantCounts(full.features.map(f=>f.geometry?.coordinates),bbox),
 pool:full.pool,
 tiles:full.tiles
}));
await browser.close();
