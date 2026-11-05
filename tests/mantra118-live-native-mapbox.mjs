import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const origin='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const results=[];
async function checkMap(page,kind){
  await page.goto(origin+'?m118_native='+kind+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:70000});
  await page.waitForFunction(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    return !!(m&&m.getCanvas?.()&&m.getCenter?.());
  },null,{timeout:60000,polling:300});
  const result=await page.evaluate(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    return {
      center:m.getCenter().toArray(),zoom:m.getZoom(),
      gestures:Object.fromEntries(['dragPan','scrollZoom','doubleClickZoom','touchZoomRotate','boxZoom'].map(k=>[k,!!m[k]?.isEnabled?.()])),
      zoomButtons:document.querySelectorAll('.mapboxgl-ctrl-zoom-in,.mapboxgl-ctrl-zoom-out').length,
      mapboxCanvas:m.getCanvas().getBoundingClientRect().toJSON(),
      mapLoaded:m.loaded?.(),navigationAudit:window.earthlineNavigationAudit15784?.()||null
    };
  });
  for(const [name,on] of Object.entries(result.gestures)) assert.ok(on,kind+' '+name+' disabled');
  assert.ok(result.zoomButtons>=2,kind+' no native zoom buttons');
  results.push({kind,...result});
  return result;
}
try {
  const desktop=await browser.newPage({viewport:{width:1440,height:900}});
  const initial=await checkMap(desktop,'desktop');
  const b=initial.mapboxCanvas;
  assert.ok(b.width>300&&b.height>300,'Map canvas too small');
  const x=b.x+b.width*.6,y=b.y+b.height*.6;
  await desktop.mouse.move(x,y);
  await desktop.mouse.down();
  await desktop.mouse.move(x+120,y+75,{steps:16});
  await desktop.mouse.up();
  await desktop.waitForTimeout(700);
  const afterDrag=await desktop.evaluate(()=>((window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)).getCenter().toArray()));
  const moved=Math.hypot(afterDrag[0]-initial.center[0],afterDrag[1]-initial.center[1]);
  assert.ok(moved>1e-5,'Pointer drag did not pan map');
  await desktop.mouse.wheel(0,-560);
  await desktop.waitForTimeout(1200);
  const afterWheel=await desktop.evaluate(()=>((window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)).getZoom()));
  assert.ok(afterWheel>initial.zoom+.01,'Mouse wheel did not zoom map');
  results.push({kind:'desktop-behavior',moved,afterDrag,afterWheel});
  await desktop.close();

  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const mobile=await context.newPage();
  mobile.on('pageerror',e=>console.error('M118_MOBILE_PAGE_ERROR',String(e)));
  mobile.on('console',m=>{if(m.type()==='error')console.error('M118_MOBILE_CONSOLE',m.text().slice(0,350))});
  const mm=await checkMap(mobile,'mobile');
  assert.ok(mm.mapboxCanvas.width>200,'Mobile map not usable');
  const cdp=await context.newCDPSession(mobile);
  const mx=mm.mapboxCanvas.x+mm.mapboxCanvas.width*.55;
  const my=mm.mapboxCanvas.y+mm.mapboxCanvas.height*.55;
  const p=(x,y,id)=>({x:Math.round(x),y:Math.round(y),id});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p(mx-30,my,1),p(mx+30,my,2)]});
  for(let step=1;step<=6;step++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[p(mx-30-step*14,my,1),p(mx+30+step*14,my,2)]});
    await mobile.waitForTimeout(45);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await mobile.waitForTimeout(700);
  const afterPinch=await mobile.evaluate(()=>((window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)).getZoom()));
  assert.ok(afterPinch>mm.zoom+.01,'Mobile pinch did not zoom map');
  results.push({kind:'mobile-behavior',afterPinch,initialZoom:mm.zoom});
  await context.close();
  console.log('M118_NATIVE_MAPBOX_LIVE_PASS',JSON.stringify(results));
}catch(err){
  console.error('M118_NATIVE_MAPBOX_LIVE_FAIL',String(err?.stack||err),JSON.stringify(results));
  process.exitCode=1;
}finally{await browser.close();}
