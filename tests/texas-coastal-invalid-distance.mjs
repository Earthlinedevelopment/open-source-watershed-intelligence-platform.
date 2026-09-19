import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const variants=[
 {name:'live',supp:true,short:true},
 {name:'noSupplemental',supp:false,short:true},
 {name:'noShortRecovery',supp:true,short:false},
 {name:'preBoth',supp:false,short:false}
];
const states=['California','Maryland'];
const rows=[];

for(const variant of variants){
 const page=await browser.newPage({viewport:{width:1800,height:1000}});
 const patches={};
 await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  if(!variant.supp){
    const needle="const useSupplemental16609=!focusMode&&step16609>=200;";
    const n=body.split(needle).length-1;patches.noSupplemental=n;if(n!==1)throw new Error('noSupplemental expected 1 found '+n);
    body=body.replace(needle,"const useSupplemental16609=false;");
  }
  if(!variant.short){
    const needle="if(!focusMode&&linePx16632<10&&linePx16632>=4&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>10000){";
    const n=body.split(needle).length-1;patches.noShortRecovery=n;if(n!==1)throw new Error('noShortRecovery expected 1 found '+n);
    body=body.replace(needle,"if(false&& !focusMode&&linePx16632<10&&linePx16632>=4&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>10000){");
  }
  return route.fulfill({response:resp,body});
 });
 await page.goto(URL+'?shared_regression_ab='+variant.name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 for(const stateName of states){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||'')),started=Date.now();
  await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const t=String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||t!==prev)&&!!t);},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(500);
  const snap=await page.evaluate((q)=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const pts=sw.map(mid).filter(Array.isArray);
    const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    let regions={};
    if(/california/i.test(q))regions={
      west:pts.filter(m=>+m[0]<=-119.5).length,
      east:pts.filter(m=>+m[0]>-119.5).length,
      north:pts.filter(m=>+m[1]>=37.5).length,
      south:pts.filter(m=>+m[1]<37.5).length,
      farEast:pts.filter(m=>+m[0]>-118).length
    };
    if(/maryland/i.test(q))regions={
      west:pts.filter(m=>+m[0]<-78).length,
      central:pts.filter(m=>+m[0]>=-78&&+m[0]<-76.8).length,
      east:pts.filter(m=>+m[0]>=-76.8).length,
      north:pts.filter(m=>+m[1]>=39).length,
      south:pts.filter(m=>+m[1]<39).length
    };
    return {swales:sw.length,visible:d?.swaleLines??null,published:gen?.publishedFeatures??null,candidates:gen?.candidates??null,eligible:gen?.jurisdictionEligibleCandidates??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,regions,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  },stateName);
  const row={variant:variant.name,state:stateName,elapsedMs:Date.now()-started,timedOut,patches,snap};rows.push(row);console.log('EARTHLINE_SHARED_REGRESSION_AB '+JSON.stringify(row));
 }
 await page.close();
}
console.log('EARTHLINE_SHARED_REGRESSION_AB_SUMMARY '+JSON.stringify(rows));
await browser.close();
if(rows.some(r=>r.timedOut||r.snap.lastError||r.snap.visible!==r.snap.published||Number(r.snap.outside?.swales||0)!==0||Number(r.snap.unsafe||0)!==0))process.exitCode=1;
