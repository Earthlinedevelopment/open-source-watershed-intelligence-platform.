import { webkit } from 'playwright';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8'),launch=fs.readFileSync('earthline-launch-16872.js','utf8');
const browser=await webkit.launch({headless:false});
const context=await browser.newContext({viewport:{width:1800,height:950}});
await context.route('**/*',async r=>{
 const u=new URL(r.request().url());
 if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')
   return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
 if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-launch-16872\.js$/.test(u.pathname))
   return r.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
 return r.continue();
});
const page=await context.newPage();
await page.addInitScript(()=>{
 window.__wk17518=[];
 const snap=(kind)=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.(),t=window.EARTHLINE_PROPERTY_TARGET_16201||null;window.__wk17518.push({kind,t:performance.now(),target:t?{lng:+t.lng,lat:+t.lat,source:t.source,code:t.code}:null,center:c?{lng:+c.lng,lat:+c.lat}:null,moving:!!m?.isMoving?.(),zoom:+(m?.getZoom?.()||0),state:String(document.documentElement.dataset.earthlinePropertyRunState||''),latched:document.documentElement.classList.contains('earthline-property-orb-latched-16244')})}catch(_){}};
 for(const ev of ['pointerdown','pointerup','click'])document.addEventListener(ev,e=>{if(e.target?.closest?.('#earthlineDeclareProperty16169'))snap(ev)},true);
 window.addEventListener('load',()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m?.on?.('moveend',()=>snap('moveend'))}catch(_){}});
});
await page.goto('https://earthlinedevelopment.org/?wk17518='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
const i=page.locator('#searchInput');await i.fill('Essex Junction, Vermont');await page.waitForTimeout(700);
const o=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await o.count())throw new Error('no suggestion');
await o.first().click();await page.waitForTimeout(250);const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
const c=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();await c.waitFor({state:'visible',timeout:30000});await c.click({force:true});
await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000});
await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000});
await page.waitForTimeout(250);
const before=await page.evaluate(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();return {target:JSON.parse(JSON.stringify(window.EARTHLINE_PROPERTY_TARGET_16201||null)),center:c?{lng:+c.lng,lat:+c.lat}:null,moving:!!m?.isMoving?.(),events:window.__wk17518.slice()};});
await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed',null,{timeout:20000,polling:25});
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:120000,polling:50});
await page.waitForTimeout(300);
const after=await page.evaluate(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();return {target:JSON.parse(JSON.stringify(window.EARTHLINE_PROPERTY_TARGET_16201||null)),center:c?{lng:+c.lng,lat:+c.lat}:null,moving:!!m?.isMoving?.(),audit:JSON.parse(JSON.stringify(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null)),elder:JSON.parse(JSON.stringify(window.EARTHLINE_ELDER_TREE_LAST_17097||null)),events:window.__wk17518.slice()};});
console.log('EARTHLINE_WEBKIT_TARGET_TRACE_17518 '+JSON.stringify({before,after}));
await context.close();await browser.close();
