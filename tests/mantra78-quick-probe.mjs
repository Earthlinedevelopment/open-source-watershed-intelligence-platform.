import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'node:fs';
const c={lat:34.21607,lng:-111.93178};
mkdirSync('artifacts/mantra78-quick-probe',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome'});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
const started=Date.now();let error=null,timeout=false;
try{
 await page.goto('https://earthlinedevelopment.org/?m78_quick='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.waitForFunction(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);return !!(m&&typeof m.jumpTo==='function'&&typeof window.earthlineSyncPropertyTargetFromMap16201==='function'&&document.getElementById('runBtn'));},{timeout:30000});
 await page.evaluate(({lng,lat})=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[lng,lat],zoom:18,bearing:0,pitch:0});const i=document.getElementById('searchInput');if(i){i.value='';i.dispatchEvent(new Event('input',{bubbles:true}));}},c);
 await page.waitForTimeout(900);
 const prep=await page.evaluate(()=>({sync:window.earthlineSyncPropertyTargetFromMap16201(),target:window.EARTHLINE_PROPERTY_TARGET_16201||null,zoom:(window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)).getZoom(),center:(window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)).getCenter()}));
 console.log('M78_QUICK_PREP '+JSON.stringify(prep));
 await page.evaluate(()=>document.getElementById('runBtn')?.click());
 try{await page.waitForFunction(()=>{const r=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return !!(r&&r.settled===true)||!!window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176;},{timeout:70000,polling:100});}catch(_){timeout=true;}
}catch(e){error=String(e&&e.stack||e);}
const snap=await page.evaluate(()=>{const m=(typeof M!=='undefined'&&M)||window.M||{};const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;return {
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null,displayed:d,run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,pub:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
 publication:m.propertyPublication15816||null,water:m.authoritativeWaterPublication15824||null,swales:m.authoritativeSafeSwales15815?.features?.length||0,
 waterCount:m.authoritativeWaterPaths15824?.features?.length||0,elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
 aquiferStatus:m.usgsAquiferStatus||null,aquiferCount:Array.isArray(m.usgsAquifers)?m.usgsAquifers.length:(m.usgsAquifers?.features?.length||0),
 propertyState:document.documentElement.dataset.earthlinePropertyRunState||'',tier:document.documentElement.dataset.earthlineAnalysisTier||'',
 runState:document.documentElement.dataset.earthlineRunState||'',classes:document.documentElement.className,
 ledger:(window.EARTHLINE_RUN_LEDGER_16147||[]).slice(-30)
};});
const out={elapsedMs:Date.now()-started,error,timeout,errs,snap};
console.log('EARTHLINE_M78_QUICK '+JSON.stringify(out));
writeFileSync('artifacts/mantra78-quick-probe/result.json',JSON.stringify(out,null,2));
await browser.close();
if(error||timeout||errs.length||snap.run?.result!==true||snap.pub?.published!==true)process.exitCode=1;
