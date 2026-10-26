import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const EARTHLINE_SCIENCE_GOLDEN=JSON.parse(readFileSync(new URL('./science-kernel-golden-v1.json',import.meta.url),'utf8'));

const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:1798,height:831},deviceScaleFactor:1});
const page=await context.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e)));

await page.goto('https://earthlinedevelopment.org/?m78_desktop_crosshair='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:25000});
await page.waitForFunction(()=>document.documentElement.innerHTML.includes('EARTHLINE M78.11 — one canonical owner per minor-flow cell')&&document.documentElement.innerHTML.includes('EARTHLINE M78.16 — resilient free global OSM transport with three current public instances')&&document.documentElement.innerHTML.includes('EARTHLINE M78.17 — clear prior Property presentation at authoritative run start')&&document.documentElement.innerHTML.includes('EARTHLINE M78.19 — loaded map evidence is the primary Property exclusion screen')&&document.documentElement.innerHTML.includes('EARTHLINE M78.22 — canonical five-decimal crosshair owns the Property analysis frame')&&document.documentElement.innerHTML.includes('EARTHLINE M78.25 — sub-meter camera jitter cannot replace the accepted crosshair target')&&document.documentElement.innerHTML.includes('EARTHLINE M78.27 — contour start and marcher share one half-open crossing rule')&&document.documentElement.innerHTML.includes('Earthline-Science-Kernel-v1.0.0')&&document.documentElement.innerHTML.includes('earthline-launch-16872.js?v=17606')&&document.documentElement.innerHTML.includes('EARTHLINE M78.20 — realistic non-overlapping Property swale presentation')&&document.documentElement.innerHTML.includes('EARTHLINE M78.30 — deterministic local DEM level-set fallback')&&document.documentElement.innerHTML.includes('EARTHLINE M78.32 — accepted crosshair atomically rebinds the Property declaration site'),undefined,{timeout:90000,polling:500});
await page.waitForTimeout(1000);

if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
  await page.waitForTimeout(250);
}
await page.locator('#searchInput').click();
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(800);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click({timeout:8000}).catch(()=>{});
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:60000,polling:150});
await page.waitForTimeout(800);

function fnv(payload){let h=2166136261;for(let i=0;i<payload.length;i++){h^=payload.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}

async function runHumanCrosshair(lng,lat,label){
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.evaluate(({lng,lat})=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m)throw new Error('map unavailable');
    m.jumpTo({center:[lng,lat],zoom:16.59});
    try{m.fire?.('dragend')}catch(_){}
  },{lng,lat});
  await page.waitForFunction(({lng,lat})=>{
    const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return !!t&&Math.abs(Number(t.lng)-Number(lng))<=0.00008&&Math.abs(Number(t.lat)-Number(lat))<=0.00008;
  },{lng,lat},{timeout:10000,polling:100});
  await page.waitForTimeout(250);
  const pre=await page.evaluate(()=>({
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    button:String(document.getElementById('earthlineDeclareProperty16169')?.textContent||'').replace(/\s+/g,' ').trim(),
    disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,
    center:(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat,zoom:m.getZoom?.()}:null})()
  }));
  const btn=page.locator('#earthlineDeclareProperty16169');
  await btn.waitFor({state:'visible',timeout:10000});
  await btn.click({timeout:10000});
  await page.waitForFunction(prev=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
    return !!a&&Number(a.serial||0)>prev&&a.settled===true;
  },before,{timeout:60000,polling:120}).catch(()=>{});
  await page.waitForFunction(({lng,lat})=>{
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097;
    const prefix=lng.toFixed(6)+'|'+lat.toFixed(6)+'|';
    return !!e&&(e.state==='committed'||e.state==='failed')&&(!e.propertyRunIdentity||String(e.propertyRunIdentity).startsWith(prefix));
  },{lng,lat},{timeout:30000,polling:120}).catch(()=>{});
  await page.waitForTimeout(500);
  const elderRaw=await page.evaluate(async()=>{
    try{
      const api=window.EARTHLINE_ELDER_TREES_V1_17097;
      const r=await Promise.resolve(api?.primePropertyEvidence?.());
      return r?{earthline:r.earthline||null,featureCount:Array.isArray(r.features)?r.features.length:null,candidatePoolCount:Array.isArray(r.candidatePool)?r.candidatePool.length:null}:null;
    }catch(e){return {error:String(e&&e.stack||e)}}
  });
  const snap=await page.evaluate(({lng,lat,label,elderRaw})=>{
    const md=(typeof M!=='undefined'&&M)||window.M||{};
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const safe=md?.authoritativeSafeSwales15815;
    const sw=Array.isArray(safe?.features)?safe.features:[];
    const swPayload=JSON.stringify(sw.map(f=>f?.geometry?.coordinates||null));
    let sh=2166136261;for(let i=0;i<swPayload.length;i++){sh^=swPayload.charCodeAt(i);sh=Math.imul(sh,16777619)}
    const water=md?.authoritativeWaterPaths15824;
    const wf=Array.isArray(water?.features)?water.features:[];
    const wp=JSON.stringify(wf.map(f=>f?.geometry?.coordinates||null));
    let wh=2166136261;for(let i=0;i<wp.length;i++){wh^=wp.charCodeAt(i);wh=Math.imul(wh,16777619)}
    const boundary=Array.isArray(md?.analysisBoundaryLngLat)?md.analysisBoundaryLngLat:[];
    let west=Infinity,south=Infinity,east=-Infinity,north=-Infinity,sx=0,sy=0,n=0;
    for(const p of boundary){const x=Number(p?.[0]),y=Number(p?.[1]);if(Number.isFinite(x)&&Number.isFinite(y)){west=Math.min(west,x);east=Math.max(east,x);south=Math.min(south,y);north=Math.max(north,y);sx+=x;sy+=y;n++}}
    const elderSrc=map?.getSource?.('earthline-elder-trees-17097');
    const elderData=elderSrc&&(elderSrc._data||elderSrc._options?.data);
    const elderLayer=map?.getLayer?.('earthline-elder-tree-points-17097');
    const center=map?.getCenter?.();
    return {
      label,requested:{lng,lat},
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
      frameSeed:window.EARTHLINE_PROPERTY_FRAME_SEED_16414||null,
      modelLoc:md?.loc?{lng:md.loc.lng,lat:md.loc.lat,fullName:md.loc.fullName||null}:null,
      mapCenter:center?{lng:center.lng,lat:center.lat,zoom:map.getZoom?.()}:null,
      boundary:{count:boundary.length,center:n?{lng:sx/n,lat:sy/n}:null,bounds:Number.isFinite(west)?{west,south,east,north}:null},
      searchGen:Number(md?.searchGen||0),
      runAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      publicationModel:md?.propertyPublication15816||null,
      swales:{count:sw.length,fingerprint:(sh>>>0).toString(16).padStart(8,'0'),meta:md?.swaleMeta||null,diag:md?.swaleDiagnostics||null},
      water:{count:wf.length,fingerprint:(wh>>>0).toString(16).padStart(8,'0'),publication:md?.authoritativeWaterPublication15824||null},
      flowFirst:(()=>{
        const ff=md?.flowFirstPlacement15836||{};
        const unserved=Array.isArray(ff?.unserved)?ff.unserved:[];
        const reasons={};
        for(const x of unserved){const k=String(x?.reason||'unknown');reasons[k]=(reasons[k]||0)+1}
        return {eligiblePaths:Number(ff?.eligiblePaths||0),pathsEvaluated:Number(ff?.pathsEvaluated||0),pathsServed:Number(ff?.pathsServed||0),unservedCount:unserved.length,reasons,unserved};
      })(),
      rendered:(()=>{
        try{
          const elderRendered=map?.queryRenderedFeatures?.({layers:['earthline-elder-tree-points-17097']})||[];
          const safeIds=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'].filter(id=>!!map?.getLayer?.(id));
          const swaleRendered=safeIds.length?(map?.queryRenderedFeatures?.({layers:safeIds})||[]):[];
          return {elderRendered:elderRendered.length,swaleRendered:swaleRendered.length,safeIds};
        }catch(e){return {error:String(e)}}
      })(),
      elder:{
        raw:elderRaw||null,
        last:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
        gauge:String(document.getElementById('earthlineElderTreesGauge17097')?.textContent||'').trim(),
        sourceFeatures:Array.isArray(elderData?.features)?elderData.features.length:null,
        layerExists:!!elderLayer,
        visibility:elderLayer?(map?.getLayoutProperty?.('earthline-elder-tree-points-17097','visibility')??null):null,
        renderedFeatures:(()=>{
          try{
            const c=map?.getCanvas?.(); const box=c&&[[0,0],[c.clientWidth||c.width,c.clientHeight||c.height]];
            return box&&elderLayer?(map.queryRenderedFeatures?.(box,{layers:['earthline-elder-tree-points-17097']})||[]).length:0;
          }catch(_){return -1}
        })()
      },
      renderedSwales:(()=>{
        try{
          const c=map?.getCanvas?.(); const box=c&&[[0,0],[c.clientWidth||c.width,c.clientHeight||c.height]];
          const natural=['earthline-property-natural-casing-16174','earthline-property-natural-neutral-16174','earthline-property-natural-uphill-16174','earthline-property-natural-uphill-flipped-16174'].filter(id=>map?.getLayer?.(id));
          const safe=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'].filter(id=>map?.getLayer?.(id));
          return {
            naturalLayers:natural,
            safeLayers:safe,
            natural:box&&natural.length?(map.queryRenderedFeatures?.(box,{layers:natural})||[]).length:0,
            safe:box&&safe.length?(map.queryRenderedFeatures?.(box,{layers:safe})||[]).length:0
          };
        }catch(e){return {error:String(e),natural:-1,safe:-1}}
      })(),
      aquifer:{owner:md?.propertyAquiferOwner16393||null,status:String(md?.usgsAquiferStatus||''),polys:Number(md?.usgsAquifers?.length||0)},
      noBuild:{provenance:md?.noBuildProvenance15843||null,lock:md?.propertyResultLock15815||null,vectorCoverage:md?.vectorNoBuildCoverage||null},
      safeVisibility:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
      texture:window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null,
      errs:[...window.__earthlineDesktopErrors||[]]
    };
  },{lng,lat,label,elderRaw});
  await page.screenshot({path:'/tmp/'+label+'.png',fullPage:true});
  return {pre,snap};
}


const controls=[
  {id:'POUDRE',lng:-105.2237,lat:40.6412},
  {id:'VERMONT',lng:-73.012909,lat:44.513845}
];
const results={};
for(const c of controls){
  const a=await runHumanCrosshair(c.lng,c.lat,'science-kernel-'+c.id.toLowerCase()+'-1');
  const b=await runHumanCrosshair(c.lng,c.lat,'science-kernel-'+c.id.toLowerCase()+'-2');
  const near=(x,y,tol=0.00008)=>Number.isFinite(Number(x))&&Math.abs(Number(x)-Number(y))<=tol;
  const elderOk=r=>{
    const e=r.snap.elder||{},last=e.last||{};
    return String(last.state||'')==='committed' &&
      (Number(last.featureCount||0)===0 || (Number(e.sourceFeatures||0)>=Number(last.featureCount||0) && e.layerExists===true && e.visibility!=='none'));
  };
  const functional=r=>{
    const run=r.snap.runAudit||{},pub=r.snap.publication||{},aq=r.snap.aquifer||{};
    return run.settled===true && pub.published===true &&
      Number(r.snap.swales?.count||0)>0 &&
      Number(r.snap.water?.count||0)>0 &&
      elderOk(r) &&
      (!aq.owner || Number(aq.owner.searchGen)===Number(r.snap.searchGen));
  };
  const identityOk=near(a.snap.declaration?.center?.lng,c.lng)&&near(a.snap.declaration?.center?.lat,c.lat)&&
                   near(b.snap.declaration?.center?.lng,c.lng)&&near(b.snap.declaration?.center?.lat,c.lat);
  const repeatOk=String(a.snap.swales?.fingerprint||'')===String(b.snap.swales?.fingerprint||'') &&
                 Number(a.snap.swales?.count||0)===Number(b.snap.swales?.count||0) &&
                 String(a.snap.water?.fingerprint||'')===String(b.snap.water?.fingerprint||'') &&
                 Number(a.snap.water?.count||0)===Number(b.snap.water?.count||0);
  results[c.id]={identityOk,functionalOk:functional(a)&&functional(b),repeatOk,
    first:{preTarget:a.pre?.target,declaration:a.snap.declaration?.center,swales:a.snap.swales?.count,swaleFp:a.snap.swales?.fingerprint,water:a.snap.water?.count,waterFp:a.snap.water?.fingerprint,
      elders:a.snap.elder?.sourceFeatures,served:a.snap.flowFirst?.pathsServed,noContour:a.snap.flowFirst?.reasons?.['no-contour-trace']||0,
      medianM:a.snap.swales?.meta?.measuredMedianSpacingM,aquifer:a.snap.aquifer?.status},
    second:{preTarget:b.pre?.target,declaration:b.snap.declaration?.center,swales:b.snap.swales?.count,swaleFp:b.snap.swales?.fingerprint,water:b.snap.water?.count,waterFp:b.snap.water?.fingerprint,
      elders:b.snap.elder?.sourceFeatures,served:b.snap.flowFirst?.pathsServed,noContour:b.snap.flowFirst?.reasons?.['no-contour-trace']||0,
      medianM:b.snap.swales?.meta?.measuredMedianSpacingM,aquifer:b.snap.aquifer?.status}};
}
console.log('EARTHLINE_SCIENCE_KERNEL_CONTROL_MATRIX '+JSON.stringify(results));
await browser.close();
if(Object.values(results).some(r=>!r.identityOk||!r.functionalOk||!r.repeatOk))process.exitCode=1;

// Science Kernel control: wait for authoritative crosshair target before Property click

// Terrain controls require served M78.32 declaration binding bytes
