import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:1798,height:831},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

await page.goto('https://earthlinedevelopment.org/?az_two_property='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
  await page.waitForTimeout(200);
}
await page.locator('#searchInput').click();
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(900);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona.*State \/ Region/i}).first();
if(await opt.count()) await opt.click({timeout:10000});
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>!!window.EARTHLINE_PROPERTY_TARGET_16201&&String(window.EARTHLINE_PROPERTY_TARGET_16201.source||'').includes('resolved-search'),undefined,{timeout:30000,polling:100});
await page.waitForFunction(()=>!document.documentElement.classList.contains('earthline-regional-running-16233')&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true',undefined,{timeout:30000,polling:100});
await page.waitForTimeout(300);

async function runProperty(label){
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click({timeout:15000,noWaitAfter:true});
  await page.waitForFunction(prev=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
    return !!a&&Number(a.serial||0)>prev&&a.settled===true;
  },before,{timeout:30000,polling:75});
  const ms=Date.now()-t0;
  return await page.evaluate(({label,ms})=>{
    const md=(typeof M!=='undefined'&&M)||window.M||{};
    const sw=Array.isArray(md?.authoritativeSafeSwales15815?.features)?md.authoritativeSafeSwales15815.features:[];
    const waterSrc=(window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null))?.getSource?.('earthline-property-water-16181');
    const water=waterSrc?._data?.features||[];
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    return {
      label,ms,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
      audit:a,
      swales:{count:sw.length,fp:a?.sourceEvidence?.scientificInputFingerprint||null},
      water:{count:water.length},
      elder,
      button:String(document.getElementById('earthlineDeclareProperty16169')?.textContent||'').replace(/\s+/g,' ').trim()
    };
  },{label,ms});
}

const first=await runProperty('first');

const secondCoord={lng:-111.93347,lat:34.21629};
await page.evaluate(({lng,lat})=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  m.jumpTo({center:[lng,lat],zoom:17.25});
  try{m.fire?.('dragend')}catch(_){}
},{...secondCoord});
await page.waitForFunction(({lng,lat})=>{
  const t=window.EARTHLINE_PROPERTY_TARGET_16201;
  return !!t&&Math.abs(Number(t.lng)-lng)<0.00008&&Math.abs(Number(t.lat)-lat)<0.00008&&String(t.source||'').includes('crosshair-user-drag');
},secondCoord,{timeout:10000,polling:50});
await page.waitForTimeout(250);

const second=await runProperty('second');
await page.screenshot({path:'/tmp/arizona-two-property-engine.png',fullPage:true});

const coherent=r=>{
  const t=r.target,d=r.declaration?.center,a=r.audit?.center;
  if(!t||!d||!a)return false;
  const near=(x,y)=>Math.abs(Number(x)-Number(y))<0.00008;
  return near(t.lng,d.lng)&&near(t.lat,d.lat)&&near(t.lng,a.lng)&&near(t.lat,a.lat)&&r.audit?.settled===true&&r.audit?.result===true&&r.swales.count>0&&r.ms<15000;
};
const ok=coherent(first)&&coherent(second);
console.log('EARTHLINE_ARIZONA_TWO_PROPERTY '+JSON.stringify({ok,first,second,errors}));
await browser.close();
if(!ok)process.exitCode=1;

// Wait for Regional terminal before consecutive Property gate
