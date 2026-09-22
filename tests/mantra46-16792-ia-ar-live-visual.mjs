import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const CASES=['Iowa','Arkansas'];
mkdirSync('artifacts/mantra46-16792-ia-ar-visual',{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];
for(const query of CASES){
  const context=await browser.newContext({viewport:{width:1920,height:1080}});
  const page=await context.newPage(); const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;
  try{
    await page.goto(BASE+'?m46_ia_ar_visual='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const marker=await page.evaluate(()=>document.documentElement.outerHTML.includes('EARTHLINE 16792 — ATOMIC STATE DISPLAY OWNERSHIP'));
    if(!marker)throw new Error('16792 not live');
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        return /screening published\./i.test(s)&&String(window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784?.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:45000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(3500);
  }catch(e){loadError=String(e);}
  try{await page.screenshot({path:'artifacts/mantra46-16792-ia-ar-visual/'+query.toLowerCase()+'.png',fullPage:false});}catch(_){}
  const snap=loadError?{}:await page.evaluate(()=>{
    const mc=(typeof earthlineMap!=='undefined'&&earthlineMap?.getCenter)?earthlineMap.getCenter():null;
    return ({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
    spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
    fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    mapCenter:mc?{lng:mc.lng,lat:mc.lat,zoom:earthlineMap.getZoom()}:null,
    Mcenter:(typeof M!=='undefined'?{lng:M.centerLng,lat:M.centerLat,zoom:M.viewZoom}:null),
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    atomic:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null
  })});
  rows.push({query,loadError,timedOut,pageErrors,snap});
  console.log('EARTHLINE_M46_IA_AR_VISUAL '+JSON.stringify({query,loadError,timedOut,pageErrors,coreMs:snap?.perf?.totalMs,generated:snap?.display?.swaleLines,rootPass:snap?.root?.pass,lineage:snap?.root?.cellLineage,spread:snap?.spread}));
  await context.close();
}
await browser.close();
writeFileSync('artifacts/mantra46-16792-ia-ar-visual/results.json',JSON.stringify(rows,null,2));
