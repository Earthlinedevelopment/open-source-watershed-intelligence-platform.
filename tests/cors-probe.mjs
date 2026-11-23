/* Can a browser on earthlinedevelopment.org read the free elevation and tree-cover services directly?
   A page cannot read a response unless the service sends an Access-Control-Allow-Origin header, so this runs the same fetches the
   new build would make, from that origin, and reports what a browser actually allows. Read-only. Needs network (GitHub Actions).
   Prints one line: EARTHLINE_CORS_PROBE {...} */
import {chromium} from 'playwright';
const ORIGIN='https://earthlinedevelopment.org';
const LNG=-75.76996,LAT=42.78781;
const probes=[
 {id:'usgs-3dep-getSamples',method:'POST',url:'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/getSamples',
  form:{geometry:JSON.stringify({points:[[LNG,LAT]],spatialReference:{wkid:4326}}),geometryType:'esriGeometryMultipoint',returnFirstValueOnly:'true',interpolation:'RSP_BilinearInterpolation',f:'json'},expect:j=>Array.isArray(j.samples)&&j.samples.length===1},
 {id:'usgs-epqs-point',method:'GET',url:'https://epqs.nationalmap.gov/v1/json?'+new URLSearchParams({x:LNG,y:LAT,wkid:4326,units:'Meters',includeDate:'false'}),expect:j=>j&&('value' in j)},
 {id:'mrlc-nlcd-canopy',method:'GET',url:'https://www.mrlc.gov/geoserver/mrlc_display/wms?'+new URLSearchParams({service:'WMS',version:'1.1.1',request:'GetFeatureInfo',layers:'nlcd_tcc_conus_2021_v2021-4',query_layers:'nlcd_tcc_conus_2021_v2021-4',styles:'',format:'image/png',info_format:'application/json',srs:'EPSG:4326',bbox:[LNG-0.001,LAT-0.001,LNG+0.001,LAT+0.001].join(','),width:'201',height:'201',x:'100',y:'100',feature_count:'1'}),expect:j=>Array.isArray(j.features)}
];
const mock=process.env.EARTHLINE_PROBE_MOCK==='1';
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext();
const page=await ctx.newPage();
await page.route(ORIGIN+'/cors-probe',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>probe</title><p>probe</p>'}));
if(mock){ /* self-test of this script only: two services allow the origin, one does not */
  await page.route('https://elevation.nationalmap.gov/**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({samples:[{value:'400.5'}]})}));
  await page.route('https://epqs.nationalmap.gov/**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':ORIGIN},body:JSON.stringify({value:400.5})}));
  await page.route('https://www.mrlc.gov/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({features:[]})}));
}
await page.goto(ORIGIN+'/cors-probe');
const results=[];
for(const p of probes){
  const t0=Date.now();
  const out=await page.evaluate(async p=>{
    try{
      const init={method:p.method,mode:'cors',credentials:'omit'};
      if(p.form){init.headers={'content-type':'application/x-www-form-urlencoded'};init.body=new URLSearchParams(p.form).toString();}
      const res=await fetch(p.url,init);
      const text=await res.text();let json=null;try{json=JSON.parse(text);}catch(_){}
      return {reached:true,status:res.status,ok:res.ok,json,bytes:text.length};
    }catch(e){return {reached:false,error:String(e&&e.message||e).slice(0,160)};}
  },{method:p.method,url:p.url,form:p.form||null});
  const readable=!!(out.reached&&out.ok);
  results.push({id:p.id,browserCanRead:readable,answerLooksRight:readable?!!(out.json&&p.expect(out.json)):false,status:out.status||null,error:out.error||null,ms:Date.now()-t0,
    verdict:readable?(out.json&&p.expect(out.json)?'READABLE':'READABLE BUT UNEXPECTED ANSWER'):(out.reached?'HTTP '+out.status:'BLOCKED OR UNREACHABLE (usually CORS)')});
}
await browser.close();
console.log('EARTHLINE_CORS_PROBE '+JSON.stringify({testedAt:new Date().toISOString(),origin:ORIGIN,mock,results}));
