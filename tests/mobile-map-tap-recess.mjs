import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?map_tap_recess='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:20000}); await page.waitForTimeout(1200);
if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
 await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click()); await page.waitForTimeout(250);
}
const before=await page.evaluate(()=>({open:document.documentElement.classList.contains('earthline-panel-open-16188'),panel:document.getElementById('earthlinePanel16188')?.getBoundingClientRect().toJSON?.()||null}));
const canvas=page.locator('.mapboxgl-canvas').first();
const box=await canvas.boundingBox();
if(!box)throw new Error('map canvas missing');
await page.touchscreen.tap(Math.min(box.x+box.width-24,360),Math.max(box.y+24,60));
await page.waitForTimeout(350);
const after=await page.evaluate(()=>{const e=document.getElementById('earthlinePanel16188'),s=e?getComputedStyle(e):null,r=e?.getBoundingClientRect();return{open:document.documentElement.classList.contains('earthline-panel-open-16188'),visibility:s?.visibility||'',pe:s?.pointerEvents||'',y:r?Math.round(r.y):null}});
const pass=before.open===true&&after.open===false&&after.visibility==='hidden'&&after.pe==='none'&&errors.length===0;
console.log('EARTHLINE_MAP_TAP_RECESS '+JSON.stringify({pass,before,after,errors}));
await browser.close(); if(!pass)process.exitCode=1;