import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForTimeout(1200);

const report=await page.evaluate(()=>{
  const source={};
  for(const key of ['earthlineProcessMappedFeature','earthlineMappedFeatureClass15862J','earthlineDilateMask','earthlineGridToLngLat','lngLatToGrid','earthlineBuildVectorNoBuildMask']){
    try{const fn=window[key]||(typeof globalThis[key]==='function'?globalThis[key]:null);if(typeof fn==='function')source[key]=Function.prototype.toString.call(fn);}catch(_){}
  }
  const constants={};
  for(const expr of ['N','GW','GH']){
    try{constants[expr]=eval(expr);}catch(e){constants[expr]='unavailable';}
  }
  return {source,constants};
});
await fs.mkdir('runtime-results',{recursive:true});
await fs.writeFile('runtime-results/earthline-runtime-introspect.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_WATER_RASTERIZER '+JSON.stringify({keys:Object.keys(report.source),constants:report.constants}));
await browser.close();
