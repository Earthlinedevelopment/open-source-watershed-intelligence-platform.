import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:1798,height:831},deviceScaleFactor:1});
const page=await context.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e)));

const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';\nawait page.goto(BASE+'?m78_desktop_crosshair='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:25000});
await page.waitForFunction(()=>document.documentElement.innerHTML.includes('EARTHLINE M78.11 — one canonical owner per minor-flow cell')&&document.documentElement.innerHTML.includes('EARTHLINE M78.16 — resilient free global OSM transport with three current public instances')&&document.documentElement.innerHTML.includes('EARTHLINE M78.17 — clear prior Property presentation at authoritative run start')&&document.documentElement.innerHTML.includes('EARTHLINE M78.19 — loaded map evidence is the primary Property exclusion screen')&&document.documentElement.innerHTML.includes('EARTHLINE M78.22 — canonical five-decimal crosshair owns the Property analysis frame')&&document.documentElement.innerHTML.includes('EARTHLINE M78.25 — sub-meter camera jitter cannot replace the accepted crosshair target')&&document.documentElement.innerHTML.includes('EARTHLINE M78.27 — contour start and marcher share one half-open crossing rule')&&document.documentElement.innerHTML.includes('earthline-launch-16872.js?v=17606')&&document.documentElement.innerHTML.includes('EARTHLINE M78.30 — deterministic local DEM level-set fallback')&&document.documentElement.innerHTML.includes('EARTHLINE M78.20 — realistic non-overlapping Property swale presentation'),undefined,{timeout:90000,polling:500});
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
  await page.waitForTimeout(500);
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

const first=await runHumanCrosshair(-111.93067,34.21568,'m78-desktop-first');
const second=await runHumanCrosshair(-111.93347,34.21629,'m78-desktop-second');
const firstRepeat=await runHumanCrosshair(-111.93067,34.21568,'m78-desktop-first-repeat');
const secondRepeat=await runHumanCrosshair(-111.93347,34.21629,'m78-desktop-second-repeat');
console.log('EARTHLINE_M78_PRESCRIBER_SOURCE '+await page.evaluate(()=>{try{return typeof prescribeSwales15778==='function'?String(prescribeSwales15778):'UNAVAILABLE'}catch(e){return 'ERROR '+String(e)}}));
console.log('EARTHLINE_M78_DESKTOP_CROSSHAIR '+JSON.stringify({first,second,firstRepeat,secondRepeat,errs}));
await browser.close();

function near(a,b,tol=0.00008){return Number.isFinite(Number(a))&&Math.abs(Number(a)-Number(b))<=tol}
const firstCenter=first.snap.declaration?.center,secondCenter=second.snap.declaration?.center;
const identityOk=
 near(first.pre.target?.lng,-111.93067)&&near(first.pre.target?.lat,34.21568)&&
 near(firstCenter?.lng,-111.93067)&&near(firstCenter?.lat,34.21568)&&
 near(second.pre.target?.lng,-111.93347)&&near(second.pre.target?.lat,34.21629)&&
 near(secondCenter?.lng,-111.93347)&&near(secondCenter?.lat,34.21629);
const systemsOk=[first,second,firstRepeat,secondRepeat].every(r=>{
  const e=r.snap.elder||{};
  const sw=r.snap.swales||{};
  const w=r.snap.water||{};
  const aq=r.snap.aquifer||{};
  const run=r.snap.runAudit||{};
  const pub=r.snap.publication||{};
  const elderLast=e.last||{};
  return run.settled===true &&
    pub.published===true &&
    Number(sw.count)>0 &&
    Number(w.count)>0 &&
    String(elderLast.state||'')==='committed' &&
    Number(elderLast.featureCount||0)>0 &&
    Number(e.sourceFeatures||0)>0 &&
    Number(e.renderedFeatures||0)>0 &&
    e.layerExists===true &&
    e.visibility!=='none' &&
    (Number(r.snap.renderedSwales?.natural||0)>0 || Number(r.snap.renderedSwales?.safe||0)>0) &&
    (!aq.owner || Number(aq.owner.searchGen)===Number(r.snap.searchGen));
});
const routeDiffOk=
  String(first.snap.swales?.fingerprint||'')!=='' &&
  String(second.snap.swales?.fingerprint||'')!=='' &&
  String(first.snap.swales?.fingerprint||'')!==String(second.snap.swales?.fingerprint||'');
const repeatOk=
  String(first.snap.swales?.fingerprint||'')===String(firstRepeat.snap.swales?.fingerprint||'') &&
  Number(first.snap.swales?.count||0)===Number(firstRepeat.snap.swales?.count||0) &&
  String(first.snap.water?.fingerprint||'')===String(firstRepeat.snap.water?.fingerprint||'') &&
  String(second.snap.swales?.fingerprint||'')===String(secondRepeat.snap.swales?.fingerprint||'') &&
  Number(second.snap.swales?.count||0)===Number(secondRepeat.snap.swales?.count||0) &&
  String(second.snap.water?.fingerprint||'')===String(secondRepeat.snap.water?.fingerprint||'');
console.log('EARTHLINE_M78_DESKTOP_STRICT '+JSON.stringify({identityOk,systemsOk,routeDiffOk,repeatOk,first:{elder:first.snap.elder,swales:first.snap.swales,water:first.snap.water,aquifer:first.snap.aquifer},second:{elder:second.snap.elder,swales:second.snap.swales,water:second.snap.water,aquifer:second.snap.aquifer},firstRepeat:{swales:firstRepeat.snap.swales,water:firstRepeat.snap.water},secondRepeat:{swales:secondRepeat.snap.swales,water:secondRepeat.snap.water}}));
const levelSetOk=
  Number(first.snap.flowFirst?.reasons?.['no-contour-trace']||0)<33 &&
  Number(second.snap.flowFirst?.reasons?.['no-contour-trace']||0)<30 &&
  Number(first.snap.swales?.count||0)>=97 &&
  Number(second.snap.swales?.count||0)>=79 &&
  String(first.snap.swales?.fingerprint||'')===String(firstRepeat.snap.swales?.fingerprint||'') &&
  String(second.snap.swales?.fingerprint||'')===String(secondRepeat.snap.swales?.fingerprint||'');
console.log('EARTHLINE_M78_LEVELSET_GATE '+JSON.stringify({levelSetOk,first:first.snap.flowFirst,second:second.snap.flowFirst,firstSwales:first.snap.swales,secondSwales:second.snap.swales,kernel:first.snap.publicationModel?.scienceKernelM78||null}));
if(!identityOk||!systemsOk||!routeDiffOk||!repeatOk||!levelSetOk)process.exitCode=1;

// M78.8 raw Elder tile verdict capture

// M78.10 capture exact open-data exclusion transport verdict

// M78.13 require repaired production bytes before desktop validation

// M78.14 strict desktop manual-crosshair functional gate

// M78.18 require exact repaired production bytes

// M78.20 require swale-first publication gate in served bytes

// M78.21 exact desktop swale repeatability gate

// M78.23 require canonical frame bytes before repeatability test

// M78.24 correct production-identity wait timeout

// M78.26 require jitter-lock production bytes

// M78.19 require actual rendered Elder and swale pixels/features

// M78.20 require deployed width repair identity

// M78.20 diagnose unserved flow paths and rendered layer truth

// M78.28 require deployed contour-start repair before diagnostics

// M78.21 extract authoritative prescriber owner source

// M78.30 candidate local-level-set acceptance gate
