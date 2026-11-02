import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const TARGETS=[20,24,28,32,36,40];
const browser=await chromium.launch({headless:true});

for(const target of TARGETS){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  let patchCount=0;
  await page.route('**/*',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch(), text=await resp.text();
    const needle='const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,20),levels=[];';
    patchCount=text.split(needle).length-1;
    const repl=`const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,${target}),levels=[];try{window.EARTHLINE_CONTOUR_SWEEP_16606={target:${target},min,max,range,step};}catch(_){}`;
    return route.fulfill({response:resp,body:text.split(needle).join(repl)});
  });
  const started=Date.now();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&!!window.EARTHLINE_SWALE_GENERATION_AUDIT_16167);},{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(250);
  const snap=await page.evaluate(()=>{
    const d=window.EARTHLINE_CONTOUR_SWEEP_16606||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];if(!c.length)return null;const q=c[Math.floor((c.length-1)/2)];return Array.isArray(q)&&Number.isFinite(+q[0])&&Number.isFinite(+q[1])?[+q[0],+q[1]]:null;};
    const eastTexas=sw.reduce((n,f)=>{const m=mid(f);return n+(m&&m[0]>-96&&m[0]<-93.45&&m[1]>28.7&&m[1]<33.1?1:0);},0);
    return {diag:d,totalMs:Number(p?.totalMs||NaN),generation:g,visibleSwales:sw.length,eastTexas,outsideAfterClip:b?.outsideAfterClip||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()};
  });
  console.log('EARTHLINE_TX_CONTOUR_SWEEP '+JSON.stringify({target,patchCount,elapsedMs:Date.now()-started,timedOut,snap,errors:errors.slice(0,8)}));
  await page.close();
}
await browser.close();
