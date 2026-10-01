import { chromium } from 'playwright';
const BASE='http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto(BASE+'?m51-ak-interaction='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Alaska');
await page.locator('#runBtn').click();
await page.waitForFunction(()=>String((window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||{}).profileId||'')==='us-ak',{timeout:60000,polling:100});
await page.waitForTimeout(2500);

const diag=await page.evaluate(()=>{
  const base=document.getElementById('mapboxBase');
  const canvas=base?.querySelector('canvas.mapboxgl-canvas')||base?.querySelector('canvas');
  const overlay=document.getElementById('map');
  const r=canvas?.getBoundingClientRect();
  const x=r?r.left+r.width/2:innerWidth/2,y=r?r.top+r.height/2:innerHeight/2;
  const stack=document.elementsFromPoint(x,y).slice(0,12).map(el=>({tag:el.tagName,id:el.id||'',cls:String(el.className||''),pe:getComputedStyle(el).pointerEvents,z:getComputedStyle(el).zIndex}));
  return {
    base:{pe:base?getComputedStyle(base).pointerEvents:null,z:base?getComputedStyle(base).zIndex:null},
    canvas:{pe:canvas?getComputedStyle(canvas).pointerEvents:null,z:canvas?getComputedStyle(canvas).zIndex:null,rect:r?{x:r.x,y:r.y,w:r.width,h:r.height}:null},
    overlay:{pe:overlay?getComputedStyle(overlay).pointerEvents:null,z:overlay?getComputedStyle(overlay).zIndex:null},
    stack,
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null
  };
});
console.log('AK_INTERACTION_DIAG '+JSON.stringify(diag));

const canvas=page.locator('#mapboxBase canvas.mapboxgl-canvas').first();
const box=await canvas.boundingBox();
if(!box)throw new Error('Alaska Mapbox canvas unavailable');
const before=await page.evaluate(()=>{const m=window.earthlineMap||null;const c=m?.getCenter?.();return {center:c?[c.lng,c.lat]:null,target:window.EARTHLINE_PROPERTY_TARGET_16201||null};});
await page.mouse.move(box.x+box.width*0.55,box.y+box.height*0.55);
await page.mouse.down();
await page.mouse.move(box.x+box.width*0.35,box.y+box.height*0.48,{steps:12});
await page.mouse.up();
await page.waitForTimeout(1800);
const after=await page.evaluate(()=>{const m=window.earthlineMap||null;const c=m?.getCenter?.();return {center:c?[c.lng,c.lat]:null,target:window.EARTHLINE_PROPERTY_TARGET_16201||null};});
console.log('AK_DRAG '+JSON.stringify({before,after}));
const moved=before.center&&after.center?Math.hypot(after.center[0]-before.center[0],after.center[1]-before.center[1]):0;
if(diag.canvas.pe==='none')throw new Error('actual Mapbox canvas has pointer-events none');
if(!moved||moved<0.01)throw new Error('Alaska map did not respond to real drag');
await browser.close();
