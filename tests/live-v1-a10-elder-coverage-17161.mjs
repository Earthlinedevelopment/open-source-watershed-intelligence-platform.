import { chromium } from 'playwright';

const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1908,height:882}});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?a10elder17161='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});

const input=page.locator('#searchInput');
await input.fill('California'); await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await opts.count())) throw new Error('No California suggestion');
await opts.first().click(); await page.waitForTimeout(250);
await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:150});

const hint=page.locator('#earthlineCrosshairMoveHint17093');
if(await hint.isVisible()){
  const b=hint.getByRole('button',{name:/dismiss crosshair movement hint|got it/i}); if(await b.count())await b.click();
}

const hits=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070');
const n=await hits.count();
let a10=null;
for(let i=0;i<n;i++){
  const h=hits.nth(i);
  const meta=await h.evaluate(el=>({
    text:String(el.textContent||'').replace(/\s+/g,' ').trim(),
    aria:el.getAttribute('aria-label')||'',
    title:el.getAttribute('title')||'',
    html:el.outerHTML.slice(0,1200)
  }));
  if(/\bA10\b/i.test(meta.text+' '+meta.aria+' '+meta.title+' '+meta.html)){a10=h;break}
}
if(!a10){
  // Fallback: click corridors and inspect detail until A10 is selected.
  for(let i=0;i<Math.min(n,80);i++){
    const h=hits.nth(i);
    await h.click({force:true}); await page.waitForTimeout(120);
    const body=String(await page.locator('body').innerText());
    if(/\bA10\b[\s\S]{0,80}ZOOM TO/i.test(body)||/A10\s*[·-]\s*ANALYZE/i.test(body)){a10=h;break}
  }
}
if(!a10) throw new Error('A10 corridor could not be located');
await a10.click({force:true}); await page.waitForTimeout(250);
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count()))throw new Error('A10 Zoom button missing');
await zoom.click(); await page.waitForTimeout(1300);

const before=await page.evaluate(()=>{
 const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
 return {center:m?.getCenter?.(),zoom:m?.getZoom?.(),btn:document.getElementById('earthlineDeclareProperty16169')?.innerText||''};
});
console.log('A10_BEFORE_PROPERTY '+JSON.stringify(before));

const btn=page.locator('#earthlineDeclareProperty16169');
const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await btn.click();
await page.waitForFunction(({pre})=>{
 const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
 return a?.settled===true&&Number(a?.serial||0)>pre;
},{pre},{timeout:45000,polling:150});

const settled=await page.evaluate(()=>{
 const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
 const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
 const last=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
 let rendered=0;
 try{
   if(m?.getLayer?.('earthline-elder-tree-points-17097')){
     const r=m.getCanvas().getBoundingClientRect();
     rendered=m.queryRenderedFeatures([[10,10],[r.width-10,r.height-10]],{layers:['earthline-elder-tree-points-17097']}).length;
   }
 }catch(_){}
 return {audit:a,elder:last,rendered};
});
console.log('A10_SETTLED '+JSON.stringify(settled));

await page.waitForFunction(()=>{
 const x=window.EARTHLINE_ELDER_TREE_LAST_17097;
 return x?.summary?.coverageDatasetIds?.includes('dynamic-property-17130')&&Number(x?.featureCount||0)>0;
},{timeout:120000,polling:500});

const final=await page.evaluate(()=>{
 const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
 const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
 const last=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
 let rendered=[];
 try{
   const r=m.getCanvas().getBoundingClientRect();
   rendered=m.queryRenderedFeatures([[10,10],[r.width-10,r.height-10]],{layers:['earthline-elder-tree-points-17097']}).map(f=>({
     c:f.geometry?.coordinates||null,p:f.properties||{}
   }));
 }catch(_){}
 return {audit:a,elder:last,rendered,center:m?.getCenter?.()};
});
console.log('A10_FINAL '+JSON.stringify(final));

const bbox=await page.evaluate(()=>{
 const md=(typeof M!=='undefined'&&M)||window.M||null;
 const poly=Array.isArray(md?.analysisBoundaryLngLat)?md.analysisBoundaryLngLat:[];
 let w=Infinity,s=Infinity,e=-Infinity,n=-Infinity;
 for(const p of poly){const x=+p[0],y=+p[1];if(Number.isFinite(x)&&Number.isFinite(y)){w=Math.min(w,x);e=Math.max(e,x);s=Math.min(s,y);n=Math.max(n,y)}}
 return [w,s,e,n];
});
const direct=await page.evaluate(async bbox=>{
 const worker=new Worker('/earthline-elder-worker-17129.js?diag='+Date.now(),{type:'module'});
 let seq=0;const pending=new Map();
 worker.onmessage=e=>{const p=pending.get(e.data?.id);if(p){pending.delete(e.data.id);p.resolve(e.data)}};
 const ask=(payload,timeout=180000)=>new Promise((resolve,reject)=>{const id='q'+(++seq);pending.set(id,{resolve,reject});worker.postMessage({...payload,id});setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(new Error('timeout'))}},timeout)});
 await ask({warm:true},180000);
 const r=await ask({bbox,options:{displayPerTile:240,maxPerTile:240}},180000);
 worker.terminate();
 const feats=r.result?.features||[];
 const tiles=r.result?.earthline?.tile_results||[];
 return {
   ok:r.ok,error:r.error||null,
   pool:Number(r.result?.earthline?.candidate_pool_count||0),
   display:feats.length,
   coords:feats.map(f=>f.geometry?.coordinates||null),
   tiles:tiles.map(t=>({status:t.status,forest_area_ha:t.forest_area_ha,forest_cells:t.forest_cells,reference_peak_count:t.reference_peak_count,current_selected_total:t.current_selected_total,future_selected_total:t.future_selected_total}))
 };
},bbox);
console.log('A10_DIRECT_FULL '+JSON.stringify({bbox,direct,errors}));
await browser.close();
