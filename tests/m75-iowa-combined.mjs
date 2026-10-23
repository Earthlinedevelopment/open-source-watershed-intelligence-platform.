import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const TARGET={lat:41.95715,lng:-93.38977};
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers});
});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));

const fail=(msg,data)=>{throw new Error(msg+(data?' '+JSON.stringify(data):''))};
const snap=async label=>{
  const d=await page.evaluate(()=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const vis=id=>{try{return mp?.getLayer?.(id)?(mp.getLayoutProperty(id,'visibility')||'visible'):null}catch(_){return null}};
    const src=id=>{try{const s=mp?.getSource?.(id);return Array.isArray(s?._data?.features)?s._data.features.length:null}catch(_){return null}};
    const rendered=ids=>{try{
      const cv=mp?.getCanvas?.(),box=cv&&[[0,0],[cv.clientWidth||cv.width,cv.clientHeight||cv.height]];
      const present=(ids||[]).filter(id=>{try{return !!mp?.getLayer?.(id)&&(mp.getLayoutProperty(id,'visibility')||'visible')!=='none'}catch(_){return false}});
      return box&&present.length?(mp.queryRenderedFeatures?.(box,{layers:present})||[]).length:0;
    }catch(_){return 0}};
    const overlay=document.getElementById('earthlineRegionalVectorOverlay16020');
    const swaleGroup=overlay?.querySelector?.('[data-layer="swale-opportunities"]');
    const a=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null;
    const pa=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const fc=(typeof M!=='undefined'&&(M.authoritativeSafeSwales15815||M.authoritativeSafeSwales15806))||null;
    const features=Array.isArray(fc?.features)?fc.features:[];
    const sigs=new Set(),dups=[];
    for(const f of features){
      const g=f?.geometry;
      const groups=g?.type==='LineString'?[g.coordinates]:(g?.type==='MultiLineString'?g.coordinates:[]);
      for(const coords of groups||[]){
        if(!Array.isArray(coords)||coords.length<2)continue;
        const norm=coords.map(p=>[Math.round(Number(p[0])*1e7)/1e7,Math.round(Number(p[1])*1e7)/1e7]);
        const a=JSON.stringify(norm),b=JSON.stringify(norm.slice().reverse()),sig=a<b?a:b;
        if(sigs.has(sig))dups.push(sig); else sigs.add(sig);
      }
    }
    return {
      zoom:Number(mp?.getZoom?.()||0),
      regionalAudit:a,
      regionalSvgSwalePaths:swaleGroup?.querySelectorAll?.('path')?.length||0,
      regionalOverlayDisplay:overlay?getComputedStyle(overlay).display:null,
      nativeRegionalCorridors:[
        'earthline-ranked-swale-soil-15777',
        'earthline-ranked-swale-plant-15777',
        'earthline-ranked-swale-water-15777'
      ].map(id=>({id,visibility:vis(id)})),
      nativeRegionalLabelVisibility:vis('earthline-ranked-swale-label-15775'),
      orangePathOwners:[...document.querySelectorAll('svg path')].map(path=>{
        const stroke=String(path.getAttribute('stroke')||getComputedStyle(path).stroke||'').toLowerCase();
        const hit=stroke.includes('#ff8a2d')||stroke.includes('#ffc12f')||stroke.includes('#42ff83')||
          stroke.includes('255, 138, 45')||stroke.includes('255, 193, 47')||stroke.includes('66, 255, 131');
        if(!hit)return null;
        const svg=path.closest('svg'),layer=path.closest('[data-layer]');
        return {stroke,svgId:svg?.id||'',layer:layer?.getAttribute('data-layer')||'',pathClass:path.getAttribute('class')||'',parentClass:path.parentElement?.getAttribute?.('class')||''};
      }).filter(Boolean),
      displayedTier:String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.tier||(window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.mode||''),
      propertyAudit:pa,
      propertyRunState:document.documentElement.dataset.earthlinePropertyRunState||'',
      planting:{
        sourceFeatures:src('earthline-swale-planting-15806'),
        shadowVisibility:vis('earthline-swale-planting-shadow-15806'),
        layerVisibility:vis('earthline-swale-planting-layer-15806'),
        renderedFeatures:rendered(['earthline-swale-planting-shadow-15806','earthline-swale-planting-layer-15806']),
        model:(typeof M!=='undefined'?M.naturalSwalePlanting15806:null)
      },
      renderedPropertySwales:rendered([
        'earthline-living-swales-glow-15792','earthline-living-swales-earth-15792',
        'earthline-living-swales-life-15792','earthline-living-swales-water-15792',
        'earthline-property-safe-casing-16221','earthline-property-safe-earth-16221',
        'earthline-property-safe-life-16221','earthline-property-safe-water-16221',
        'earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174',
        'earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177'
      ]),
      renderedLivingSwales:rendered(['earthline-living-swales-glow-15792','earthline-living-swales-earth-15792','earthline-living-swales-life-15792','earthline-living-swales-water-15792']),
      renderedSafeSwales:rendered(['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221']),
      renderedNaturalSwales:rendered(['earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177']),
      propertySafeCount:features.length,
      exactDuplicateCount:dups.length,
      pageTier:document.documentElement.dataset.earthlineAnalysisTier||''
    };
  });
  await page.screenshot({path:label+'.png',fullPage:false});
  return d;
};

await page.goto(BASE+'?m75-combined='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});

const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200);

const r0=Date.now();
await page.locator('#runBtn').click({force:true});
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  return String(d&&(d.tier||d.mode)||'').toLowerCase()==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
},null,{timeout:60000,polling:150});
const regionalMs=Date.now()-r0;
await page.waitForTimeout(1200);
const regional=await snap('m75-iowa-regional');
if(regionalMs>15000)fail('Regional exceeded 15s',regionalMs);
if(regional.regionalAudit?.corridorGeometryVisible!==false)fail('Initial Regional corridor geometry is visible',regional);
if(regional.regionalSvgSwalePaths!==0)fail('Initial Regional SVG worms are rendered',regional);
if(regional.nativeRegionalCorridors.some(x=>x.visibility&&x.visibility!=='none'))fail('Initial Regional native corridor geometry is visible',regional);
if(Number(regional.regionalAudit?.generatedSwales||0)<12)fail('Regional generated opportunity count too low',regional);
if(Number(regional.regionalAudit?.swaleGradeLabels||0)<1)fail('Regional labels missing',regional);
console.log('EARTHLINE_M75_REGIONAL_ORANGE_OWNERS '+JSON.stringify(regional.orangePathOwners));

await page.evaluate(({lat,lng})=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(typeof M!=='undefined'&&M){
    M.centerLat=lat;M.centerLng=lng;
    M.loc=Object.assign({},M.loc||{},{name:'Iowa diagnostic',countryCode:'us',placeType:'state',lat,lng,query:'Iowa'});
  }
  try{mp?.jumpTo?.({center:[lng,lat],zoom:13});}catch(_){}
},TARGET);
await page.waitForTimeout(1000);

const p0=Date.now();
const btn=page.locator('#earthlineDeclareProperty16169');
if(await btn.count()) await btn.click({force:true});
else await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173?.());

await page.waitForFunction(()=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  return a?.settled===true&&a?.renderVerified===true;
},null,{timeout:90000,polling:200});
await page.waitForTimeout(800);
const propertyMs=Date.now()-p0;
const propertySettled=await snap('m75-iowa-property-settled');
await page.waitForTimeout(5000);
const propertyStable=await snap('m75-iowa-property-stable');

if(propertyMs>15000)fail('Property exceeded 15s',propertyMs);
if(!propertySettled.propertyAudit?.renderVerified)fail('Property render not verified',propertySettled);
if(propertySettled.propertySafeCount<1)fail('No Property swales published',propertySettled);
if(propertySettled.renderedPropertySwales<1)fail('No Property swales actually rendered',propertySettled);
if(propertySettled.exactDuplicateCount!==0)fail('Exact duplicate Property swales remain',propertySettled);
for(const [label,d] of [['settled',propertySettled],['stable',propertyStable]]){
  if(!(Number(d.planting.sourceFeatures)>0))fail('Planting source empty '+label,d);
  if(d.planting.layerVisibility!=='visible'||d.planting.shadowVisibility!=='visible')fail('Planting not visible '+label,d);
  if(d.planting.model?.visible!==true)fail('Planting model not visible '+label,d);
  if(!(Number(d.planting.renderedFeatures)>0))fail('Planting has zero actually rendered features '+label,d);
  if(!(Number(d.renderedPropertySwales)>0))fail('Property swales have zero actually rendered features '+label,d);
}
if(propertyStable.exactDuplicateCount!==0)fail('Duplicates appeared after persistence wait',propertyStable);

const out={regionalMs,propertyMs,regional,propertySettled,propertyStable,errors};
fs.writeFileSync('m75-iowa-combined.json',JSON.stringify(out,null,2));
console.log('EARTHLINE_M75_IOWA_COMBINED_PASS '+JSON.stringify(out));
await browser.close();
