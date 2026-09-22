import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
mkdirSync('artifacts/mantra46-camera-final-ab',{recursive:true});
function patch(body){
  const needle="        if(!propertyOwnsDisplay16726)setRunStatus((focusMode?'Focus screening published. ':(isVermont?'Vermont screening published. ':'Regional screening published. '))+(failures16198.length?'Unavailable context: '+failures16198.join(', ')+'. ':'Watershed and groundwater context updated. ')+swaleNote+(!focusMode?earthlineLandValidityStatus16584():''),'published');";
  const repl="        if(!propertyOwnsDisplay16726&&!focusMode){const cov16792=cameraCoverage(m,b);if(!Number.isFinite(cov16792)||cov16792<.98){const ok16792=await settleRegionalCamera(m,b,runToken);if(ok16792!==true)throw new Error('regional final display camera reconciliation failed');}}\n"+needle;
  const n=body.split(needle).length-1;if(n!==1)throw new Error('context status anchor count '+n);
  return body.replace(needle,repl);
}
const browser=await chromium.launch({headless:true});
for(const query of ['Arkansas','Iowa']){
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 await page.route('**/*',async route=>{const req=route.request();if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){const res=await route.fetch();let body=await res.text();body=patch(body);await route.fulfill({response:res,body});return;}await route.continue();});
 await page.goto(BASE+'?m46_camera_final_ab='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
 await page.waitForFunction(()=>/groundwater context updated|unavailable context/i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:50000,polling:100});
 await page.waitForTimeout(700);
 const x=await page.evaluate(()=>{const c=earthlineMap.getCenter();return {center:{lng:c.lng,lat:c.lat},zoom:earthlineMap.getZoom(),atomic:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556?.regionalExtent||null,root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784?.pass??null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')};});
 console.log('EARTHLINE_M46_CAMERA_FINAL_AB '+JSON.stringify({query,...x}));
 await page.screenshot({path:'artifacts/mantra46-camera-final-ab/'+query.toLowerCase()+'.png'});
 await page.close();
}
await browser.close();
