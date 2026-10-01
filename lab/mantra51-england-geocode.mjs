import { chromium } from 'playwright';
const URL=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1300,height:800}});
await page.goto(URL+'?england-geocode='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>typeof window.geocodeMapbox==='function',{timeout:30000});
const out=await page.evaluate(async()=>{
  const q='England';
  const clean=typeof earthlinePlaceLookupQuery16541==='function'?earthlinePlaceLookupQuery16541(q):q;
  const url='https://api.mapbox.com/geocoding/v5/mapbox.places/'+encodeURIComponent(clean)+'.json?limit=10&language=en&access_token='+MAPBOX_TOKEN;
  let raw=null,rawError=null;
  try{
    const r=await fetch(url);
    raw={status:r.status,json:r.ok?await r.json():null};
  }catch(e){rawError=String(e?.message||e);}
  const simplify=f=>({
    text:f?.text||null,
    place_name:f?.place_name||null,
    place_type:f?.place_type||null,
    relevance:f?.relevance??null,
    id:f?.id||null,
    short_code:f?.properties?.short_code||null,
    bbox:f?.bbox||null,
    center:f?.center||null,
    context:(f?.context||[]).map(c=>({id:c.id,text:c.text,short_code:c.short_code||c.properties?.short_code||null}))
  });
  const tries={};
  for(const query of ['England','England, United Kingdom','England, UK']){
    try{tries[query]={loc:await geocodeMapbox(query),error:null};}
    catch(e){tries[query]={loc:null,error:String(e?.message||e)};}
  }
  return {rawError,rawStatus:raw?.status||null,features:(raw?.json?.features||[]).map(simplify),tries};
});
console.log(JSON.stringify(out,null,2));
await browser.close();
