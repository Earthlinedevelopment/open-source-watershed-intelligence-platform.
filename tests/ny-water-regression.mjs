import { chromium } from 'playwright';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/lab.html';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
const host=await page.waitForSelector('#earthline-lab-frame',{timeout:20000});
const frame=await host.contentFrame();if(!frame)throw new Error('lab iframe unavailable');
await frame.waitForSelector('#searchInput',{timeout:30000});
await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
const d=await frame.evaluate(()=>{
 const names=['earthlineCrosshairMappedOpenWater16529','earthlineMappedFeatureClass15862J','earthlineProcessMappedFeature','earthlineFeatureBBox15862J','earthlineWaterPolygonContainsPoint16529'];
 const out={};for(const n of names){try{out[n]=typeof window[n]==='function'?String(window[n]).slice(0,12000):null}catch(e){out[n]='ERR '+String(e)}}return out;
});
console.log('EARTHLINE_WATER_API '+JSON.stringify(d));
await browser.close();process.exitCode=1;
