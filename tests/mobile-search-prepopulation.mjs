import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const cases=[
 {name:'mobile',ctx:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}},
 {name:'desktop',ctx:{viewport:{width:1440,height:900}}}
];
for(const tc of cases){
 const context=await browser.newContext(tc.ctx);
 const page=await context.newPage();
 const errs=[];page.on('pageerror',e=>errs.push(String(e)));
 await page.goto('https://earthlinedevelopment.org/?prepop_test='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForSelector('#searchInput',{state:'attached',timeout:20000});
 await page.waitForTimeout(1200);
 if(tc.name==='mobile'){
   const open=await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'));
   if(!open){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(300);}
 }
 const input=page.locator('#searchInput');
 await input.click();
 await input.fill('61 Sle');
 await page.waitForTimeout(1800);
 const state=await page.evaluate(()=>{
   const input=document.getElementById('searchInput');
   const nodes=[...document.querySelectorAll('[id*="Suggest"],[id*="suggest"],[class*="suggest"],[role="listbox"],[role="option"],datalist')];
   return {
     value:input?.value||'',
     active:document.activeElement===input,
     suggestions:nodes.map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,cls:String(e.className||''),role:e.getAttribute('role'),display:s.display,visibility:s.visibility,opacity:s.opacity,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),text:String(e.textContent||'').trim().slice(0,700)}}),
     bodyText:String(document.body.innerText||'').slice(0,5000)
   }
 });
 console.log('EARTHLINE_PREPOP '+JSON.stringify({case:tc.name,state,errs}));
 await context.close();
}
await browser.close();
