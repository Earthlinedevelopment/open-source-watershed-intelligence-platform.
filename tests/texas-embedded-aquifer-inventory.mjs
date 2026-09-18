import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1400,height:900}});
await page.goto(URL+'?embedded_tx='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const state=await page.evaluate(()=>{
  const tx={minLng:-106.64558,minLat:25.8371,maxLng:-93.50804,maxLat:36.50044};
  const bbox=g=>{let minLng=Infinity,minLat=Infinity,maxLng=-Infinity,maxLat=-Infinity;const walk=v=>{if(!Array.isArray(v))return;if(v.length>=2&&Number.isFinite(+v[0])&&Number.isFinite(+v[1])){minLng=Math.min(minLng,+v[0]);maxLng=Math.max(maxLng,+v[0]);minLat=Math.min(minLat,+v[1]);maxLat=Math.max(maxLat,+v[1]);return;}v.forEach(walk)};walk(g?.coordinates);return Number.isFinite(minLng)?{minLng,minLat,maxLng,maxLat}:null;};
  let fc=null, hits=[];
  try{fc=typeof EARTHLINE_EMBEDDED_AQUIFERS!=='undefined'?EARTHLINE_EMBEDDED_AQUIFERS:null;}catch(_){}
  try{hits=typeof earthlineEmbeddedAquifersForBBox==='function'?earthlineEmbeddedAquifersForBBox(tx):[];}catch(_){}
  return {
    total:Array.isArray(fc?.features)?fc.features.length:null,
    txCount:hits.length,
    tx:hits.map((f,i)=>({i,name:f?.properties?.name||f?.properties?.NAME||f?.properties?.Aquifer||f?.properties?.AQ_NAME||null,props:f?.properties||{},bbox:bbox(f?.geometry)}))
  };
});
console.log('EARTHLINE_TX_EMBEDDED_AQUIFERS '+JSON.stringify(state));
await browser.close();
