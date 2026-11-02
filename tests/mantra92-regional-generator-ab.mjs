import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const original=readFileSync('artifacts/mantra92/yield-ab/index.html','utf8');
const BASE='https://earthlinedevelopment.org/';
const states=['Alaska','New York','Texas'];
const expected={'Alaska':'us-ak','New York':'us-ny','Texas':'us-tx'};
const needleA='(++yieldCount16661%384)===0';
const needleB='(++finalScreenYield16661%384)===0';
for(const needle of [needleA,needleB])
  if(original.split(needle).length!==2)throw Error('Unexpected source: '+needle);
const modes=[384,1536,4096];
const browser=await chromium.launch({headless:true});
const rows=[];
mkdirSync('artifacts/mantra92/yield-ab/results',{recursive:true});
for(const rate of modes){
 const html=rate===384?original:original.replace(needleA,'(++yieldCount16661%'+rate+')===0')
   .replace(needleB,'(++finalScreenYield16661%'+rate+')===0');
 for(const q of states){
  const ctx=await browser.newContext({viewport:{width:1600,height:950}});
  const page=await ctx.newPage(),errs=[];
  page.on('pageerror',e=>errs.push(String(e)));
  await page.route('**/*',route=>{
   const r=route.request();
   if(r.isNavigationRequest()&&r.resourceType()==='document'&&r.url().startsWith(BASE))
     return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
   return route.continue();
  });
  let failure=null;
  const start=Date.now();
  try{
   await page.goto(BASE+'?m92yield='+rate+'-'+encodeURIComponent(q),{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForSelector('#searchInput',{timeout:15000});
   await page.evaluate(q=>{const el=document.getElementById('searchInput');
      el.value=q;el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
      document.getElementById('runBtn').click();},q);
   await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
    !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
  }catch(e){failure=String(e)}
  const snap=await page.evaluate(()=>{
   const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},
    pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{},
    pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||{},
    aud=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{},
    b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||{};
   return {core:p?.phaseTotalsMs?.coreTotalMs??null,phases:p?.phaseTotalsMs||null,
     water:p?.waterPaths??null,swales:pub?.generated??null,
     source:pub?.sourceFeatures??null,overlay:pub?.overlaySwaleLines??null,
     unsafe:aud?.unsafeSegments??null,outside:b?.outsideAfterClip?.swales??null,
     profile:pkg?.profileId??null,
     error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  });
  const why=[];
  if(failure||snap.error||errs.length)why.push('browser/error');
  if(snap.profile!==expected[q])why.push('wrong state');
  if(!Number.isFinite(snap.core)||snap.core>15000)why.push('over 15s');
  if(!(snap.swales>0)||snap.swales!==snap.source||snap.swales!==snap.overlay)why.push('publish mismatch');
  if(snap.unsafe!==0||snap.outside!==null&&snap.outside!==0)why.push('unsafe/outside');
  const row={rate,q,coreMs:snap.core,phases:snap.phases,swales:snap.swales,source:snap.source,overlay:snap.overlay,water:snap.water,
   wall:Date.now()-start,why,errors:errs.slice(-3),failure};
  rows.push(row);console.log('M92_YIELD_AB '+JSON.stringify(row));
  await ctx.close();
 }
}
await browser.close();
writeFileSync('artifacts/mantra92/yield-ab/results/matrix.json',JSON.stringify(rows,null,2));
console.log('M92_YIELD_AB_SUMMARY '+JSON.stringify(rows.map(({rate,q,coreMs,swales,why})=>({rate,q,coreMs,swales,why}))));
