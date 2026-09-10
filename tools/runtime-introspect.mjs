import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()});});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForTimeout(1800);

const report=await page.evaluate(()=>{
  const names=Object.getOwnPropertyNames(window);
  const needles=['fitBounds','easeTo','flyTo','jumpTo','setCenter','setZoom','earthlineSearchCameraLock','earthlineSetMapView','regional','camera','publication','publish'];
  const hits=[];
  for(const key of names){
    let fn; try{fn=window[key];}catch(_){continue;}
    if(typeof fn!=='function')continue;
    let src='';try{src=Function.prototype.toString.call(fn);}catch(_){continue;}
    const low=src.toLowerCase();
    if(!needles.some(n=>low.includes(n.toLowerCase())))continue;
    if(/^function\s+(?:WebGL|HTML|SVG|CSS|XR|RTCRtp|GPU|Audio|Video|Media|Performance|Navigation|Location|Selection)/.test(src))continue;
    hits.push({key,arity:fn.length,src:src.slice(0,12000)});
  }
  const direct={};
  for(const key of ['earthlineSetMapView','earthlineApplySearchCameraLock','earthlineCancelSearchCameraLock','earthlinePlanningMode','earthlineLargeAreaMode','earthlineHasRegionalBBox']){
    try{if(typeof window[key]==='function')direct[key]=Function.prototype.toString.call(window[key]);}catch(_){}
  }
  const eventGlobals={};
  for(const key of names.filter(k=>/regional|camera|publish|screen|search/i.test(k))){
    try{const v=window[key];if(v==null||['string','number','boolean'].includes(typeof v))eventGlobals[key]=v;else if(typeof v==='object'&&!Array.isArray(v)){const o={};for(const k of Object.keys(v).slice(0,80)){const x=v[k];if(x==null||['string','number','boolean'].includes(typeof x))o[k]=x;}eventGlobals[key]=o;}}catch(_){}
  }
  return {hits,direct,eventGlobals};
});

const input=page.locator('#searchInput');
await input.fill('Alabama');
await input.dispatchEvent('input');
await page.waitForTimeout(900);
const option=page.locator('#earthlineSearchSuggestions15970 [role="option"][data-query="Alabama state"]').first();
let selected=false;
try{await option.click({timeout:5000});selected=true;}catch(e){report.selectionError=String(e);}
if(selected){
  try{await page.waitForFunction(()=>document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true',null,{timeout:40000,polling:200});}catch(_){report.settleTimeout=true;}
  await page.waitForTimeout(400);
}
report.selected=selected;
report.after=await page.evaluate(()=>{
  const m=(typeof M!=='undefined'&&M)||window.M||null;
  const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;
  const r=window.earthlineRegional15778||{};
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
  const globals={};
  for(const key of Object.getOwnPropertyNames(window).filter(k=>/regional|camera|publish|screen|search/i.test(k))){
    try{const v=window[key];if(v==null||['string','number','boolean'].includes(typeof v))globals[key]=v;else if(typeof v==='object'&&!Array.isArray(v)){const o={};for(const k of Object.keys(v).slice(0,100)){const x=v[k];if(x==null||['string','number','boolean'].includes(typeof x))o[k]=x;}globals[key]=o;}}catch(_){}
  }
  return {
    loc:m?.loc?JSON.parse(JSON.stringify(m.loc)):null,
    center:{Mlat:Number(m&&m.centerLat),Mlng:Number(m&&m.centerLng),mapCenter:map?.getCenter?{lat:map.getCenter().lat,lng:map.getCenter().lng}:null,zoom:map?.getZoom?map.getZoom():null},
    regional:r,displayed:d,camera16602:window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1200),
    globals
  };
});
report.errors=errors.slice(0,50);
await fs.mkdir('runtime-results',{recursive:true});
await fs.writeFile('runtime-results/earthline-runtime-introspect.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_CAMERA_OWNER '+JSON.stringify({selected:report.selected,after:report.after,hits:report.hits.map(h=>h.key),direct:Object.keys(report.direct)}));
await browser.close();
