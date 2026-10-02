import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto('https://earthlinedevelopment.org/?france-camera='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='france country'; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); b.click();
});
await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_TERMINAL_16539?.status==='published',null,{timeout:180000,polling:250});
await page.waitForTimeout(2500);
const out=await page.evaluate(()=>{
  const m=window.earthlineMap||window.map||window.mapboxMap;
  const c=m?.getCenter?.(), z=m?.getZoom?.(), b=m?.getBounds?.();
  const pkg=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||window.EARTHLINE_LAST_ATOMIC_COUNTRY_PACKAGE_16845||null;
  const run=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
  const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  return {
    mapCenter:c?{lng:+c.lng,lat:+c.lat}:null,
    zoom:+z,
    mapBounds:b?{west:b.getWest(),south:b.getSouth(),east:b.getEast(),north:b.getNorth()}:null,
    packageCenter:pkg?.center||null,
    packageBounds:pkg?.regionalExtent?.bbox||pkg?.location?.bbox||null,
    runBounds:run?.bounds||null,
    runCenter:run?.center||null,
    target:target?{lng:+target.lng,lat:+target.lat,source:String(target.source||'')}:null,
    displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
    sidebarWidth:document.querySelector('.sidebar')?.getBoundingClientRect?.().width||document.querySelector('#sidebar')?.getBoundingClientRect?.().width||null,
    mapRect:document.getElementById('map')?.getBoundingClientRect?.().toJSON?.()||null
  };
});
console.log('FRANCE_CAMERA_DIAG '+JSON.stringify(out));
await browser.close();
// trigger France camera diagnostic
