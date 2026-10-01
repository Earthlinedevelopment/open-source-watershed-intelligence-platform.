import { chromium } from 'playwright';
const b=await chromium.launch({headless:true});
const p=await b.newPage({viewport:{width:1600,height:900}});
await p.goto('https://earthlinedevelopment.org/?nz-block='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForSelector('#searchInput',{timeout:30000});
await p.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New Zealand';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
await p.waitForFunction(()=>String(window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970?.query||'').toLowerCase()==='new zealand',{timeout:100000});
const out=await p.evaluate(()=>{
  const c=document.querySelector('#mapboxBase canvas.mapboxgl-canvas'); const r=c.getBoundingClientRect();
  const x=r.left+r.width*.55,y=r.top+r.height*.55;
  return document.elementsFromPoint(x,y).slice(0,12).map(el=>({
    tag:el.tagName,id:el.id||'',cls:String(el.className?.baseVal||el.className||''),pe:getComputedStyle(el).pointerEvents,
    parent:{tag:el.parentElement?.tagName||'',id:el.parentElement?.id||'',cls:String(el.parentElement?.className?.baseVal||el.parentElement?.className||''),pe:el.parentElement?getComputedStyle(el.parentElement).pointerEvents:null},
    grand:{tag:el.parentElement?.parentElement?.tagName||'',id:el.parentElement?.parentElement?.id||'',cls:String(el.parentElement?.parentElement?.className?.baseVal||el.parentElement?.parentElement?.className||''),pe:el.parentElement?.parentElement?getComputedStyle(el.parentElement.parentElement).pointerEvents:null}
  }));
});
console.log(JSON.stringify(out,null,2)); await b.close();