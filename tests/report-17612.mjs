import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { resolve,extname } from 'node:path';
const root=process.cwd(),origin='https://earthlinedevelopment.org';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.py':'text/plain; charset=utf-8'};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1600,height:900},serviceWorkers:'block'});
await context.route(origin+'/**',async route=>{const u=new URL(route.request().url()),p=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html',f=resolve(root,p);if(f.startsWith(root)&&existsSync(f))return route.fulfill({status:200,path:f,contentType:mime[extname(f)]||'application/octet-stream',headers:{'cache-control':'no-store'}});return route.continue();});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(origin+'/?report17612='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Arizona');await page.waitForTimeout(650);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first();if(await opt.count())await opt.click().catch(()=>{});
const run=page.locator('#runBtn');if(await run.isVisible()&&!await run.evaluate(b=>b.dataset.busy==='1'||b.disabled))await run.click();
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,null,{timeout:120000,polling:120});
await page.waitForTimeout(500);
const regionalCount=await page.evaluate(()=>Number(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated||0));
await page.locator('#earthlineVermontReport16149').click();await page.waitForTimeout(500);
const regional=await page.evaluate(()=>{const p=document.getElementById('earthlineVermontReportPanel16149');const t=String(p?.innerText||'').replace(/\s+/g,' ').trim();return {open:!!p?.classList.contains('open'),text:t.slice(0,12000),process:/The Earthline Process/i.test(t),how:/How Bioswales Work/i.test(t)}});
await page.locator('#earthlineVermontReportPanel16149 [data-action="close"]').click();

const ctl={lng:-111.93456,lat:34.21545};
await page.evaluate(c=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[c.lng,c.lat],zoom:17,bearing:0,pitch:0});try{m.fire('dragend')}catch(_){}},ctl);
await page.waitForFunction(c=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201;return !!t&&Math.abs(Number(t.lng)-c.lng)<.00008&&Math.abs(Number(t.lat)-c.lat)<.00008},ctl,{timeout:15000,polling:80});
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.locator('#earthlineDeclareProperty16169').click({timeout:15000});
await page.waitForFunction(b=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return !!a&&Number(a.serial||0)>b&&a.settled===true},before,{timeout:150000,polling:120});
await page.waitForTimeout(1700);
const scientific=await page.evaluate(()=>({safe:Number(M?.authoritativeSafeSwales15815?.features?.length||0),water:Number(M?.authoritativeWaterPaths15824?.features?.length||0),recharge:Number(M?.rechZones?.length||0),elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null}));
await page.locator('#earthlineVermontReport16149').click();await page.waitForTimeout(600);
const property=await page.evaluate(()=>{const p=document.getElementById('earthlineVermontReportPanel16149');const t=String(p?.innerText||'').replace(/\s+/g,' ').trim();return {open:!!p?.classList.contains('open'),text:t,controls:[...p?.querySelectorAll('button')||[]].map(b=>String(b.textContent||b.getAttribute('aria-label')||'').trim())}});
const exactCount=new RegExp(String(scientific.safe)+' Property bioswale corridor','i').test(property.text);
const staleRegional=new RegExp(String(regionalCount)+' regional opportunity corridor','i').test(property.text);
const required={
 process:/The Earthline Process/i.test(property.text),
 how:/How Bioswales Work/i.test(property.text),
 beaver:/Beaver activity/i.test(property.text),
 climate:/Climate-change modeling note/i.test(property.text),
 professional:/All sites need to be verified by a professional landscape expert\./i.test(property.text),
 rainfall:/Average yearly rainfall:/i.test(property.text),
 elder:/Elder Tree Evidence/i.test(property.text),
 safety:/Safety and Exclusions/i.test(property.text),
 next:/Move from screening to field-verified design/i.test(property.text),
 disclaimer:/not a construction instruction|not a professional engineering seal/i.test(property.text)
};
const regionalPass=regional.open&&regionalCount>0&&new RegExp(String(regionalCount)+' regional opportunity corridor','i').test(regional.text)&&regional.process&&regional.how;
const propertyPass=property.open&&scientific.safe>0&&scientific.water>0&&exactCount&&!staleRegional&&Object.values(required).every(Boolean)&&property.controls.some(x=>/Print \/ Save PDF/i.test(x))&&property.controls.some(x=>/Download HTML/i.test(x));
const pass=regionalPass&&propertyPass&&!errors.length;
console.log('EARTHLINE_REPORT_17612 '+JSON.stringify({pass,regionalPass,propertyPass,regionalCount,scientific,exactCount,staleRegional,required,controls:property.controls,errors}));
await page.screenshot({path:'/tmp/report-17612.png',fullPage:true});
await browser.close();
if(!pass)process.exitCode=1;
