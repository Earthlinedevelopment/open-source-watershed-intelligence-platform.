import { chromium } from 'playwright';

const PROD=process.env.EARTHLINE_PROD||'https://earthlinedevelopment.org/';
const CAND=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});

async function nzFixture(){
  const page=await browser.newPage({viewport:{width:1500,height:860}});
  await page.goto(PROD+'?m51-nz-fixture='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof window.geocodeMapbox==='function',{timeout:30000});
  const raw=await page.evaluate(async()=>{
    const original=window.fetch.bind(window);
    let captured=null;
    window.fetch=async(...args)=>{
      const r=await original(...args);
      try{
        const u=String(args[0]||'');
        if(u.includes('api.mapbox.com/geocoding/'))captured=await r.clone().json();
      }catch{}
      return r;
    };
    await geocodeMapbox('New Zealand');
    return captured;
  });
  await page.close();
  if(!raw?.features?.length)throw new Error('NZ production geocoder fixture unavailable');
  return raw;
}

const fixture=await nzFixture();
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.goto(CAND+'?m51-nz-interaction='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});

await page.evaluate(raw=>{
  const original=window.fetch.bind(window);
  window.fetch=async(url,opts)=>{
    const u=String(url||'');
    if(u.includes('api.mapbox.com/geocoding/'))return new Response(JSON.stringify(raw),{status:200,headers:{'content-type':'application/json'}});
    return original(url,opts);
  };
  const i=document.getElementById('searchInput');
  const b=document.getElementById('runBtn');
  i.value='New Zealand';
  i.dispatchEvent(new Event('input',{bubbles:true}));
  i.dispatchEvent(new Event('change',{bubbles:true}));
  b.click();
},fixture);

await page.waitForFunction(()=>{
  const d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;
  const t=window.EARTHLINE_PROPERTY_TARGET_16201;
  return String(d?.query||'').trim().toLowerCase()==='new zealand' && t?.source==='country-center';
},{timeout:100000,polling:100});

const before=await page.evaluate(()=>{
  const m=window.map||window.mapboxMap;
  const c=m?.getCenter?.();
  const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  return {center:c?[+c.lng,+c.lat]:null,target:t?{lng:+t.lng,lat:+t.lat,source:String(t.source||'')}:null,lock:window.EARTHLINE_COUNTRY_TARGET_LOCK_16845};
});

await page.evaluate(()=>{
  window.__M51_POINTERS=[];
  window.__M51_MOVEENDS=0;
  document.addEventListener('pointerdown',e=>{
    const mapEl=document.getElementById('map');
    window.__M51_POINTERS.push({tag:e.target&&e.target.tagName||'',id:e.target&&e.target.id||'',insideMap:!!(mapEl&&(e.target===mapEl||mapEl.contains(e.target))),lock:window.EARTHLINE_COUNTRY_TARGET_LOCK_16845});
  },true);
  const m=window.map||window.mapboxMap;
  try{m&&m.on&&m.on('moveend',()=>{window.__M51_MOVEENDS++})}catch{}
});
const mapBox=await page.locator('#map').boundingBox();
if(!mapBox)throw new Error('map box unavailable');
const x=mapBox.x+mapBox.width*0.55, y=mapBox.y+mapBox.height*0.55;
await page.mouse.move(x,y);
await page.mouse.down();
await page.mouse.move(x+180,y+90,{steps:12});
await page.mouse.up();

await page.waitForTimeout(2500);

const after=await page.evaluate(()=>{
  const m=window.map||window.mapboxMap;
  const c=m?.getCenter?.();
  const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  const mapEl=document.getElementById('map');
  const style=mapEl?getComputedStyle(mapEl):null;
  return {center:c?[+c.lng,+c.lat]:null,target:t?{lng:+t.lng,lat:+t.lat,source:String(t.source||'')}:null,lock:window.EARTHLINE_COUNTRY_TARGET_LOCK_16845,pointers:window.__M51_POINTERS||[],moveends:window.__M51_MOVEENDS||0,mapPointerEvents:style?.pointerEvents||null};
});
console.log(JSON.stringify({diagnostic:true,before,after}));

const d=Math.hypot(after.target.lng-after.center[0],after.target.lat-after.center[1]);
const moved=Math.hypot(after.target.lng-before.target.lng,after.target.lat-before.target.lat);
console.log(JSON.stringify({before,after,distanceTargetToMapCenter:d,movedDegrees:moved}));
if(after.target.source!=='crosshair')throw new Error('target did not transfer to crosshair');
if(after.lock!==false)throw new Error('country target lock did not release');
if(d>0.02)throw new Error('crosshair target does not match moved map center');
if(moved<0.02)throw new Error('crosshair target did not materially move');

await browser.close();
