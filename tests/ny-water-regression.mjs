import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/lab.html';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
const host=await page.waitForSelector('#earthline-lab-frame',{timeout:20000});
const frame=await host.contentFrame();
if(!frame)throw new Error('lab iframe unavailable');
await frame.waitForSelector('#searchInput',{timeout:30000});
await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
const diagnostic=await frame.evaluate(()=>{
  const names=['earthlineSetTarget','earthlineSetPropertyTarget16201','earthlineSyncPropertyTargetFromMap16201','earthlineAnalyzeThisLocation16158','earthlineDeclarePropertyAtCrosshair16169','earthlineDeclarePropertyAtCrosshair16173','earthlineCurrentAnalysisCenter','earthlineSelectedSiteFromCenter','applyLocation','earthlineJurisdictionProfile16549'];
  const sources={};for(const n of names){try{sources[n]=typeof window[n]==='function'?String(window[n]).slice(0,7000):null}catch(e){sources[n]='ERR '+String(e)}}
  return {sources,state:{loc:M?.loc||null,center:{lng:M?.centerLng,lat:M?.centerLat},jurisdiction:M?.propertyJurisdiction16516||null,ready:document.documentElement.classList.contains('earthline-property-ready-16188'),button:!!document.getElementById('earthlineDeclareProperty16169'),disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,mapCenter:(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);const c=m.getCenter();return {lng:c.lng,lat:c.lat,zoom:m.getZoom()}}catch(_){return null}})()}};
});
console.log('EARTHLINE_PROPERTY_API_DIAGNOSTIC '+JSON.stringify(diagnostic));
await browser.close();
process.exitCode=1;
