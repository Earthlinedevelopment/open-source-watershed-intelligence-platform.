import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const html=readFileSync('artifacts/mantra92/yield-ab/index.html','utf8');
const states=['Alaska','New York','Maryland'];
mkdirSync('artifacts/mantra92/yield-ab/results',{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
for(const q of states){
 const context=await browser.newContext({viewport:{width:1600,height:950}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*',route=>{
  const r=route.request();
  if(r.isNavigationRequest()&&r.resourceType()==='document'&&r.url().startsWith(BASE))
    return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
  return route.continue();
 });
 const cdp=await context.newCDPSession(page);
 let error=null,profile=null;
 try{
  await page.goto(BASE+'?m92cpu='+encodeURIComponent(q),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:15000});
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval',{interval:1000});
  await cdp.send('Profiler.start');
  await page.evaluate(q=>{const input=document.getElementById('searchInput');
    input.value=q;input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    document.getElementById('runBtn').click();
  },q);
  await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
    !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
  profile=(await cdp.send('Profiler.stop')).profile;
 }catch(e){error=String(e);try{profile=(await cdp.send('Profiler.stop')).profile}catch{}}
 const snap=await page.evaluate(()=>{
   const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},
    u=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
   return {phases:p.phaseTotalsMs||null,swales:u.generated??null,source:u.sourceFeatures??null,
      displayed:u.overlaySwaleLines??null,error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
 });
 let hits=[];
 if(profile){
   const nodes=new Map(profile.nodes.map(n=>[n.id,n]));
   const totals=new Map();
   for(let i=0;i<(profile.samples||[]).length;i++){
     const id=profile.samples[i],n=nodes.get(id);
     if(!n)continue;
     const f=n.callFrame||{},key=[f.functionName||'(anonymous)',f.lineNumber,f.columnNumber].join('|');
     const cell=totals.get(key)||{name:f.functionName||'(anonymous)',line:(f.lineNumber||0)+1,
       column:(f.columnNumber||0)+1,url:f.url||'',cpuMs:0,samples:0};
     cell.cpuMs+=Number(profile.timeDeltas?.[i]||1000)/1000;cell.samples++;
     totals.set(key,cell);
   }
   hits=Array.from(totals.values()).sort((a,b)=>b.cpuMs-a.cpuMs).slice(0,35);
 }
 const row={query:q,snap,errors:errors.slice(-5),error,topCpu:hits,
  samples:profile?.samples?.length||0,profileStart:profile?.startTime||null,profileEnd:profile?.endTime||null};
 results.push(row);
 console.log('M92_CPU_PROFILE '+JSON.stringify(row));
 await context.close();
}
await browser.close();
writeFileSync('artifacts/mantra92/yield-ab/results/cpu-profile.json',JSON.stringify(results,null,2));
