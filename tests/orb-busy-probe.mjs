import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
for(const tc of [
 {name:'mobile',ctx:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}},
 {name:'desktop',ctx:{viewport:{width:1440,height:900}}}
]){
 const context=await browser.newContext(tc.ctx); const page=await context.newPage();
 await page.goto('https://earthlinedevelopment.org/?orb_busy='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForSelector('#searchInput',{state:'attached',timeout:20000}); await page.waitForTimeout(1000);
 if(tc.name==='mobile'&&!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(250);}
 await page.locator('#searchInput').fill('Vermont');
 await page.waitForTimeout(300);
 await page.evaluate(()=>document.getElementById('runBtn')?.click());
 await page.waitForTimeout(450);
 const out=await page.evaluate(()=>{
   const shell=document.querySelector('#runBtn > i.earthline-orb-shell-16244');
   const s=shell?getComputedStyle(shell):null;
   return {htmlClass:document.documentElement.className,runState:document.documentElement.dataset.earthlineRunState||'',busy:document.getElementById('runBtn')?.dataset.busy||'',aria:document.getElementById('runBtn')?.getAttribute('aria-busy'),shell:!!shell,anim:s?.animationName||null,dur:s?.animationDuration||null,play:s?.animationPlayState||null,transform:s?.transform||null};
 });
 console.log('EARTHLINE_ORB_BUSY '+JSON.stringify({case:tc.name,out}));
 await context.close();
}
await browser.close();
// rerun after mobile orb busy restore 183fb49d
