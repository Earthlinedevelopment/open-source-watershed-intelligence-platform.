import { chromium } from 'playwright';
const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.goto(URL+'?nz-dateline='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>typeof geocodeMapbox==='function',{timeout:30000});
await page.evaluate(async()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='New Zealand';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
});
await page.waitForFunction(()=>window.EARTHLINE_NZ_DATELINE_NAV_16845?.enabled===true,{timeout:100000,polling:100});
await page.waitForFunction(()=>typeof earthlineMap!=='undefined'&&earthlineMap&&earthlineMap.getCenter&&earthlineMap.getZoom&&earthlineMap.getZoom()>0,{timeout:30000});
const before=await page.evaluate(()=>({c:earthlineMap.getCenter().toArray(),z:earthlineMap.getZoom(),world:earthlineMap.getRenderWorldCopies?earthlineMap.getRenderWorldCopies():null,a:window.EARTHLINE_NZ_DATELINE_NAV_16845}));
await page.evaluate(()=>new Promise(resolve=>{
  let done=false;const finish=()=>{if(done)return;done=true;resolve();};
  earthlineMap.once('moveend',finish);
  earthlineMap.panBy([-650,0],{duration:0});
  setTimeout(finish,2500);
}));
const after=await page.evaluate(()=>({c:earthlineMap.getCenter().toArray(),z:earthlineMap.getZoom(),world:earthlineMap.getRenderWorldCopies?earthlineMap.getRenderWorldCopies():null}));
console.log(JSON.stringify({before,after}));
const raw=Math.abs(after.c[0]-before.c[0]);
const wrapped=Math.min(raw,Math.abs(raw-360));
if(before.world!==true||after.world!==true)throw new Error('NZ world copies not enabled');
if(wrapped<0.05)throw new Error('NZ camera still blocked in leftward/dateline direction');
await browser.close();
