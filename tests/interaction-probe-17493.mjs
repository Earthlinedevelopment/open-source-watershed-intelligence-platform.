import { chromium } from 'playwright';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8'),launch=fs.readFileSync('earthline-launch-16872.js','utf8');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:950}});
await context.route('**/*',async r=>{const u=new URL(r.request().url());if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-launch-16872\.js$/.test(u.pathname))return r.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});return r.continue()});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
async function regional(q){const i=page.locator('#searchInput');await i.fill('');await i.fill(q);await page.waitForTimeout(700);const o=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await o.count())throw new Error('no suggestion '+q);await o.first().click();await page.waitForTimeout(250);const b=page.locator('#runBtn');if(await b.isVisible()&&!await b.isDisabled())await b.click();await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100})}
async function one(q,label){
 await regional(q);
 const c=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();await c.waitFor({state:'visible',timeout:30000});await c.click({force:true});
 await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000});await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
 await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000});await page.waitForTimeout(400);
 const before=await page.evaluate(()=>{
   const b=document.getElementById('earthlineDeclareProperty16169');
   window.__earthlineProbe17493={events:[]};
   for(const ev of ['pointerdown','pointerup','click'])document.addEventListener(ev,e=>{if(e.target?.closest?.('#earthlineDeclareProperty16169'))window.__earthlineProbe17493.events.push({type:ev,t:performance.now(),detail:e.detail,button:e.button})},true);
   return {serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),onpointerup:String(b?.onpointerup||'').slice(0,1200),onclick:String(b?.onclick||'').slice(0,1200),dataset:{...b?.dataset},reconciler:typeof window.earthlineReconcilePanel16188};
 });
 const clickAt=Date.now();await page.locator('#earthlineDeclareProperty16169').click();
 await page.waitForTimeout(120);
 const after120=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return{serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),dataset:{...b?.dataset},disabled:!!b?.disabled,events:window.__earthlineProbe17493?.events||[],onpointerup:String(b?.onpointerup||'').slice(0,500),onclick:String(b?.onclick||'').slice(0,500),htmlClasses:document.documentElement.className}});
 let started=false;try{await page.waitForFunction(s=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>s,before.serial,{timeout:15000,polling:50});started=true}catch(_){}
 const startMs=started?Date.now()-clickAt:null;
 let settled=false;try{await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>s&&a?.settled===true},before.serial,{timeout:120000,polling:100});settled=true}catch(_){}
 let elderMs=null,elder=null;try{await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed',null,{timeout:18000,polling:100});elderMs=Date.now()-clickAt;elder=await page.evaluate(()=>JSON.parse(JSON.stringify(window.EARTHLINE_ELDER_TREE_LAST_17097||null)))}catch(_){elderMs=Date.now()-clickAt}
 const final=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return{serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,dataset:{...b?.dataset},events:window.__earthlineProbe17493?.events||[]};});
 return{label,q,before,after120,started,startMs,settled,elderMs,elder,final};
}
await page.goto('https://earthlinedevelopment.org/?probe17493='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});await page.waitForSelector('#searchInput',{timeout:30000});
const first=await one('Essex Junction, Vermont','first');const second=await one('Rutland, Vermont','second');
const result={first,second,errors};console.log('EARTHLINE_INTERACTION_PROBE_17493 '+JSON.stringify(result));
await context.close();await browser.close();