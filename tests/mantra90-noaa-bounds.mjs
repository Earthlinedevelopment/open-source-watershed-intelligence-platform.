import {chromium} from 'playwright';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const html=readFileSync('index.html','utf8');
if(!html.includes("scheme:'tms',bounds:[-128.8,24.4,-66.0,50.3]"))throw new Error('expected NOAA source bounds absent');
const cases=['Arizona','Vermont'];const rows=[];
mkdirSync('artifacts/mantra90-noaa',{recursive:true});
const browser=await chromium.launch({headless:true});
for(const query of cases){
 const context=await browser.newContext({viewport:{width:1600,height:950}});
 const page=await context.newPage(),bad=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)bad.push({status:r.status(),url:r.url()})});
 await page.route('**/*',async route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
   await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
  } else await route.continue();
 });
 let timedOut=false,error=null;
 try{
  await page.goto(BASE+'?m90_noaa='+query+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:25000});
  await page.evaluate(q=>{const input=document.getElementById('searchInput');input.value=q;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click();},query);
  try{await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
     (!!window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken),null,{timeout:70000,polling:150})}
  catch(_){timedOut=true}
 }catch(e){error=String(e)}
 const snap=await page.evaluate(()=>{
  const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
  const src=map?.getSource?.('el-live-grace-groundwater-15970');
  return {source:src?.serialize?.()||null,pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,gen:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,context:window.EARTHLINE_REGIONAL_CONTEXT_16198||null};
 }).catch(e=>({evaluationError:String(e)}));
 await page.waitForTimeout(1500);
 const noaa404=bad.filter(r=>r.status===404&&r.url.includes('/nasa-gws-0.25d/'));
 const coords=snap.source?.bounds;
 const boundsPass=Array.isArray(coords)&&JSON.stringify(coords)===JSON.stringify([-128.8,24.4,-66,50.3]);
 const pass=!error&&!timedOut&&!snap.error&&boundsPass&&noaa404.length===0&&Number(snap.pub?.generated||0)>0&&snap.gen?.auditOwnerM90==='final-returned-swale-collection';
 rows.push({query,pass,error,timedOut,boundsPass,graceBounds:coords,noaa404,publication:snap.pub,context:snap.context,pageErrors:errors,badResponses:bad});
 console.log('M90_NOAA_BOUNDS '+JSON.stringify({query,pass,error,timedOut,boundsPass,graceBounds:coords,noaa404,generated:snap.pub?.generated,pageErrors:errors.slice(-3),badResponses:bad.slice(-5)}));
 await page.screenshot({path:'artifacts/mantra90-noaa/'+query.toLowerCase()+'.png'}).catch(()=>{});
 await context.close();
}
await browser.close();
writeFileSync('artifacts/mantra90-noaa/results.json',JSON.stringify(rows,null,2));
if(rows.some(r=>!r.pass))process.exitCode=1;
