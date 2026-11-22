import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:820}});
const logs=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const snapshot=async label=>await page.evaluate(label=>{
const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
const model=(typeof M!=='undefined'&&M)||window.M;
const c=map?.getCenter?.();
return {label,center:c?{lng:c.lng,lat:c.lat}:null,zoom:map?.getZoom?.(),runState:document.documentElement.dataset.earthlineRunState,propertyTier:document.documentElement.dataset.earthlineAnalysisTier,modelCenter:model?{lng:model.centerLng,lat:model.centerLat}:null,target:window.EARTHLINE_PROPERTY_TARGET_16201||null,events:window.__EARTHLINE_CAMERA_TRACE_20261122?.slice(-32)};
},label);
try{
await page.goto('https://earthlinedevelopment.org/?trace=20261122',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>!!((typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap),null,{timeout:45000});
await sleep(5000);
await page.evaluate(()=>{
const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
const out=window.__EARTHLINE_CAMERA_TRACE_20261122=[];
const record=(method,args)=>{
 const c=m.getCenter(),t=window.EARTHLINE_PROPERTY_TARGET_16201;
 out.push({method,at:Date.now(),center:[c.lng,c.lat],args:JSON.stringify(args).slice(0,550),target:t?[t.lng,t.lat,t.source]:null,runState:document.documentElement.dataset.earthlineRunState,stack:(new Error().stack||'').split('\n').slice(2,9).join(' | ').slice(0,1100)});
};
for(const method of ['jumpTo','easeTo','flyTo','fitBounds','setCenter','setZoom','setProjection']){
 const original=m[method];if(typeof original!=='function')continue;
 m[method]=function(...args){record(method,args);return original.apply(this,args)};
}
for(const event of ['movestart','moveend','dragstart','dragend','idle'])m.on(event,()=>{
 const c=m.getCenter();out.push({method:'event:'+event,at:Date.now(),center:[c.lng,c.lat],runState:document.documentElement.dataset.earthlineRunState});
});
});
logs.push(await snapshot('before-search'));
await page.evaluate(()=>{const el=document.getElementById('searchInput'),btn=document.getElementById('runBtn');el.value='NEW YORK state';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));btn.click()});
await sleep(17000);
logs.push(await snapshot('after-regional-17s'));
await page.evaluate(()=>{const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;m.jumpTo({center:[-75.76996,42.78781],zoom:17})});
await sleep(800);
const canvas=page.locator('.mapboxgl-canvas').first();const box=await canvas.boundingBox();
const x=box.x+box.width*.7,y=box.y+box.height*.65;
await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+3,y+2,{steps:4});await page.mouse.up();
logs.push(await snapshot('right-after-real-drag'));
await sleep(15000);
logs.push(await snapshot('after-15s-post-drag'));
const calls=await page.evaluate(()=>window.__EARTHLINE_CAMERA_TRACE_20261122||[]);
console.log('EARTHLINE_CAMERA_OWNER_TRACE '+JSON.stringify({snapshots:logs,calls}).slice(0,70000));
mkdirSync('camera-owner-results',{recursive:true});
writeFileSync('camera-owner-results/trace.json',JSON.stringify({snapshots:logs,calls},null,2));
await page.screenshot({path:'camera-owner-results/final.png'});
}finally{await browser.close()}
