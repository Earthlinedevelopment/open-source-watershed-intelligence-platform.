import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const URL='https://earthlinedevelopment.org/';
const ENDPOINT='https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/0/query';
const OFFSETS=['0.00015','0.001','0.0025','0.005'];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1200,height:800}});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
const results=[];
for(const offset of OFFSETS){
  const r=await page.evaluate(async ({endpoint,offset})=>{
    const started=performance.now();
    const cb='__earthlineBoundaryProbe_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const params=new URLSearchParams({where:"NAME='Texas'",outFields:'NAME,STUSAB,GEOID,INTPTLAT,INTPTLON',returnGeometry:'true',outSR:'4326',maxAllowableOffset:offset,geometryPrecision:'5'});
    return await new Promise(resolve=>{
      const script=document.createElement('script');
      let settled=false;
      const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);try{script.remove();}catch(_){};window[cb]=()=>{};resolve(value);};
      const timer=setTimeout(()=>finish({ok:false,error:'timeout',elapsedMs:Math.round(performance.now()-started)}),8000);
      window[cb]=data=>{
        const rows=Array.isArray(data?.features)?data.features:[];
        let rings=0,vertices=0;
        for(const f of rows){for(const ring of (f?.geometry?.rings||[])){rings++;vertices+=Array.isArray(ring)?ring.length:0;}}
        finish({ok:!data?.error,error:data?.error?.message||null,features:rows.length,rings,vertices,elapsedMs:Math.round(performance.now()-started),name:rows[0]?.attributes?.NAME||null,abbr:rows[0]?.attributes?.STUSAB||null});
      };
      params.set('callback',cb);params.set('f','json');
      script.async=true;script.onerror=()=>finish({ok:false,error:'script-error',elapsedMs:Math.round(performance.now()-started)});
      script.src=endpoint+'?'+params.toString();document.head.appendChild(script);
    });
  },{endpoint:ENDPOINT,offset});
  results.push({offset,...r});
  console.log('EARTHLINE_BOUNDARY_PROBE '+JSON.stringify({offset,...r}));
}
writeFileSync('texas-production-diagnostic-results.json',JSON.stringify(results,null,2));
if(results.some(r=>!r.ok||!r.features||!r.vertices))process.exitCode=1;
await browser.close();
