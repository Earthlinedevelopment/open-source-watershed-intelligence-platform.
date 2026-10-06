import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?mobile_map_first_17009='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{state:'attached',timeout:20000});
await page.waitForTimeout(1300);

const snap=async label=>page.evaluate(label=>{
 const box=id=>{const e=document.getElementById(id);if(!e)return null;const s=getComputedStyle(e),r=e.getBoundingClientRect();return{id,display:s.display,visibility:s.visibility,opacity:s.opacity,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),transform:s.transform,z:s.zIndex}};
 const launch=['earthlineLaunchLogin16872','earthlineLaunchDonate16872','earthlineLaunchMerch16872'].map(box);
 return {label,panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188'),rail:box('earthlineRail16188'),panel:box('earthlinePanel16188'),launch,spinner:box('earthlineMobileZoomSpinner17003'),suggestions:box('earthlineSearchSuggestions15970'),scrollW:document.documentElement.scrollWidth,innerW:innerWidth};
},label);

const out={};
out.initial=await snap('initial');
if(!out.initial.panelOpen){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(300);}
out.open=await snap('open');

const input=page.locator('#searchInput');
await input.click();
await input.fill('61 Sle');
await page.waitForTimeout(1100);
out.typed=await snap('typed');
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').first();
out.tapBefore=await opt.count();
if(out.tapBefore){await opt.tap({timeout:8000});await page.waitForTimeout(400);}
out.afterTap=await page.evaluate(()=>({value:document.getElementById('searchInput')?.value||'',open:document.getElementById('earthlineSearchSuggestions15970')?.classList.contains('open')||false}));
out.afterTapSnap=await snap('afterTap');

// rail must not move at any state
const xs=[out.initial,out.open,out.typed,out.afterTapSnap].flatMap(s=>[s.rail?.x,...(s.launch||[]).map(b=>b?.x)]);
out.railStable=xs.filter(Number.isFinite).every((v,i,a)=>i===0||Math.abs(v-a[0])<=60); // parent and child differ, refined below
out.railXStable=[out.initial,out.open,out.typed,out.afterTapSnap].map(s=>s.rail?.x).every(x=>x===0);
out.launchStable=out.initial.launch.map((b,i)=>[b?.x,out.open.launch[i]?.x,out.typed.launch[i]?.x,out.afterTapSnap.launch[i]?.x]).every(a=>a.every(x=>x===a[0]));
out.sheetPass=out.open.panel?.x===54&&out.open.panel?.w===336&&out.open.panel?.h<=520&&out.open.panel?.h<844;
out.overflowPass=out.initial.scrollW<=392&&out.open.scrollW<=392;

// report controls
const prep=await page.evaluate(async()=>{
 const t={lng:-73.012909,lat:44.513845};
 const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,t.lng,t.lat,20);
 const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
 if(!applied)return false; await new Promise(r=>setTimeout(r,900));
 const set=window.earthlineSetPropertyTarget16201({lng:t.lng,lat:t.lat,source:'mobile-map-first-17009'},{openPanel:false});
 if(!set)return false;
 return !!(await window.earthlineDeclarePropertyAtCrosshair16169());
});
out.propertyPrep=prep;
await page.waitForTimeout(400);
await page.evaluate(()=>document.getElementById('earthlineVermontReport16149')?.click());
await page.waitForTimeout(600);
out.reportButtons=await page.evaluate(()=>[...document.querySelectorAll('#earthlineVermontReportPanel16149 .el49-toolbar-actions button')].map(b=>String(b.textContent||b.getAttribute('aria-label')||'').trim()));
out.reportPass=['Print / Save PDF','Open in New Tab','Download HTML'].every(t=>out.reportButtons.includes(t))&&out.reportButtons.some(t=>t==='×'||/close/i.test(t));

// Arizona regional timing, same live public action.
await page.evaluate(()=>document.querySelector('#earthlineVermontReportPanel16149 [data-action="close"]')?.click());
await page.waitForTimeout(200);
console.log('EARTHLINE_MOBILE_MAP_FIRST_17009 '+JSON.stringify({out,errors}));
await browser.close();
if(!(out.railXStable&&out.launchStable&&out.sheetPass&&out.overflowPass&&out.afterTap.value.includes('61 Sleepy Hollow')&&out.reportPass&&errors.length===0))process.exitCode=1;
