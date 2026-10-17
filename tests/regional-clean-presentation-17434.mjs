import { chromium, firefox, webkit } from 'playwright';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?regionalClean17434='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click();
const rb=page.locator('#runBtn');
if(await rb.isVisible() && !await rb.isDisabled()) await rb.click();

await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
await page.waitForTimeout(500);

const snap=()=>page.evaluate(()=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const overlay=document.getElementById('earthlineRegionalVectorOverlay16020');
  const wormPaths=overlay?.querySelectorAll('[data-layer="swale-opportunities"] path').length||0;
  const tabs=overlay?.querySelectorAll('.earthline-swale-label-16149').length||0;
  const swales=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features?.length||0;
  const publicationZoom=Number(window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337?.zoom);
  const currentZoom=Number(mp?.getZoom?.());
  const layerState=id=>{
    try{return mp?.getLayer?.(id)?{exists:true,visibility:mp.getLayoutProperty(id,'visibility')||'visible'}:{exists:false,visibility:null}}catch(_){return{exists:false,visibility:null}}
  };
  const water=[
    layerState('el-live-flow-casing-15970'),
    layerState('el-live-flow-line-15970'),
    layerState('el-live-flow-arrow-15970')
  ];
  const aquifer=[
    layerState('el-live-aquifer-fill-15970'),
    layerState('el-live-aquifer-line-15970'),
    layerState('el-live-aquifer-label-15970'),
    layerState('el-live-aquifer-raster-layer-15970')
  ];
  const audit=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
  return {
    wormPaths,tabs,swales,publicationZoom,currentZoom,
    overlayNodes:overlay?.querySelectorAll('*').length||0,
    water,aquifer,audit,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null
  };
});

const initial=await snap();

await page.evaluate(()=>new Promise(resolve=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(!mp)return resolve();
  const z=Number(window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337?.zoom);
  const target=(Number.isFinite(z)?z:Number(mp.getZoom?.()||6))+1.5;
  let done=false; const finish=()=>{if(done)return;done=true;setTimeout(resolve,300)};
  mp.once?.('zoomend',finish);
  mp.jumpTo({center:mp.getCenter(),zoom:target,bearing:mp.getBearing?.()||0,pitch:mp.getPitch?.()||0});
  setTimeout(finish,1500);
}));
await page.waitForTimeout(350);
const zoomed=await snap();

const waterOk=initial.water.every(x=>!x.exists||x.visibility!=='none');
const aquiferOk=initial.aquifer.every(x=>!x.exists||x.visibility!=='none');
const initialClean=initial.swales>0&&initial.wormPaths===0&&initial.tabs>0;
const zoomReveal=zoomed.wormPaths>0&&zoomed.tabs>0;
const auditOk=initial.audit?.corridorGeometryVisible===false&&Number(initial.audit?.swaleLines||0)===0&&Number(initial.audit?.generatedSwales||0)>0&&zoomed.audit?.corridorGeometryVisible===true&&Number(zoomed.audit?.swaleLines||0)>0;
const pass=initialClean&&zoomReveal&&waterOk&&aquiferOk&&auditOk&&!errors.length;

console.log('EARTHLINE_REGIONAL_CLEAN_17434 '+JSON.stringify({
  browser:BROWSER,pass,initialClean,zoomReveal,waterOk,aquiferOk,auditOk,
  initial,zoomed,errors
}));
await browser.close();
if(!pass)process.exitCode=1;
