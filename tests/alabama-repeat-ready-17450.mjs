import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?repeatReady17450='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Alabama');await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(await opts.count())await opts.first().click();
const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
const label=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();await label.waitFor({state:'visible',timeout:30000});await label.click({force:true});
await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000});
await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000,polling:100});
const before1=await page.evaluate(()=>({serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),target:{...(window.EARTHLINE_PROPERTY_TARGET_16201||{})}}));
const t1=Date.now();await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(s=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>s,before1.serial,{timeout:5000,polling:50});
let ready1=false;
try{await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running'&&!!b&&!b.disabled},null,{timeout:120000,polling:100});ready1=true}catch(_){}
const ready1At=Date.now();
const firstState=await page.evaluate(()=>({serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),runState:String(document.documentElement.dataset.earthlinePropertyRunState||''),disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,target:{...(window.EARTHLINE_PROPERTY_TARGET_16201||{})},elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null}));
let moved=false;
const old=firstState.target;
await page.evaluate(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m?.panBy?.([240,0],{duration:0})});
try{await page.waitForFunction(old=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201||{};return Number.isFinite(Number(t.lng))&&(Math.abs(Number(t.lng)-Number(old.lng))>1e-5||Math.abs(Number(t.lat)-Number(old.lat))>1e-5)},old,{timeout:10000,polling:100});moved=true}catch(_){}
await page.waitForTimeout(300);
const before2=await page.evaluate(()=>({serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),runState:String(document.documentElement.dataset.earthlinePropertyRunState||''),disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,target:{...(window.EARTHLINE_PROPERTY_TARGET_16201||{})},pointer:typeof document.getElementById('earthlineDeclareProperty16169')?.onpointerup,click:typeof document.getElementById('earthlineDeclareProperty16169')?.onclick}));
const t2=Date.now();await page.locator('#earthlineDeclareProperty16169').click();
let secondStarted=false;
try{await page.waitForFunction(s=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>s,s=before2.serial,{timeout:5000,polling:50});secondStarted=true}catch(_){}
const after2=await page.evaluate(()=>({serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),runState:String(document.documentElement.dataset.earthlinePropertyRunState||''),disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,target:{...(window.EARTHLINE_PROPERTY_TARGET_16201||{})}}));
const result={ready1,firstReadyMs:ready1At-t1,moved,before1,firstState,before2,secondStarted,secondStartObservedMs:Date.now()-t2,after2,errors};
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/alabama-repeat-ready-17450.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_ALABAMA_REPEAT_READY_17450 '+JSON.stringify(result));
await browser.close();
if(!ready1||!moved||!secondStarted)process.exitCode=1;
