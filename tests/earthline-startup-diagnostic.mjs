import {chromium,firefox,webkit} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const profile=process.env.EARTHLINE_PROFILE||'desktop-firefox';
const engine=({'desktop-chrome':chromium,'desktop-firefox':firefox,'desktop-safari':webkit})[profile];
const origin='https://earthlinedevelopment.org',html=readFileSync('index.html');
const extra=Object.fromEntries(['earthline-property-swales.js','earthline-property-swale-bridge.js','earthline-elder-restored-17097.js','earthline-elder-worker-17129.js'].map(x=>['/'+x,readFileSync(x)]));
const dir='startup-diagnostic/'+profile;mkdirSync(dir,{recursive:true});
const safe=x=>String(x).replace(/(access_token|apikey|token|key)=([^&\s]+)/gi,'$1=REDACTED').slice(0,350);
const report={profile,errors:[],samples:[],checkedAt:new Date().toISOString()};
let browser,ctx,page;
try{
 browser=await engine.launch({headless:true});ctx=await browser.newContext({viewport:{width:1440,height:900}});page=await ctx.newPage();
 await ctx.route('**/*',route=>{let u;try{u=new URL(route.request().url())}catch{return route.continue()}
  if(u.origin===origin&&(u.pathname==='/'||u.pathname==='/index.html')&&route.request().resourceType()==='document')return route.fulfill({status:200,contentType:'text/html',body:html});
  if(u.origin===origin&&extra[u.pathname])return route.fulfill({status:200,contentType:'text/javascript',body:extra[u.pathname]});
  return route.continue();
 });
 page.on('pageerror',e=>report.errors.push({type:'pageerror',message:safe(e.stack||e)}));
 page.on('console',m=>{if(m.type()==='error')report.errors.push({type:'console',message:safe(m.text())})});
 page.on('requestfailed',req=>{if(/mapbox|jsdelivr|earthline/.test(req.url()))report.errors.push({type:'requestfailed',url:safe(req.url()),error:req.failure()?.errorText})});
 page.on('response',res=>{if(res.status()>=400&&/mapbox|jsdelivr|earthline/.test(res.url()))report.errors.push({type:'HTTP '+res.status(),url:safe(res.url())})});
 await page.goto(origin+'/?startup-check='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 let prev=0;
 for(const ms of [0,1000,3000,6000,10000]){
  if(ms)await page.waitForTimeout(ms-prev);prev=ms;
  const sample=await page.evaluate(()=>{
   const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.(),t=window.EARTHLINE_PROPERTY_TARGET_16201||null,base=document.getElementById('mapboxBase');
   let webgl;try{webgl=!!document.createElement('canvas').getContext('webgl')}catch(e){webgl=String(e)}
   return {webgl,mapPresent:!!m,mapLoadError:typeof earthlineMapLoadError!=='undefined'?earthlineMapLoadError:null,center:c?{lng:c.lng,lat:c.lat}:null,zoom:m?.getZoom?.()??null,projection:m?.getProjection?.()?.name||null,globeOverview:base?.classList.contains('globe-overview')||false,target:t?{lat:t.lat,lng:t.lng,source:t.source}:null,canvas:!!base?.querySelector('canvas'),mapboxLoaded:typeof window.mapboxgl!=='undefined',mapboxSupported:typeof window.mapboxgl?.supported==='function'?window.mapboxgl.supported():null};
  });
  report.samples.push({ms,...sample});
  if(ms===6000||ms===10000)await page.screenshot({path:dir+'/startup-'+ms+'.png'}).catch(()=>{});
 }
 const x=report.samples.at(-1);
 report.healthyMap=!!(x.mapPresent&&x.canvas&&x.mapLoadError===false);
 report.idleGlobe=!!(x.mapPresent&&(x.projection==='globe'||(x.zoom??10)<3.5));
 console.log('EARTHLINE_STARTUP_DIAGNOSTIC '+JSON.stringify({profile,healthyMap:report.healthyMap,idleGlobe:report.idleGlobe,samples:report.samples,errors:report.errors.slice(0,12)}));
}catch(e){report.fatal=safe(e.stack||e);console.log('EARTHLINE_STARTUP_FATAL '+report.fatal)}
finally{writeFileSync(dir+'/results.json',JSON.stringify(report,null,2));if(ctx)await ctx.close().catch(()=>{});if(browser)await browser.close().catch(()=>{})}
if(!report.healthyMap||!report.idleGlobe)process.exitCode=1;
