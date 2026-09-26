import { chromium } from 'playwright';

const center={lat:37.910189807471525,lng:-119.65449369124157};
const d=0.004;
const bbox=[center.lat-d,center.lng-d,center.lat+d,center.lng+d].map(v=>v.toFixed(7)).join(',');
const query='[out:json][timeout:18];('+
  'way["building"]('+bbox+');relation["building"]('+bbox+');'+
  'way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street|service|track|road|pedestrian|construction)$"]('+bbox+');'+
  'way["amenity"="parking"]('+bbox+');relation["amenity"="parking"]('+bbox+');'+
  'way["parking"]('+bbox+');relation["parking"]('+bbox+');'+
  'way["natural"="water"]('+bbox+');relation["natural"="water"]('+bbox+');'+
  'way["natural"="wetland"]('+bbox+');relation["natural"="wetland"]('+bbox+');'+
  'way["waterway"="riverbank"]('+bbox+');relation["waterway"="riverbank"]('+bbox+');'+
  'way["waterway"~"^(river|stream|canal|ditch|drain)$"]('+bbox+');'+
  'way["natural"="coastline"]('+bbox+');'+
  'way["water"]('+bbox+');relation["water"]('+bbox+');'+
  ');out geom;';
const endpoints=[
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter'
];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
await page.goto('https://earthlinedevelopment.org/?overpass-benchmark='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
for(const endpoint of endpoints){
  for(let rep=1;rep<=2;rep++){
    const out=await page.evaluate(async ({endpoint,query})=>{
      const c=new AbortController(); const timer=setTimeout(()=>c.abort(),8000); const t0=performance.now();
      try{
        const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'data='+encodeURIComponent(query),signal:c.signal});
        const txt=await r.text(); let count=null;
        try{count=JSON.parse(txt)?.elements?.length??null;}catch{}
        return {ok:r.ok,status:r.status,ms:Math.round(performance.now()-t0),bytes:txt.length,count};
      }catch(e){return {ok:false,status:null,ms:Math.round(performance.now()-t0),error:String(e&&e.message||e)};}
      finally{clearTimeout(timer);}
    },{endpoint,query});
    console.log(JSON.stringify({endpoint,rep,...out}));
  }
}
await browser.close();
