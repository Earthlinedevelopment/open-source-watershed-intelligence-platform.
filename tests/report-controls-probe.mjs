import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
for(const tc of [
  {name:'mobile',ctx:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}},
  {name:'desktop',ctx:{viewport:{width:1440,height:900}}}
]){
  const context=await browser.newContext(tc.ctx);
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('https://earthlinedevelopment.org/?report_controls_probe='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{state:'attached',timeout:20000});
  await page.waitForTimeout(1200);
  const prep=await page.evaluate(async()=>{
    const t={lng:-73.012909,lat:44.513845};
    const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,t.lng,t.lat,20);
    const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'apply'};
    await new Promise(r=>setTimeout(r,900));
    const set=window.earthlineSetPropertyTarget16201({lng:t.lng,lat:t.lat,source:'report-probe'},{openPanel:false});
    if(!set)return {ok:false,reason:'target'};
    const result=await window.earthlineDeclarePropertyAtCrosshair16169();
    return {ok:!!result};
  });
  await page.waitForTimeout(500);
  await page.evaluate(()=>document.getElementById('earthlineVermontReport16149')?.click());
  await page.waitForTimeout(700);
  const state=await page.evaluate(()=>{
    const panel=document.getElementById('earthlineVermontReportPanel16149');
    const all=[...document.querySelectorAll('#earthlineVermontReportPanel16149 button,#earthlineVermontReportPanel16149 [role="button"],#earthlineVermontReportPanel16149 a')];
    const boxes=all.map((e,i)=>{const s=getComputedStyle(e),r=e.getBoundingClientRect(); return {
      i,tag:e.tagName,id:e.id||'',cls:String(e.className||''),text:String(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,100),
      display:s.display,visibility:s.visibility,opacity:s.opacity,pointerEvents:s.pointerEvents,
      x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
      inViewport:r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth
    }});
    const ps=panel?getComputedStyle(panel):null,pr=panel?.getBoundingClientRect();
    return {
      viewport:{w:innerWidth,h:innerHeight},
      panel:panel?{display:ps.display,visibility:ps.visibility,overflowX:ps.overflowX,overflowY:ps.overflowY,x:Math.round(pr.x),y:Math.round(pr.y),w:Math.round(pr.width),h:Math.round(pr.height)}:null,
      controls:boxes
    };
  });
  console.log('EARTHLINE_REPORT_CONTROLS '+JSON.stringify({case:tc.name,prep,state,errors}));
  await page.screenshot({path:'/tmp/'+tc.name+'-report-controls.png',fullPage:true});
  await context.close();
}
await browser.close();