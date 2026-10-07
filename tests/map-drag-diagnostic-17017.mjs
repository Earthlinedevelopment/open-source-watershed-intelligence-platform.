import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/?dragdiag='+Date.now();
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForTimeout(2500);
async function snap(label){
  const out=await page.evaluate(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const c=m?.getCenter?.();
    const canvas=document.querySelector('.mapboxgl-canvas');
    const r=canvas?.getBoundingClientRect?.();
    let stack=[];
    if(r){
      const x=r.left+r.width/2,y=r.top+r.height/2;
      const els=document.elementsFromPoint(x,y).slice(0,12);
      stack=els.map(el=>({tag:el.tagName,id:el.id||'',cls:String(el.className||''),pe:getComputedStyle(el).pointerEvents,pos:getComputedStyle(el).position,z:getComputedStyle(el).zIndex}));
    }
    return {
      center:c?{lng:c.lng,lat:c.lat}:null,
      zoom:m?.getZoom?.()??null,
      dragPanEnabled:m?.dragPan?.isEnabled?.()??null,
      touchZoomRotateEnabled:m?.touchZoomRotate?.isEnabled?.()??null,
      scrollZoomEnabled:m?.scrollZoom?.isEnabled?.()??null,
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
      classes:document.documentElement.className,
      overlay:(()=>{const el=document.getElementById('earthlineRegionalVectorOverlay16020');if(!el)return null;const s=getComputedStyle(el),rr=el.getBoundingClientRect();return {pe:s.pointerEvents,display:s.display,visibility:s.visibility,x:rr.x,y:rr.y,w:rr.width,h:rr.height}})(),
      stack
    };
  });
  console.log('SNAP '+label+' '+JSON.stringify(out));
  return out;
}
async function drag(label){
  const box=await page.locator('.mapboxgl-canvas').boundingBox();
  if(!box) throw new Error('no canvas');
  const x=box.x+box.width*0.55,y=box.y+box.height*0.55;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x+180,y+90,{steps:12});
  await page.mouse.up();
  await page.waitForTimeout(700);
  return snap(label);
}
const initial=await snap('initial');
const initialDrag=await drag('initial-after-drag');
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  if(i&&b){i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();}
});
await page.waitForTimeout(9000);
const regional=await snap('regional');
const regionalDrag=await drag('regional-after-drag');
console.log('RESULT '+JSON.stringify({initial,initialDrag,regional,regionalDrag}));
await browser.close();