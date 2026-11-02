import {chromium} from 'playwright';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const html=readFileSync('index.html','utf8');
if(!html.includes('earthlineGenerationAuditM90')||!html.includes('EARTHLINE_FINAL_GENERATION_TRACE_M90'))throw new Error('candidate owner missing');
const browser=await chromium.launch({headless:true});
const cases=['Arizona','Texas','Vermont'];
const rows=[];
mkdirSync('artifacts/mantra90',{recursive:true});
for(const query of cases){
  const context=await browser.newContext({viewport:{width:1600,height:950}});
  const page=await context.newPage();
  const errors=[],badResponses=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)badResponses.push({status:r.status(),url:r.url()})});
  await page.route('**/*',async route=>{
    const request=route.request();
    if(request.isNavigationRequest()&&request.resourceType()==='document'&&request.url().startsWith(BASE)){
      await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
    }else await route.continue();
  });
  let failure=null,timedOut=false;
  try{
    await page.goto(BASE+'?m90_candidate='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:25000});
    await page.evaluate(q=>{
      const inp=document.getElementById('searchInput'),btn=document.getElementById('runBtn');
      inp.value=q;inp.dispatchEvent(new Event('input',{bubbles:true}));
      inp.dispatchEvent(new Event('change',{bubbles:true}));btn.click();
    },query);
    try{
      await page.waitForFunction(()=>{
        return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970 ||
          (!!window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken &&
           !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken &&
           !!window.EARTHLINE_FINAL_GENERATION_TRACE_M90?.runToken);
      },null,{timeout:75000,polling:200});
    }catch(e){timedOut=true;}
  }catch(e){failure=String(e);}
  const snap=await page.evaluate(()=>({
    trace:window.EARTHLINE_FINAL_GENERATION_TRACE_M90||null,
    generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
    publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    performance:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178||null,
    error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')
  })).catch(()=>({}));
  const t=snap.trace,g=snap.generation,p=snap.publication;
  const pass=!failure&&!timedOut&&!snap.error&&t?.source==='final-returned-swale-collection' &&
    g?.auditOwnerM90==='final-returned-swale-collection' &&
    String(t.runToken)===String(p?.runToken) && 
    Number(t.beforeJurisdictionClip)===Number(g?.publishedFeatures) &&
    Number(t.afterJurisdictionClip)===Number(p?.generated) &&
    Number(t.afterJurisdictionClip)>0 &&
    Number(t.jurisdictionEligibleCandidates)>0;
  const row={query,pass,failure,timedOut,trace:t,generation:g,publication:p,performance:snap.performance,boundary:snap.boundary,error:snap.error,status:snap.status,errors,badResponses};
  rows.push(row);
  console.log('M90_REGIONAL '+JSON.stringify({query,pass,failure,timedOut,trace:t,generation:g,publication:p,errors:errors.slice(-4),badResponses:badResponses.slice(-5)}));
  await page.screenshot({path:'artifacts/mantra90/'+query.toLowerCase()+'.png'}).catch(()=>{});
  await context.close();
}
writeFileSync('artifacts/mantra90/results.json',JSON.stringify({source:'candidate-local-html-intercepted-on-public-origin',rows},null,2));
await browser.close();
if(rows.some(r=>!r.pass))process.exitCode=1;
