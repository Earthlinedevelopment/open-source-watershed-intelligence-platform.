import{chromium}from'playwright';import{installCandidateOrigin}from'./candidate-origin-router.mjs';
const b=await chromium.launch({headless:true});
for(const tc of [{n:'phone',w:390,h:844,m:1},{n:'landscape',w:844,h:390,m:1},{n:'desktop',w:1440,h:900,m:0}]){
 const c=await b.newContext({viewport:{width:tc.w,height:tc.h},isMobile:!!tc.m,hasTouch:!!tc.m});await installCandidateOrigin(c);const p=await c.newPage();
 await p.goto('https://earthlinedevelopment.org/?m81mp='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});await p.waitForSelector('#searchInput');
 await p.locator('#searchInput').fill('Vermont');await p.waitForTimeout(700);const o=p.locator('#earthlineSearchSuggestions15970 [role=option]').filter({hasText:/Vermont/i}).first();if(await o.count())await o.click().catch(()=>{});
 await p.locator('#runBtn').click();await p.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000});
 const prep=await p.evaluate(async()=>{const t={lng:-73.012909,lat:44.513845},s=window.earthlineSelectedSiteFromCenter(M?.loc||null,t.lng,t.lat,20);if(!await window.applyLocation(s,null,M.searchGen,{analyzeNow:false,preserveMapView:false}))return false;await new Promise(r=>setTimeout(r,500));return !!window.earthlineSetPropertyTarget16201({...t,source:'m81diag'},{openPanel:false})});
 let err=null,t=Date.now();if(prep)try{await p.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16169())}catch(e){err=String(e)}
 const out=await p.evaluate(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},v=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{},x=M?.authoritativeSafeSwales15815;return{a:{settled:a.settled,result:a.result,corridors:a.corridors,renderVerified:a.renderVerified},v,safety:M?.safetyAudit15806||null,lock:M?.propertyResultLock15815||null,x:{array:Array.isArray(x),length:Number(x?.length||0),features:Number(x?.features?.length||0),keys:x&&typeof x==='object'?Object.keys(x).slice(0,12):[]}}});
 console.log('M81_MOBILE_PROP '+JSON.stringify({case:tc.n,prep,err,ms:Date.now()-t,out}));await c.close();
}await b.close();