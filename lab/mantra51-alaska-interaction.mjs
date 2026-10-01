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

await page.evaluate(()=>{
  window.__M51_AK_INPUT={pointerdown:0,mousedown:0,pointermove:0,mousemove:0,pointerup:0,mouseup:0,dragstart:0,drag:0,dragend:0};
  const canvas=document.querySelector('#mapboxBase canvas.mapboxgl-canvas');
  for(const ev of ['pointerdown','mousedown','pointermove','mousemove','pointerup','mouseup']){
    canvas?.addEventListener(ev,()=>{window.__M51_AK_INPUT[ev]++},true);
  }
  if(typeof earthlineMap!=='undefined'&&earthlineMap?.on){
    for(const ev of ['dragstart','drag','dragend'])earthlineMap.on(ev,()=>{window.__M51_AK_INPUT[ev]++});
  }
});
const mapStateBefore=await page.evaluate(()=>({
  center:(typeof earthlineMap!=='undefined'&&earthlineMap?.getCenter)?earthlineMap.getCenter().toArray():null,
  zoom:(typeof earthlineMap!=='undefined'&&earthlineMap?.getZoom)?earthlineMap.getZoom():null,
  dragPan:(typeof earthlineMap!=='undefined'&&earthlineMap?.dragPan?.isEnabled)?earthlineMap.dragPan.isEnabled():null,
  scrollZoom:(typeof earthlineMap!=='undefined'&&earthlineMap?.scrollZoom?.isEnabled)?earthlineMap.scrollZoom.isEnabled():null,
  moving:(typeof earthlineMap!=='undefined'&&earthlineMap?.isMoving)?earthlineMap.isMoving():null
}));
console.log('AK_MAP_STATE_BEFORE '+JSON.stringify(mapStateBefore));

const before=await page.evaluate(()=>({
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  site:typeof window.earthlineCurrentMapSite15778==='function'?window.earthlineCurrentMapSite15778():null,
  context:window.EARTHLINE_REGIONAL_CONTEXT_16198||null
}));
await page.mouse.move(box.x+box.width*0.55,box.y+box.height*0.55);
await page.mouse.down();
await page.mouse.move(box.x+box.width*0.35,box.y+box.height*0.48,{steps:12});
await page.mouse.up();
await page.waitForTimeout(1800);
const after=await page.evaluate(()=>({
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  site:typeof window.earthlineCurrentMapSite15778==='function'?window.earthlineCurrentMapSite15778():null,
  context:window.EARTHLINE_REGIONAL_CONTEXT_16198||null
}));
console.log('AK_DRAG '+JSON.stringify({before,after}));
const cameraMoved=(before.site&&after.site)?Math.hypot(Number(after.site.lng)-Number(before.site.lng),Number(after.site.lat)-Number(before.site.lat)):0;
const targetMoved=(before.target&&after.target)?Math.hypot(Number(after.target.lng)-Number(before.target.lng),Number(after.target.lat)-Number(before.target.lat)):0;
const realAfter=await page.evaluate(()=>({
  center:(typeof earthlineMap!=='undefined'&&earthlineMap?.getCenter)?earthlineMap.getCenter().toArray():null,
  input:window.__M51_AK_INPUT||null
}));
const realCenterAfter=realAfter.center;
console.log('AK_INPUT_EVENTS '+JSON.stringify(realAfter.input));
console.log('AK_MOVEMENT '+JSON.stringify({cameraMoved,targetMoved,realCenterAfter}));
const prog=await page.evaluate(async()=>{
  if(typeof earthlineMap==='undefined'||!earthlineMap?.panBy)return null;
  const before=earthlineMap.getCenter().toArray();
  earthlineMap.stop?.();
  earthlineMap.panBy([240,0],{duration:0});
  await new Promise(r=>setTimeout(r,500));
  return {before,after:earthlineMap.getCenter().toArray(),dragPan:earthlineMap.dragPan?.isEnabled?.(),moving:earthlineMap.isMoving?.()};
});
console.log('AK_PROGRAMMATIC_PAN '+JSON.stringify(prog));
const progMoved=prog?Math.hypot(Number(prog.after[0])-Number(prog.before[0]),Number(prog.after[1])-Number(prog.before[1])):0;
if(diag.canvas.pe==='none')throw new Error('actual Mapbox canvas has pointer-events none');
if(!cameraMoved||cameraMoved<0.01){
  if(progMoved>0.01)throw new Error('Alaska native camera can pan, but real pointer drag is not reaching dragPan');
  throw new Error('Alaska camera is constrained even for native panBy');
}
if(!targetMoved||targetMoved<0.01)throw new Error('Alaska camera moved but crosshair target did not follow');
await browser.close();

// trigger Alaska interaction diagnostic

// rerun after Alaska hit-path repair

// rerun after drag target handoff repair

// rerun after Alaska label pointer repair
