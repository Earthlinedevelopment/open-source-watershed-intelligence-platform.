import { chromium } from 'playwright';
const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080}});
await page.goto(BASE+'?m46_camera_trace='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForFunction(()=>typeof earthlineMap!=='undefined'&&!!earthlineMap&&!!earthlineMap.getCenter,{timeout:30000});
await page.evaluate(()=>{
  window.EARTHLINE_CAMERA_CALLS_M46=[];
  const m=earthlineMap;
  for(const name of ['jumpTo','easeTo','fitBounds','setCenter','setZoom']){
    const orig=m[name]&&m[name].bind(m); if(!orig)continue;
    m[name]=function(...args){
      let stack='';try{stack=(new Error()).stack||''}catch(_){}
      let before=null;try{const c=m.getCenter();before={lng:c.lng,lat:c.lat,zoom:m.getZoom()}}catch(_){}
      window.EARTHLINE_CAMERA_CALLS_M46.push({name,args,before,at:performance.now(),stack:stack.split('\n').slice(0,8)});
      return orig(...args);
    };
  }
});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Arkansas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:45000,polling:100});
await page.waitForTimeout(3500);
const out=await page.evaluate(()=>{
 const c=earthlineMap.getCenter();
 return {center:{lng:c.lng,lat:c.lat,zoom:earthlineMap.getZoom()},calls:window.EARTHLINE_CAMERA_CALLS_M46||[],atomic:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,Mloc:(typeof M!=='undefined'?M.loc:null),centerLng:(typeof M!=='undefined'?M.centerLng:null),centerLat:(typeof M!=='undefined'?M.centerLat:null)};
});
console.log('EARTHLINE_M46_CAMERA_TRACE '+JSON.stringify(out));
await browser.close();
