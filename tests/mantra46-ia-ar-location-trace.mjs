import { chromium } from 'playwright';
const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
for(const query of ['Arkansas','Iowa']){
  const context=await browser.newContext({viewport:{width:1920,height:1080}});
  const page=await context.newPage();
  await page.goto(BASE+'?m46_loc_trace='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  await page.waitForFunction(q=>{
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    return /screening published\./i.test(s)&&String(window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784?.query||'').toLowerCase().includes(q.toLowerCase());
  },query,{timeout:45000,polling:100});
  for(const delay of [0,500,1500,3000]){
    if(delay)await page.waitForTimeout(delay);
    const x=await page.evaluate(()=>({
      Mloc:(typeof M!=='undefined'?M.loc:null),centerLng:(typeof M!=='undefined'?M.centerLng:null),centerLat:(typeof M!=='undefined'?M.centerLat:null),viewZoom:(typeof M!=='undefined'?M.viewZoom:null),
      mapCenter:(()=>{try{const c=(typeof earthlineMap!=='undefined'&&earthlineMap?.getCenter)?earthlineMap.getCenter():null;return c?{lng:c.lng,lat:c.lat}:null}catch(_){return null}})(),
      mapZoom:(()=>{try{return (typeof earthlineMap!=='undefined'&&earthlineMap?.getZoom)?earthlineMap.getZoom():null}catch(_){return null}})(),
      atomic:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),
      input:document.getElementById('searchInput')?.value||''
    }));
    console.log('EARTHLINE_M46_LOC_TRACE '+JSON.stringify({query,delay,...x}));
  }
  await context.close();
}
await browser.close();
