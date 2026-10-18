import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1400,height:850}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?queueUnit17469='+BROWSER+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});

// State identity is tested without network/geocoder.
await page.locator('#searchInput').fill('Vermont');await page.waitForTimeout(120);
const vt=await page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').evaluateAll(els=>els.map(e=>({q:e.dataset.query||'',text:String(e.textContent||'').replace(/\s+/g,' ').trim()})));
const noFakeVermont=!vt.some(o=>/^Vermont (country|city)$/i.test(o.q)||/Vermont — (Country|City \/ Place)/i.test(o.text));
const hasVermontState=vt.some(o=>o.q==='Vermont'||/Vermont — State \/ Region/i.test(o.text));
await page.locator('#searchInput').fill('Georgia');await page.waitForTimeout(120);
const ga=await page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').evaluateAll(els=>els.map(e=>e.dataset.query||''));
const georgiaCountry=ga.some(q=>/^Georgia country$/i.test(q));

// Controlled repeat-Property lifecycle.
await page.evaluate(()=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const c=m?.getCenter?.()||{lng:-72.27,lat:44.07};
  window.__QUEUE17469_CALLS=[];
  window.earthlineGovernedPropertyRun16202=async function(site,center){
    window.__QUEUE17469_CALLS.push({at:Date.now(),lng:Number(center?.lng??site?.lng),lat:Number(center?.lat??site?.lat)});
    await new Promise(r=>setTimeout(r,700));
    return false;
  };
  window.EARTHLINE_PROPERTY_TARGET_16201={lng:Number(c.lng),lat:Number(c.lat),source:'queue-unit-17469',code:'',score:0,at:new Date().toISOString()};
});
const first=page.locator('#earthlineDeclareProperty16169');
await page.evaluate(()=>window.earthlineSetPropertyTarget16201?.(window.EARTHLINE_PROPERTY_TARGET_16201,{openPanel:false}));
await page.waitForFunction(()=>typeof window.earthlineDeclarePropertyAtCrosshair16173==='function',null,{timeout:5000});
const firstPromise=page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173());
await page.waitForFunction(()=>String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running',null,{timeout:3000,polling:20});
const before=await page.evaluate(()=>({decl:window.EARTHLINE_PROPERTY_DECLARATION_16169,target:window.EARTHLINE_PROPERTY_TARGET_16201,calls:window.__QUEUE17469_CALLS.slice()}));
await page.evaluate(()=>{
  const t=window.EARTHLINE_PROPERTY_TARGET_16201;
  window.EARTHLINE_PROPERTY_TARGET_16201={...t,lng:Number(t.lng)+0.006,lat:Number(t.lat)+0.003,source:'queue-unit-17469-moved',at:new Date().toISOString()};
});
let pressAccepted=false;
try{
  pressAccepted=await page.evaluate(()=>{
    const b=document.getElementById('earthlineDeclareProperty16169');
    const fn=b?.onpointerup;
    if(typeof fn!=='function')return false;
    return fn.call(b,{button:0,type:'pointerup',preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}})!==false;
  });
}catch(_){}
let queued=false;
try{await page.waitForFunction(()=>['queued','launching','started'].includes(String(window.EARTHLINE_PROPERTY_REPEAT_QUEUE_17457?.state||'')),null,{timeout:1500,polling:20});queued=true}catch(_){}
await firstPromise.catch(()=>{});
let secondStarted=false;
try{await page.waitForFunction(()=>Array.isArray(window.__QUEUE17469_CALLS)&&window.__QUEUE17469_CALLS.length>=2,null,{timeout:3500,polling:20});secondStarted=true}catch(_){}
const after=await page.evaluate(()=>({queue:window.EARTHLINE_PROPERTY_REPEAT_QUEUE_17457||null,calls:window.__QUEUE17469_CALLS||[],runState:String(document.documentElement.dataset.earthlinePropertyRunState||''),target:window.EARTHLINE_PROPERTY_TARGET_16201||null}));
const movedMatch=secondStarted&&Math.abs(Number(after.calls[1]?.lng)-Number(after.target?.lng))<1e-6&&Math.abs(Number(after.calls[1]?.lat)-Number(after.target?.lat))<1e-6;
const pass=noFakeVermont&&hasVermontState&&georgiaCountry&&pressAccepted&&queued&&secondStarted&&movedMatch&&!errors.length;
const result={browser:BROWSER,pass,noFakeVermont,hasVermontState,georgiaCountry,vt,ga,pressAccepted,queued,secondStarted,movedMatch,before,after,errors};
mkdirSync('artifacts/interaction-unit-17469',{recursive:true});writeFileSync('artifacts/interaction-unit-17469/'+BROWSER+'.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_INTERACTION_UNIT_17469 '+JSON.stringify(result));
await browser.close();if(!pass)process.exitCode=1;
