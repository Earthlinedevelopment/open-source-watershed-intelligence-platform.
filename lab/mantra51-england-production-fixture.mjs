import { chromium } from 'playwright';
const PROD=process.env.EARTHLINE_PROD||'https://earthlinedevelopment.org/';
const CAND=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});

async function capture(){
  const page=await browser.newPage({viewport:{width:1300,height:800}});
  let result={error:null,initial:null,resolved:null};
  try{
    await page.goto(PROD+'?m51-england-capture='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>typeof window.geocodeMapbox==='function',{timeout:30000});
    result=await page.evaluate(async()=>{
      const q='England';
      const originalFetch=window.fetch.bind(window);
      let first=null;
      window.fetch=async(...args)=>{
        const r=await originalFetch(...args);
        try{
          const u=String(args[0]||'');
          if(u.includes('api.mapbox.com/geocoding/')) first=await r.clone().json();
        }catch{}
        return r;
      };
      let loc=null,error=null;
      try{loc=await geocodeMapbox(q);}catch(e){error=String(e?.message||e);}
      return {error,initial:first,resolved:loc};
    });
  }catch(e){result.error=String(e?.message||e);}
  await page.close();
  return result;
}

const cap=await capture();
if(cap.error||!cap.initial?.features?.length||!cap.resolved){
  console.log(JSON.stringify({stage:'capture',...cap}));
  await browser.close();
  process.exit(1);
}

const page=await browser.newPage({viewport:{width:1500,height:860}});
let harnessError=null;
try{
  await page.goto(CAND+'?m51-england-candidate='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof window.geocodeMapbox==='function',{timeout:30000});
  const out=await page.evaluate(async({initial})=>{
    const original=window.fetch.bind(window);
    window.fetch=async(url,opts)=>{
      const u=String(url||'');
      if(u.includes('api.mapbox.com/geocoding/')) return new Response(JSON.stringify(initial),{status:200,headers:{'content-type':'application/json'}});
      return original(url,opts);
    };
    let loc=null,error=null;
    try{loc=await geocodeMapbox('England');}catch(e){error=String(e?.message||e);}
    return {loc,error};
  },{initial:cap.initial});
  if(out.error||!out.loc) throw new Error(out.error||'candidate geocoder returned no England location');
  await page.evaluate(loc=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    window.EARTHLINE_TEST_LOCATION_16845=Object.assign({},loc,{query:'England'});
    const i=document.getElementById('searchInput');
    i.value='England'; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true}));
    document.getElementById('runBtn').click();
  },out.loc);
  await page.waitForFunction(()=>{
    const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
    const d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;
    return !!e||String(d?.query||'').trim().toLowerCase()==='england';
  },{timeout:95000,polling:100});
  await page.waitForTimeout(500);
}catch(e){harnessError=String(e?.message||e);}

const snap=await page.evaluate(({capture,harnessError})=>{
  const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
  const run=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
  const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
  const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
  const visible=Number(pub?.visible??pub?.rendered??pub?.generated??0);
  return {
    captureResolved:capture.resolved,
    harnessError,
    error:err&&String(err.error||err.message||err),
    runBounds:run?.bounds||null,
    generated:Number(pub?.generated||0),
    visible,
    outside:Number(pub?.outsideJurisdiction??pub?.outside??0),
    unsafe:Number(pub?.unsafeDisplayedSegments??pub?.unsafe??0),
    waterPaths:Number(run?.derived?.waterPaths||0),
    totalMs:Number(perf?.totalMs||0)
  };
},{capture:cap,harnessError});
console.log(JSON.stringify(snap));
await page.close(); await browser.close();
if(snap.harnessError||snap.error||snap.generated===0||snap.visible===0||snap.waterPaths===0||snap.unsafe!==0) process.exit(1);
