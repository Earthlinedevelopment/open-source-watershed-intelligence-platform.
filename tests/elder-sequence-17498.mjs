import { chromium } from 'playwright';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8'),launch=fs.readFileSync('earthline-launch-16872.js','utf8');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:950}});
await context.route('**/*',async r=>{const u=new URL(r.request().url());if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-launch-16872\.js$/.test(u.pathname))return r.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});return r.continue()});
const page=await context.newPage({viewport:{width:1800,height:950}});
await page.addInitScript(()=>{
  window.__elderDiag17498={events:[]};
  const orig=Worker.prototype.postMessage;
  Worker.prototype.postMessage=function(msg,...rest){
    try{if(msg&&typeof msg==='object'&&(String(msg.id||'').startsWith('elder-')||msg.warm||msg.warmBbox))window.__elderDiag17498.events.push({kind:'worker-post',id:String(msg.id||''),warm:!!msg.warm,warmBbox:!!msg.warmBbox,t:performance.now()})}catch(_){}
    return orig.call(this,msg,...rest);
  };
});
async function regional(q){const i=page.locator('#searchInput');await i.fill('');await i.fill(q);await page.waitForTimeout(700);const o=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await o.count())throw new Error('no suggestion '+q);await o.first().click();await page.waitForTimeout(250);const b=page.locator('#runBtn');if(await b.isVisible()&&!await b.isDisabled())await b.click();await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100})}
async function one(q,label){await regional(q);const c=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();await c.waitFor({state:'visible',timeout:30000});await c.click({force:true});await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000});await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000});await page.waitForTimeout(300);
await page.evaluate(()=>{
  const api=window.EARTHLINE_ELDER_TREES_V1_17097;
  if(api&&!api.__diag17498){
    const old=api.startProperty;
    api.startProperty=function(){const t=performance.now();window.__elderDiag17498.events.push({kind:'startProperty-call',t});const out=old.apply(this,arguments);Promise.resolve(out).then(()=>window.__elderDiag17498.events.push({kind:'startProperty-resolve',t:performance.now()}));return out};
    api.__diag17498=true;
  }
});
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
const clickPerf=await page.evaluate(()=>performance.now());
await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>s&&a?.settled===true},before,{timeout:120000,polling:100});
try{await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed',null,{timeout:25000,polling:100})}catch(_){}
const out=await page.evaluate(({label,q,clickPerf})=>({label,q,clickPerf,now:performance.now(),events:window.__elderDiag17498.events.slice(-30),elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null}),{label,q,clickPerf});
console.log('EARTHLINE_ELDER_SEQUENCE_17498 '+JSON.stringify(out));}
await page.goto('https://earthlinedevelopment.org/?diag17498='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});await page.waitForSelector('#searchInput',{timeout:30000});
await one('Essex Junction, Vermont','first');await one('Rutland, Vermont','second');await context.close();await browser.close();