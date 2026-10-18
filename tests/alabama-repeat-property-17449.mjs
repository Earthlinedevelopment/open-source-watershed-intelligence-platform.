import { chromium, firefox, webkit } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
if(!launcher)throw new Error('unsupported browser '+BROWSER);
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
const sleep=ms=>page.waitForTimeout(ms);

async function snapshot(label){
  return await page.evaluate(label=>{
    const b=document.getElementById('earthlineDeclareProperty16169');
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    return {
      label,
      buttonPresent:!!b,
      disabled:!!b?.disabled,
      connected:!!b?.isConnected,
      onpointerup:typeof b?.onpointerup,
      onclick:typeof b?.onclick,
      pointerStamp:b?.dataset?.earthlinePointerLaunch17444||null,
      clickOwner:b?.dataset?.earthlinePropertyClickOwner16546||null,
      serial:Number(a?.serial||0),
      runState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      elder:e
    };
  },label);
}

await page.goto(BASE+'?repeatProperty17449='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Alabama');
await sleep(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count())await opts.first().click();
const rb=page.locator('#runBtn'); if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});

const label=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();
await label.waitFor({state:'visible',timeout:30000});
await label.click({force:true});
await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000});
await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000,polling:100});
await sleep(250);

const before1=await snapshot('before1');
const p=page.locator('#earthlineDeclareProperty16169');
const click1=Date.now(); await p.click();
let firstStarted=false;
try{await page.waitForFunction(s=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>s,null,{timeout:4000,polling:50},before1.serial);firstStarted=true}catch(_){}
let firstElderMs=null;
try{
  await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed',null,{timeout:30000,polling:100});
  firstElderMs=Date.now()-click1;
}catch(_){firstElderMs=Date.now()-click1}
await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>=1&&!!b&&!b.disabled&&String(document.documentElement.dataset.earthlinePropertyRunState||'')==='idle'},null,{timeout:30000,polling:100});
await sleep(250);
const after1=await snapshot('after1');

// Move the governed crosshair target before the second Property run.
await page.evaluate(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);const c=m?.getCenter?.();if(c)m.panTo({lng:Number(c.lng)+0.004,lat:Number(c.lat)+0.003},{duration:0});}catch(_){}});
await sleep(700);
const serial1=after1.serial;
const before2=await snapshot('before2');
const click2=Date.now(); await page.locator('#earthlineDeclareProperty16169').click();
let secondStarted=false;
try{await page.waitForFunction(s=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>s||String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running',serial1,{timeout:4000,polling:50});secondStarted=true}catch(_){}
const afterSecondPress=await snapshot('afterSecondPress');

let secondElderMs=null;
if(secondStarted){
  try{
    await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed',null,{timeout:30000,polling:100});
    secondElderMs=Date.now()-click2;
  }catch(_){secondElderMs=Date.now()-click2}
}
const final=await snapshot('final');
const result={browser:BROWSER,firstStarted,secondStarted,firstElderMs,secondElderMs,before1,after1,before2,afterSecondPress,final,errors};
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/alabama-repeat-property-17449.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_ALABAMA_REPEAT_17449 '+JSON.stringify(result));
await browser.close();
if(!firstStarted||!secondStarted)process.exitCode=1;
