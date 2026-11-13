import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('artifacts/mantra2-onepress',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1600,height:950}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
const url='https://earthlinedevelopment.org/';
const pt={lat:34.21568,lng:-111.93067};
try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>typeof window.earthlineDeclarePropertyAtCrosshair16173==='function'&&typeof window.earthlineSetPropertyTarget16201==='function',null,{timeout:120000});
 await page.evaluate(p=>{window.earthlineSetPropertyTarget16201({lat:p.lat,lng:p.lng,source:'mantra2-onepress-probe'},{openPanel:false});},pt);
 const before=await page.evaluate(()=>({gen:window.M?.searchGen,runState:document.documentElement.dataset.earthlinePropertyRunState,launch:window.EARTHLINE_PROPERTY_LAUNCH_AUDIT_16322?.slice(-3),audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173,button:document.getElementById('earthlineDeclareProperty16169')?.outerHTML.slice(0,1000)}));
 // Call the user-facing click once. Never press twice to hide a first-press defect.
 await page.evaluate(()=>document.getElementById('earthlineDeclareProperty16169')?.click());
 await page.waitForTimeout(10000);
 const after=await page.evaluate(()=>({gen:window.M?.searchGen,runState:document.documentElement.dataset.earthlinePropertyRunState,launch:window.EARTHLINE_PROPERTY_LAUNCH_AUDIT_16322?.slice(-8),phase:window.EARTHLINE_PROPERTY_PHASE_TRACE_16319?.slice(-12),audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173,publication:window.M?.propertyPublication15816,block:window.M?.propertyPublicationBlock16176,coverage:window.M?.vectorNoBuildCoverage,button:document.getElementById('earthlineDeclareProperty16169')?.outerHTML.slice(0,1000)}));
 const result={url,pt,before,after,errors,started:Number(after.gen)>Number(before.gen)};
 writeFileSync('artifacts/mantra2-onepress/report.json',JSON.stringify(result,null,2));
 console.log('EARTHLINE_ONEPRESS_RESULT '+JSON.stringify({started:result.started,beforeGen:before.gen,afterGen:after.gen,state:after.runState,launch:after.launch,errors}));
 if(!result.started)process.exitCode=1;
}catch(e){const report={error:String(e),errors,pt};writeFileSync('artifacts/mantra2-onepress/report.json',JSON.stringify(report,null,2));console.log('EARTHLINE_ONEPRESS_ERROR '+JSON.stringify(report));process.exitCode=1;}
finally{await browser.close();}
