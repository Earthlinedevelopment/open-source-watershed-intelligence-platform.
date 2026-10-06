import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
for(const tc of [
 {name:'mobile',ctx:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}},
 {name:'desktop',ctx:{viewport:{width:1440,height:900}}}
]){
 const context=await browser.newContext(tc.ctx); const page=await context.newPage();
 await page.goto('https://earthlinedevelopment.org/?orb_probe='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForSelector('#searchInput',{state:'attached',timeout:20000}); await page.waitForTimeout(1200);
 const out=await page.evaluate(()=>{
   const all=[...document.querySelectorAll('*')];
   const animated=all.map(e=>{const s=getComputedStyle(e);const r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,cls:String(e.className||''),anim:s.animationName,dur:s.animationDuration,play:s.animationPlayState,transform:s.transform,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),text:String(e.textContent||'').trim().slice(0,80)}}).filter(x=>x.anim&&x.anim!=='none');
   const input=document.getElementById('searchInput');
   const parent=input?.parentElement;
   const sib=parent?[...parent.children].map(e=>({tag:e.tagName,id:e.id,cls:String(e.className||''),html:e.outerHTML.slice(0,700)})):[];
   return {animated,sib,htmlClass:document.documentElement.className,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
 });
 console.log('EARTHLINE_ORB_PROBE '+JSON.stringify({case:tc.name,out}));
 await context.close();
}
await browser.close();