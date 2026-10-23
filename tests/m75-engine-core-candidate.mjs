import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const TARGET={lat:41.95715,lng:-93.38977};
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers});
});
const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
await page.goto(BASE+'?m75-engine-core='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});

const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200);

const regionalStarted=Date.now();
await page.locator('#runBtn').click({force:true});
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
  return tier==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
},null,{timeout:120000,polling:200});
const regionalMs=Date.now()-regionalStarted;
await page.waitForTimeout(800);

const regional=await page.evaluate(()=>{
  const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
  const features=Array.isArray(visual?.swales?.features)?visual.swales.features:[];
  const b=Array.isArray(visual?.bounds)?visual.bounds:null;
  const cells=new Set();
  if(b&&b.length===4){
    const [w,s,e,n]=b;
    for(const f of features){
      const c=f?.geometry?.type==='LineString'?f.geometry.coordinates:[];
      for(const p of c||[]){
        if(!Array.isArray(p))continue;
        const x=Math.max(0,Math.min(11,Math.floor((Number(p[0])-w)/Math.max(1e-9,e-w)*12)));
        const y=Math.max(0,Math.min(11,Math.floor((n-Number(p[1]))/Math.max(1e-9,n-s)*12)));
        cells.add(x+','+y);
      }
    }
  }
  const group=document.querySelector('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"]');
  return {
    visualSwales:features.length,
    coverageCells12:cells.size,
    renderedPaths:group?group.querySelectorAll('path').length:null,
    renderedHits:group?group.querySelectorAll('.earthline-swale-hit-16070').length:null,
    publication:window.EARTHLINE_REGIONAL_PUBLICATION_SELECTION_17700||null,
    spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
    coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,
    supertile:window.EARTHLINE_STATEWIDE_SUPERTILE_16839||null,
    fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
    capacity:window.EARTHLINE_SUPPORTED_CAPACITY_16843||null,
    status:document.getElementById('earthlineVermontStatus16147')?.textContent||''
  };
});
await page.screenshot({path:'m75-iowa-regional.png',fullPage:false});

await page.evaluate(({lat,lng})=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(typeof M!=='undefined'&&M){
    M.centerLat=lat;M.centerLng=lng;
    M.loc=Object.assign({},M.loc||{},{name:'Iowa diagnostic',countryCode:'us',lat,lng,query:'Iowa'});
  }
  try{mp?.jumpTo?.({center:[lng,lat],zoom:13});}catch(_){}
},TARGET);
await page.waitForTimeout(1000);

const propertyStarted=Date.now();
const btn=page.locator('#earthlineDeclareProperty16169');
if(await btn.count()) await btn.click({force:true});
else await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173?.());

await page.waitForFunction(()=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  return a?.settled===true&&a?.renderVerified===true;
},null,{timeout:90000,polling:200});
const propertyMs=Date.now()-propertyStarted;
await page.waitForTimeout(4000);

const property=await page.evaluate(()=>{
  const sw=Array.isArray(M?.swales)?M.swales:[];
  const sig=x=>{
    const pts=Array.isArray(x?.pts)?x.pts:[];
    if(!pts.length)return '';
    const norm=pts.map(p=>[Math.round(Number(p[0]||0)*1000)/1000,Math.round(Number(p[1]||0)*1000)/1000]);
    const f=JSON.stringify(norm),r=JSON.stringify(norm.slice().reverse());
    return f<r?f:r;
  };
  const seen=new Set(); let exactDuplicates=0;
  for(const x of sw){const k=sig(x);if(!k)continue;if(seen.has(k))exactDuplicates++;else seen.add(k);}
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const plantIds=['earthline-swale-planting-shadow-15806','earthline-swale-planting-layer-15806'];
  const plantLayers=plantIds.map(id=>({
    id,
    exists:!!mp?.getLayer?.(id),
    visibility:(()=>{try{return mp.getLayoutProperty(id,'visibility')||'visible'}catch(_){return null}})()
  }));
  let plantingFeatures=null;
  try{
    const src=mp?.getSource?.('earthline-swale-planting-15806');
    plantingFeatures=Array.isArray(src?._data?.features)?src._data.features.length:null;
  }catch(_){}
  const safe=M?.authoritativeSafeSwales15815||M?.authoritativeSafeSwales15806||M?.authoritativeSafeSwales15843||null;
  return {
    swales:sw.length,
    exactDuplicates,
    safeFeatures:Array.isArray(safe?.features)?safe.features.length:null,
    runAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    spacingStats:M?.spacingStats||null,
    swaleDiagnostics:M?.swaleDiagnostics||null,
    plantingFeatures,
    plantLayers,
    plantingAudit:M?.naturalSwalePlanting15806||null,
    state:(()=>{const x=window.earthlineRegional15778||window.earthlineRegional15761||null;return x?{mode:x.mode,active:x.active,running:x.running}:null})()
  };
});
await page.screenshot({path:'m75-iowa-property.png',fullPage:false});

const result={regionalMs,regional,propertyMs,property,pageErrors};
fs.writeFileSync('m75-engine-core-candidate.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_M75_ENGINE_CORE_RESULT '+JSON.stringify(result));

if(!(regional.visualSwales>=40)) throw new Error('Regional corridor count too low: '+regional.visualSwales);
if(!(regional.coverageCells12>=30)) throw new Error('Regional 12x12 coverage too sparse: '+regional.coverageCells12);
if(!(propertyMs<=15000)) throw new Error('Property exceeded 15s ceiling: '+propertyMs);
if(property.exactDuplicates!==0) throw new Error('Property exact duplicates: '+property.exactDuplicates);
if(!(property.plantingFeatures>0)) throw new Error('Property planting source empty');
if(property.plantLayers.some(x=>x.exists&&x.visibility==='none')) throw new Error('Property planting layer hidden');
if(pageErrors.length) throw new Error('Page errors: '+pageErrors.join(' | '));

await browser.close();
