import { chromium } from 'playwright';
const BASE='http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto(BASE+'?m51-ak-interaction='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='Alaska';
  i.dispatchEvent(new Event('input',{bubbles:true}));
  i.dispatchEvent(new Event('change',{bubbles:true}));
  b.click();
});
await page.waitForFunction(()=>String((window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||{}).profileId||'')==='us-ak',{timeout:60000,polling:100});
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const running=document.documentElement.classList.contains('earthline-regional-running-16233')||document.documentElement.dataset.earthlineRunState==='running';
  const q=String(d?.query||d?.name||'').toLowerCase();
  return !running&&q.includes('alaska');
},{timeout:100000,polling:150});
await page.waitForTimeout(1000);

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
const before=await page.evaluate(()=>({target:window.EARTHLINE_PROPERTY_TARGET_16201||null}));
await page.mouse.move(box.x+box.width*0.55,box.y+box.height*0.55);
await page.mouse.down();
await page.mouse.move(box.x+box.width*0.35,box.y+box.height*0.48,{steps:12});
await page.mouse.up();
await page.waitForTimeout(1800);
const after=await page.evaluate(()=>({target:window.EARTHLINE_PROPERTY_TARGET_16201||null}));
console.log('AK_DRAG '+JSON.stringify({before,after}));
const moved=(before.target&&after.target)?Math.hypot(Number(after.target.lng)-Number(before.target.lng),Number(after.target.lat)-Number(before.target.lat)):0;
if(diag.canvas.pe==='none')throw new Error('actual Mapbox canvas has pointer-events none');
if(!moved||moved<0.01)throw new Error('Alaska published map did not move crosshair after real drag');
await browser.close();

// trigger Alaska interaction diagnostic

// rerun after Alaska hit-path repair

// rerun after drag target handoff repair
