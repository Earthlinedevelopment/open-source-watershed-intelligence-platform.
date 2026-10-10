import { chromium } from 'playwright';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server=spawn('python3',['-m','http.server','8787','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await sleep(500);

const js=fs.readFileSync('earthline-launch-16872.js','utf8');
const marker='/* EARTHLINE_ELDER_TREES_V1_17097';
const at=js.indexOf(marker);
if(at<0)throw new Error('Elder Tree owner block missing');
const block=js.slice(at);
const forbiddenRuntime=[
  ['MutationObserver',/\bnew\s+MutationObserver\s*\(/],
  ['setInterval',/\bsetInterval\s*\(/],
  ['styledata listener',/\.on\s*\(\s*['"]styledata['"]/],
  ['idle listener',/\.on\s*\(\s*['"]idle['"]/],
  ['map render listener',/\.on\s*\(\s*['"]render['"]/]
];
for(const [label,rx] of forbiddenRuntime){
  if(rx.test(block))throw new Error('Forbidden runtime owner in Elder Tree block: '+label);
}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));

await page.goto('http://127.0.0.1:8787/tests/elder-tree-harness-17097.html',{waitUntil:'domcontentloaded',timeout:15000});

await page.evaluate(()=>{
  const sourceStore=new Map(),layerStore=new Map(),handlers={};
  window.earthlineMap={
    getBounds(){return {getWest:()=>-73.23,getSouth:()=>44.45,getEast:()=>-73.17,getNorth:()=>44.51}},
    getStyle(){return {version:8,sources:{},layers:[]}},
    getSource(id){return sourceStore.get(id)||null},
    getLayer(id){return layerStore.get(id)||null},
    addSource(id,def){sourceStore.set(id,{def,data:def.data,setData(data){this.data=data}})},
    addLayer(def){layerStore.set(def.id,def)},
    on(ev,layer,fn){handlers[ev+':'+layer]=fn},
    __sources:sourceStore,__layers:layerStore,__handlers:handlers
  };
  window.mapboxgl={Popup:class{setLngLat(){return this}setHTML(){return this}addTo(){return this}}};
  window.earthlineOpenCorridorDetail16149=function(){document.getElementById('earthlineCorridorDetail16149').classList.add('open');return true};
});
await page.evaluate(code=>(0,eval)(code),block);
await page.waitForFunction(()=>!!window.EARTHLINE_ELDER_TREES_V1_17097,{timeout:5000});
const summary=await page.evaluate(async()=>await window.EARTHLINE_ELDER_TREES_V1_17097.refresh());
await page.waitForTimeout(100);
await page.evaluate(()=>{location.hash='swales-explained';window.dispatchEvent(new HashChangeEvent('hashchange'))});
await page.waitForTimeout(100);

const audit=await page.evaluate(()=>{
  window.earthlineOpenCorridorDetail16149({properties:{},geometry:{type:'LineString',coordinates:[[-73.21,44.47],[-73.20,44.48]]}},0);
  document.getElementById('earthlineRailData16488').click();
  document.getElementById('earthlineVermontReport16149').click();
  return {
    summary:window.EARTHLINE_ELDER_TREES_V1_17097.summary(),
    gauge:String(document.getElementById('earthlineElderTreesGauge17097')?.textContent||''),
    data:String(document.getElementById('earthlineElderTreesData17097')?.textContent||''),
    report:String(document.getElementById('earthlineElderTreesReport17097')?.textContent||''),
    corridor:String(document.getElementById('earthlineElderTreesCorridor17097')?.textContent||''),
    sourceFeatures:window.earthlineMap.__sources.get('earthline-elder-trees-17097')?.data?.features?.length||0,
    layer:!!window.earthlineMap.__layers.get('earthline-elder-tree-points-17097'),
    clickHandler:!!window.earthlineMap.__handlers['click:earthline-elder-tree-points-17097'],
    confidences:window.EARTHLINE_ELDER_TREES_V1_17097.features().map(f=>Number(f.properties?.confidence_pct)).filter(Number.isFinite),
    rechargeWeight:window.EARTHLINE_ELDER_TREES_V1_17097.rechargeWeight,
    howText:String(document.getElementById('earthlineSwalesPage16125')?.querySelector('iframe')?.contentDocument?.getElementById('earthlineElderTreesHow17097')?.textContent||'')
  };
});

console.log('EARTHLINE_ELDER_17097 '+JSON.stringify(audit));
const checks={
  twelve:audit.summary.total===12&&audit.sourceFeatures===12,
  candidateCount:audit.summary.candidates===12,
  gauge:/12 candidates/i.test(audit.gauge),
  data:/12 candidates/i.test(audit.data)&&/not probability of age/i.test(audit.data),
  report:/12 candidates/i.test(audit.report),
  corridor:/12 candidates/i.test(audit.corridor),
  map:audit.layer&&audit.clickHandler,
  confidence:audit.confidences.length===12&&audit.confidences.every(v=>v>=1&&v<=95)&&Math.min(...audit.confidences)<Math.max(...audit.confidences),
  rechargeWeight:audit.rechargeWeight===0,
  how:/Elder Trees and water/i.test(audit.howText)&&/not proof of age/i.test(audit.howText),
  noErrors:errors.length===0
};
console.log('EARTHLINE_ELDER_17097_CHECKS '+JSON.stringify(checks));
await browser.close();
server.kill('SIGTERM');
if(!Object.values(checks).every(Boolean))process.exitCode=1;
