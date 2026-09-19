import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
let patch=0;
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch();let body=await resp.text();
 const old="const contours=earthlineClipFeatureCollection16539(payload.contours,g),flows=earthlineClipFeatureCollection16539(payload.flows,g),swales=earthlineRerankRegionalSwales16539(earthlineClipFeatureCollection16539(payload.swales,g));\n    const after={contours:contours.features.length,flows:flows.features.length,swales:swales.features.length};\n    const outsideAfterClip={contours:earthlineOutsideCoordinateCount16539(contours,g),flows:earthlineOutsideCoordinateCount16539(flows,g),swales:earthlineOutsideCoordinateCount16539(swales,g)};";
 const neu="window.EARTHLINE_TX_CLIP_SUBPHASE_16634={};let t16634=performance.now();const contours=earthlineClipFeatureCollection16539(payload.contours,g);window.EARTHLINE_TX_CLIP_SUBPHASE_16634.contoursMs=Math.round(performance.now()-t16634);t16634=performance.now();const flows=earthlineClipFeatureCollection16539(payload.flows,g);window.EARTHLINE_TX_CLIP_SUBPHASE_16634.flowsMs=Math.round(performance.now()-t16634);t16634=performance.now();const swales=earthlineRerankRegionalSwales16539(earthlineClipFeatureCollection16539(payload.swales,g));window.EARTHLINE_TX_CLIP_SUBPHASE_16634.swalesMs=Math.round(performance.now()-t16634);\n    const after={contours:contours.features.length,flows:flows.features.length,swales:swales.features.length};\n    t16634=performance.now();const outsideAfterClip={contours:earthlineOutsideCoordinateCount16539(contours,g),flows:earthlineOutsideCoordinateCount16539(flows,g),swales:earthlineOutsideCoordinateCount16539(swales,g)};window.EARTHLINE_TX_CLIP_SUBPHASE_16634.verifyMs=Math.round(performance.now()-t16634);";
 patch=body.split(old).length-1;body=body.split(old).join(neu);
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_clip_subphase='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
for(let repeat=1;repeat<=3;repeat++){
 const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));const started=Date.now();
 await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:30000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(350);
 const state=await page.evaluate(()=>({clip:window.EARTHLINE_TX_CLIP_SUBPHASE_16634||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
 console.log('EARTHLINE_TX_CLIP_SUBPHASE '+JSON.stringify({repeat,patch,elapsedMs:Date.now()-started,timedOut,state}));
}
await browser.close();
