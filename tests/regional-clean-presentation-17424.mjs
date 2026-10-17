import { chromium, firefox, webkit } from 'playwright';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?regionalClean17424='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click();
const rb=page.locator('#runBtn');
if(await rb.isVisible()&&!await rb.isDisabled()) await rb.click();

await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040?.swaleGradeLabels>0,null,{timeout:20000,polling:100});
await page.waitForTimeout(300);

const initial=await page.evaluate(()=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const vis=id=>{try{return mp?.getLayer?.(id)?(mp.getLayoutProperty(id,'visibility')||'visible'):null}catch(_){return null}};
  const opacity=(id,prop)=>{try{return mp?.getLayer?.(id)?mp.getPaintProperty(id,prop):null}catch(_){return null}};
  return {
    tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
    worms:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
    labels:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').length,
    labelLayer:vis('earthline-ranked-swale-label-15775'),
    hitLayer:vis('earthline-ranked-swale-hit-16153'),
    soilLayer:vis('earthline-ranked-swale-soil-15777'),
    plantLayer:vis('earthline-ranked-swale-plant-15777'),
    waterSwaleLayer:vis('earthline-ranked-swale-water-15777'),
    flowLine:vis('el-live-flow-line-15970'),
    flowArrow:vis('el-live-flow-arrow-15970'),
    aquiferFill:vis('el-live-aquifer-fill-15970'),
    aquiferOpacity:opacity('el-live-aquifer-fill-15970','fill-opacity'),
    audit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,
    visibilityAudit:window.EARTHLINE_REGIONAL_CORRIDOR_VISIBILITY_17424||null,
    pub:window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null
  };
});

const initialPass=
  initial.tier==='regional' &&
  initial.worms===0 &&
  initial.labels>0 &&
  initial.labelLayer!=='none' &&
  initial.hitLayer!=='none' &&
  initial.soilLayer==='none' &&
  initial.plantLayer==='none' &&
  initial.waterSwaleLayer==='none' &&
  initial.flowLine!=='none' &&
  initial.flowArrow!=='none' &&
  initial.audit?.initialRegionalClean17424===true;

await page.evaluate(()=>new Promise(resolve=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const pub=window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null;
  const z=Math.max(Number(mp?.getZoom?.()||0)+0.8,Math.max(10,Number(pub?.zoom||0))+0.8);
  let done=false;const finish=()=>{if(done)return;done=true;setTimeout(resolve,250)};
  mp?.once?.('moveend',finish);
  mp?.jumpTo?.({zoom:z});
  setTimeout(finish,1800);
}));

await page.waitForFunction(()=>{
  const a=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null;
  return document.documentElement.classList.contains('earthline-regional-corridors-revealed-17424') &&
    a?.corridorGeometryVisible17424===true;
},null,{timeout:10000,polling:100});
await page.waitForTimeout(250);

const zoomed=await page.evaluate(()=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const vis=id=>{try{return mp?.getLayer?.(id)?(mp.getLayoutProperty(id,'visibility')||'visible'):null}catch(_){return null}};
  return {
    zoom:Number(mp?.getZoom?.()||0),
    worms:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
    labels:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').length,
    labelLayer:vis('earthline-ranked-swale-label-15775'),
    soilLayer:vis('earthline-ranked-swale-soil-15777'),
    plantLayer:vis('earthline-ranked-swale-plant-15777'),
    waterSwaleLayer:vis('earthline-ranked-swale-water-15777'),
    flowLine:vis('el-live-flow-line-15970'),
    audit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,
    visibilityAudit:window.EARTHLINE_REGIONAL_CORRIDOR_VISIBILITY_17424||null
  };
});

const zoomPass=
  zoomed.worms>0 &&
  zoomed.labels>0 &&
  zoomed.labelLayer!=='none' &&
  zoomed.soilLayer!=='none' &&
  zoomed.plantLayer!=='none' &&
  zoomed.waterSwaleLayer!=='none' &&
  zoomed.flowLine!=='none' &&
  zoomed.audit?.corridorGeometryVisible17424===true;

const pass=initialPass&&zoomPass&&errors.length===0;
console.log('EARTHLINE_REGIONAL_CLEAN_17424 '+JSON.stringify({
  browser:BROWSER,pass,initialPass,zoomPass,initial,zoomed,errors
}));
await browser.close();
if(!pass)process.exitCode=1;
