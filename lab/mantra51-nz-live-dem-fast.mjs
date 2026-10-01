import { chromium } from 'playwright';
const PROD='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
async function fixture(){
  const p=await browser.newPage({viewport:{width:1500,height:860}});
  await p.goto(PROD+'?nz-dem-fixture='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForFunction(()=>typeof window.geocodeMapbox==='function',{timeout:30000});
  const raw=await p.evaluate(async()=>{
    const of=window.fetch.bind(window); let raw=null;
    window.fetch=async(...a)=>{const r=await of(...a);try{if(String(a[0]||'').includes('api.mapbox.com/geocoding/'))raw=await r.clone().json()}catch{};return r};
    await geocodeMapbox('New Zealand'); return raw;
  });
  await p.close(); return raw;
}
const raw=await fixture();
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.goto(PROD+'?nz-dem-live='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(raw=>{
  const of=window.fetch.bind(window);
  window.fetch=async(u,o)=>String(u||'').includes('api.mapbox.com/geocoding/')
    ?new Response(JSON.stringify(raw),{status:200,headers:{'content-type':'application/json'}}):of(u,o);
  const i=document.getElementById('searchInput'); i.value='New Zealand';
  i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));
  document.getElementById('runBtn').click();
},raw);
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_TARGET_16201?.source==='country-center',{timeout:100000,polling:100});
const b=await page.locator('#map').boundingBox(); if(!b) throw new Error('map missing');
const x=b.x+b.width*.55,y=b.y+b.height*.55; await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+180,y+90,{steps:12});await page.mouse.up();
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_TARGET_16201?.source==='crosshair',{timeout:15000,polling:100});
await page.evaluate(()=>document.getElementById('earthlineDeclareProperty16169')?.click());
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:30000,polling:100});
const out=await page.evaluate(()=>({
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  coreFailure:(window.earthlineModel&&window.earthlineModel.propertyCoreFailure16548)||null,
  prewarm:window.EARTHLINE_PROPERTY_DEM_PREWARM_16297||null,
  declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
  displayed:window.EARTHLINE_DISPLAYED_RUN_16151||null
}));
console.log(JSON.stringify(out));
await browser.close();
if(out.audit?.result!==true) process.exit(2);
