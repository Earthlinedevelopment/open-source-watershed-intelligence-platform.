import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
mkdirSync('artifacts/mantra46-16792-state-center-ab',{recursive:true});
function patch(body){
  const old=`      if(s){
        s.loc=loc16556;
        s.appliedSearchText=profile16549.query;
        s.jurisdictionPackage16556=package16556;
      }`;
  const repl=`      if(s){
        s.loc=loc16556;
        s.centerLng=Number(loc16556.lng);
        s.centerLat=Number(loc16556.lat);
        s.viewZoom=Number(loc16556.zoomHint||s.viewZoom||5.7);
        s.appliedSearchText=profile16549.query;
        s.jurisdictionPackage16556=package16556;
      }`;
  const n=body.split(old).length-1;if(n!==1)throw new Error('atomic state commit anchor count '+n);
  return body.replace(old,repl);
}
const browser=await chromium.launch({headless:true});
for(const query of ['Arkansas','Iowa']){
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*',async route=>{const req=route.request();if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){const res=await route.fetch();let body=await res.text();body=patch(body);await route.fulfill({response:res,body});return;}await route.continue();});
 await page.goto(BASE+'?m46_16792_state_center='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
 await page.waitForFunction(()=>/groundwater context updated|unavailable context/i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:50000,polling:100});
 await page.waitForTimeout(1000);
 const x=await page.evaluate(()=>{const c=earthlineMap.getCenter(),a=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556;return {Mloc:M.loc,Mcenter:{lng:M.centerLng,lat:M.centerLat,zoom:M.viewZoom},mapCenter:{lng:c.lng,lat:c.lat,zoom:earthlineMap.getZoom()},atomicCenter:a?.center||null,atomicExtent:a?.regionalExtent||null,target:window.EARTHLINE_PROPERTY_TARGET_16201||null,rootPass:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784?.pass??null,generated:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated??null};});
 console.log('EARTHLINE_M46_16792_STATE_CENTER '+JSON.stringify({query,...x,errors}));
 await page.screenshot({path:'artifacts/mantra46-16792-state-center-ab/'+query.toLowerCase()+'.png'});
 await page.close();
}
await browser.close();
