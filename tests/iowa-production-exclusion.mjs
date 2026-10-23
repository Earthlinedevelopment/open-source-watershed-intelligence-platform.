import { chromium } from 'playwright';
import fs from 'node:fs';

const TARGET={lat:41.95715,lng:-93.38977};
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers});
});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?m75-exclusion='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});
const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200);
await page.locator('#runBtn').click({force:true});
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  return String(d&&(d.tier||d.mode)||'').toLowerCase()==='regional' &&
    document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
},null,{timeout:120000,polling:250});

await page.evaluate(({lat,lng})=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(typeof M!=='undefined'&&M){
    M.centerLat=lat;M.centerLng=lng;
    M.loc=Object.assign({},M.loc||{},{name:'Iowa exclusion diagnostic',countryCode:'us',placeType:'state',lat,lng,query:'Iowa'});
  }
  try{mp?.jumpTo?.({center:[lng,lat],zoom:13});}catch(_){}
},TARGET);
await page.waitForTimeout(900);

const btn=page.locator('#earthlineDeclareProperty16169');
if(await btn.count()) await btn.click({force:true});
else await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173?.());

try{
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:30000,polling:150});
}catch(_){}
await page.waitForTimeout(300);

const out=await page.evaluate(()=>{
  const m=typeof M!=='undefined'?M:null;
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const cov=m?.vectorNoBuildCoverage||null;
  let styleLayers=[];
  try{
    const style=mp?.getStyle?.()||{};
    styleLayers=(style.layers||[]).filter(l=>{
      const id=((l.id||'')+' '+(l['source-layer']||'')).toLowerCase();
      const lineLike=l.type==='line';
      const areaLike=l.type==='fill'||l.type==='fill-extrusion';
      const transport=/road|street|bridge|tunnel|path|track|service|transportation|highway/.test(id);
      const structure=/building|structure|parking/.test(id);
      const mappedWater=/water|river|lake|reservoir|stream|canal|wetland/.test(id);
      const genericParkingCarrier=areaLike&&/landuse|land-use/.test(id);
      return (lineLike&&(transport||structure||mappedWater))||(areaLike&&(transport||structure||genericParkingCarrier||mappedWater));
    }).map(l=>({id:l.id,type:l.type,source:l.source,sourceLayer:l['source-layer']||null}));
  }catch(_){}
  return {
    runAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    vectorNoBuildCoverage:cov?JSON.parse(JSON.stringify(cov)):null,
    noBuildCount:Number(m?.vectorNoBuildCount||0),
    noBuildMaskLength:Number(m?.noBuildMask?.length||0),
    styleLayers,
    mapReady:(()=>{try{return !!mp?.getStyle?.()}catch(_){return false}})(),
    mapLoaded:(()=>{try{return !!mp?.loaded?.()}catch(_){return null}})(),
    tilesLoaded:(()=>{try{return !!mp?.areTilesLoaded?.()}catch(_){return null}})()
  };
});
out.errors=errors;
fs.writeFileSync('iowa-production-exclusion.json',JSON.stringify(out,null,2));
console.log('EARTHLINE_IOWA_PRODUCTION_EXCLUSION '+JSON.stringify(out));
await browser.close();
