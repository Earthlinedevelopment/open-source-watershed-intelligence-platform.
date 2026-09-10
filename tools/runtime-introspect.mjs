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
  const keys=[
    'applyLocation','runSearch','earthlineRunAnalysis','drawRegionalPriority','earthlineMoveMapToLoc15778',
    'earthlineSetMapView','earthlineFinishMapMotion','earthlineSyncLayers15778','earthlineRunFrameDirective15827',
    'earthlineRegionalSupportAudit15778','earthlineRecordTerrainHandoff15791','earthlineDirectGeocode15778'
  ];
  const source={};
  for(const key of keys){
    try{const fn=window[key]||(typeof globalThis[key]==='function'?globalThis[key]:null);if(typeof fn==='function')source[key]=Function.prototype.toString.call(fn);}catch(_){}
  }
  return {camera16602:window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602||null,keys:Object.keys(source),source};
});
await fs.mkdir('runtime-results',{recursive:true});
await fs.writeFile('runtime-results/earthline-runtime-introspect.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_RUNTIME_OWNER_SOURCES '+JSON.stringify({camera16602:report.camera16602,keys:report.keys}));
for(const [k,v] of Object.entries(report.source)) console.log(`EARTHLINE_SOURCE ${k}\n${v}\nEND_EARTHLINE_SOURCE ${k}`);
await browser.close();
