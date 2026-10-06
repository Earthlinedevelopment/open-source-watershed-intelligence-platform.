import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?mobile_shell_17004='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{state:'attached',timeout:20000});
await page.waitForTimeout(1400);
const snap=async label=>page.evaluate(label=>{
 const box=id=>{const e=document.getElementById(id);if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),display:s.display,visibility:s.visibility,opacity:s.opacity,pe:s.pointerEvents}};
 const a=window.EARTHLINE_MOBILE_PANEL_STACK_17004?.audit?.()||null;
 return {label,inner:{w:innerWidth,h:innerHeight},panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188'),tier:document.documentElement.dataset.earthlineAnalysisTier||'',audit:a,rail:box('earthlineRail16188'),panel:box('earthlinePanel16188'),login:box('earthlineLaunchLogin16872'),donate:box('earthlineLaunchDonate16872'),merch:box('earthlineLaunchMerch16872'),propertyAction:box('earthlineMobilePropertyAction17004'),busy:box('earthlineMobileBusy17004')};
},label);

const initial=await snap('initial');
if(!initial.panelOpen){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(300);}
const opened=await snap('opened');
await page.locator('#searchInput').fill('61 Sle');
await page.waitForTimeout(900);
const typed=await snap('typed');
const option=page.locator('#earthlineSearchSuggestions15970 [role="option"]').first();
let tapOk=false,tapValue='';
if(await option.count()){await option.tap({timeout:8000});await page.waitForTimeout(350);tapValue=await page.locator('#searchInput').inputValue();tapOk=/61 Sleepy Hollow/i.test(tapValue);}
const afterTap=await snap('afterTap');

await page.evaluate(()=>document.getElementById('earthlinePanelClose16188')?.click());
await page.waitForTimeout(350);
const closed=await snap('closed');

await page.evaluate(()=>{
 const t={lng:-73.012909,lat:44.513845};
 window.earthlineSetPropertyTarget16201?.({lng:t.lng,lat:t.lat,source:'mobile-shell-test'},{openPanel:false});
});
await page.waitForTimeout(250);
const propertyReady=await snap('propertyReady');

const xs=[initial,opened,typed,afterTap,closed,propertyReady].map(s=>[s.rail?.x,s.login?.x,s.donate?.x,s.merch?.x]);
const railStable=xs.every(v=>JSON.stringify(v)===JSON.stringify(xs[0]));
const sheetPass=opened.panel?.x===54 && opened.panel?.w===336 && opened.panel?.y>0 && opened.panel?.h<844 && opened.panel?.visibility==='visible';
const mapVisibleAbove=opened.panel?.y>=200;
const closedPass=closed.panel?.visibility==='hidden' && closed.panel?.pe==='none';
const propertyActionPass=propertyReady.propertyAction?.display==='flex' && propertyReady.propertyAction?.visibility==='visible';
const pass=tapOk&&railStable&&sheetPass&&mapVisibleAbove&&closedPass&&propertyActionPass&&errors.length===0;
console.log('EARTHLINE_MOBILE_SHELL_17004 '+JSON.stringify({pass,tapOk,tapValue,railStable,xs,sheetPass,mapVisibleAbove,closedPass,propertyActionPass,initial,opened,closed,propertyReady,errors}));
await browser.close();
if(!pass)process.exitCode=1;
