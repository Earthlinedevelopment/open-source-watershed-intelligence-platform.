import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage();
await page.goto('https://earthlinedevelopment.org/?tap_probe='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{state:'attached',timeout:20000});
await page.waitForTimeout(1200);
const open=await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'));
if(!open){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(250);}
await page.locator('#searchInput').click();
await page.locator('#searchInput').fill('61 Sle');
await page.waitForTimeout(1000);
const info=await page.evaluate(()=>{
 const o=document.querySelector('#earthlineSearchSuggestions15970 [role="option"]');
 const r=o.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
 const top=document.elementFromPoint(x,y);
 const walk=[];let e=top;while(e&&walk.length<8){walk.push({tag:e.tagName,id:e.id||'',cls:String(e.className||''),role:e.getAttribute?.('role')||'',pe:getComputedStyle(e).pointerEvents,z:getComputedStyle(e).zIndex});e=e.parentElement}
 const s=getComputedStyle(o),p=o.parentElement?getComputedStyle(o.parentElement):null;
 return {option:{x,y,left:r.left,top:r.top,w:r.width,h:r.height,z:s.zIndex,pe:s.pointerEvents},container:o.parentElement?{id:o.parentElement.id,z:p.zIndex,pe:p.pointerEvents,pos:p.position}:null,elementAtCenter:walk};
});
console.log('EARTHLINE_TAP_PROBE '+JSON.stringify(info));
let physical=null;
try{
 const o=page.locator('#earthlineSearchSuggestions15970 [role="option"]').first();
 const bb=await o.boundingBox();
 if(bb){await page.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);await page.waitForTimeout(400);physical=await page.evaluate(()=>({value:document.getElementById('searchInput')?.value||'',open:document.getElementById('earthlineSearchSuggestions15970')?.classList.contains('open')||false}));}
}catch(e){physical={error:String(e)}}
console.log('EARTHLINE_TAP_PHYSICAL '+JSON.stringify(physical));
if(physical?.value?.includes('61 Sleepy Hollow')){await browser.close();process.exit(0);}
const program=await page.evaluate(()=>{const o=document.querySelector('#earthlineSearchSuggestions15970 [role="option"]');o?.click();return {value:document.getElementById('searchInput')?.value||'',open:document.getElementById('earthlineSearchSuggestions15970')?.classList.contains('open')||false}});
console.log('EARTHLINE_TAP_PROGRAM '+JSON.stringify(program));
await browser.close();