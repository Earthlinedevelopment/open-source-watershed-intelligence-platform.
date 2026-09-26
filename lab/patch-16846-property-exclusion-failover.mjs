import fs from 'node:fs';

const file='index.html';
let s=fs.readFileSync(file,'utf8');
const start='  async function earthlineFetchOverpass15862P(result,boundary,myGen){';
const end='  function earthlineTilequerySamples15862P(boundary){';
const a=s.indexOf(start), b=s.indexOf(end,a);
if(a<0||b<0)throw new Error('16844 Overpass owner anchors not found');
if(s.indexOf(start,a+1)>=0)throw new Error('Overpass owner anchor is not unique');

const replacement=`  async function earthlineFetchOverpass15862P(result,boundary,myGen){
    /* EARTHLINE 16846 — portable Property exclusion-source resilience.
       Preserve the existing OSM screening semantics and fail-closed publication gate.
       The canonical FOSSGIS endpoint remains primary; its directly addressed lz4 backend
       is attempted only when the primary network request fails or times out. A valid
       HTTP 200 response, including a zero-feature response, is authoritative for the
       open-data acquisition result and stops failover. No state-specific logic. */
    result.overpass.attempted=true;
    result.overpass.ok=false;
    result.overpass.error=null;
    result.overpass.endpointAttempts16846=[];
    result.overpass.endpoint16846=null;
    const lngs=boundary.map(p=>Number(p[0])),lats=boundary.map(p=>Number(p[1]));
    const lat0=lats.reduce((a,b)=>a+b,0)/lats.length;
    const padLat=30/111320,padLng=30/(111320*Math.max(.05,Math.cos(lat0*Math.PI/180)));
    const south=Math.min(...lats)-padLat,west=Math.min(...lngs)-padLng;
    const north=Math.max(...lats)+padLat,east=Math.max(...lngs)+padLng;
    const bbox=[south,west,north,east].map(v=>v.toFixed(7)).join(",");
    const query='[out:json][timeout:6];('+
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
      {url:"https://overpass-api.de/api/interpreter",timeoutMs:5200,label:"canonical"},
      {url:"https://lz4.overpass-api.de/api/interpreter",timeoutMs:6200,label:"lz4-direct-fallback"}
    ];
    for(const ep of endpoints){
      if(earthlineIsStale(myGen))return false;
      const controller=typeof AbortController!=="undefined"?new AbortController():null;
      const timer=controller?setTimeout(()=>controller.abort(),ep.timeoutMs):null;
      const attempt={endpoint:ep.label,url:ep.url,timeoutMs:ep.timeoutMs,httpStatus:null,error:null,ok:false};
      const t0=typeof performance!=="undefined"&&performance.now?performance.now():Date.now();
      try{
        const response=await fetch(ep.url,{
          method:"POST",
          headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
          body:"data="+encodeURIComponent(query),
          signal:controller?controller.signal:undefined
        });
        attempt.httpStatus=response.status;
        result.overpass.httpStatus=response.status;
        if(!response.ok)throw new Error("HTTP "+response.status);
        const data=await response.json();
        if(earthlineIsStale(myGen))return false;
        const elements=Array.isArray(data&&data.elements)?data.elements:[];
        result.overpass.rawElementCount=elements.length;
        for(const el of elements)result.processedGeometryCount+=earthlineRasterOverpassElement15862P(result,el);
        attempt.ok=true;
        result.overpass.ok=true;
        result.overpass.error=null;
        result.overpass.endpoint16846=ep.label;
        return result.processedGeometryCount>0;
      }catch(err){
        attempt.error=String(err&&err.message||err);
        result.overpass.error=attempt.error;
      }finally{
        if(timer)clearTimeout(timer);
        const t1=typeof performance!=="undefined"&&performance.now?performance.now():Date.now();
        attempt.elapsedMs=Math.max(0,Math.round(t1-t0));
        result.overpass.endpointAttempts16846.push(attempt);
      }
    }
    result.overpass.error="all-overpass-endpoints-failed: "+result.overpass.endpointAttempts16846.map(x=>x.endpoint+"="+(x.error||("HTTP "+x.httpStatus))).join("; ");
    return false;
  }
`;

s=s.slice(0,a)+replacement+s.slice(b);
const oldMarker='EARTHLINE 16844 — FINAL FINE-SUPPORT REGIONAL CAPACITY';
const count=s.split(oldMarker).length-1;
if(count!==1)throw new Error(`Expected one 16844 top marker, found ${count}`);
s=s.replace(oldMarker,'EARTHLINE 16846 — PROPERTY EXCLUSION SOURCE FAILOVER');

if(!s.includes('https://lz4.overpass-api.de/api/interpreter'))throw new Error('fallback endpoint missing');
if(s.includes('overpass.private.coffee'))throw new Error('rejected endpoint unexpectedly present');
if(!s.includes('all-attempted-open-data-exclusion-sources-failed'))throw new Error('fail-closed gate missing');
fs.writeFileSync(file,s);
console.log('Patched index.html to EARTHLINE 16846; exclusion verdict remains fail-closed.');
