import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/lab.html';
const SEED={lng:-73.6078954739776,lat:43.5736782555177};
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
const host=await page.waitForSelector('#earthline-lab-frame',{timeout:20000});
const frame=await host.contentFrame();
if(!frame)throw new Error('lab iframe unavailable');
await frame.waitForSelector('#searchInput',{timeout:30000});
await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
const diagnostic=await frame.evaluate(async seed=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);if(!mp)throw new Error('map unavailable');
  mp.stop();mp.jumpTo({center:[seed.lng,seed.lat],zoom:14});
  await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;resolve()};try{mp.once('idle',finish)}catch(_){ }setTimeout(finish,5000)});
  const style=mp.getStyle()||{};
  const layers=(style.layers||[]).map(l=>({id:l.id,type:l.type,source:l.source||null,sourceLayer:l['source-layer']||null}));
  const sources=Object.entries(style.sources||{}).map(([id,s])=>({id,type:s?.type||null,url:s?.url||null,tiles:Array.isArray(s?.tiles)?s.tiles.slice(0,2):null}));
  const c=mp.project([seed.lng,seed.lat]);
  const center=(mp.queryRenderedFeatures([c.x,c.y])||[]).slice(0,80).map(f=>({layer:f?.layer?.id||null,source:f?.source||null,sourceLayer:f?.sourceLayer||f?.layer?.['source-layer']||null,geometry:f?.geometry?.type||null,properties:f?.properties||{}}));
  const box=(mp.queryRenderedFeatures([[c.x-100,c.y-100],[c.x+100,c.y+100]])||[]).slice(0,200).map(f=>({layer:f?.layer?.id||null,source:f?.source||null,sourceLayer:f?.sourceLayer||f?.layer?.['source-layer']||null,geometry:f?.geometry?.type||null,properties:f?.properties||{}}));
  return {center:{lng:mp.getCenter().lng,lat:mp.getCenter().lat,zoom:mp.getZoom()},layers,sources,centerFeatures:center,boxFeatures:box};
},SEED);
console.log('EARTHLINE_MAP_WATER_DIAGNOSTIC '+JSON.stringify(diagnostic));
await browser.close();
process.exitCode=1;
