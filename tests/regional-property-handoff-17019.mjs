import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.goto('http://127.0.0.1:8787/',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
});
await page.waitForFunction(()=>String(window.EARTHLINE_DISPLAYED_RUN_16151?.tier||'').toLowerCase()==='regional'&&Number(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features?.length||0)>0,{timeout:90000,polling:100});
const pre=await page.evaluate(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151;
  const f=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020.swales.features[0];
  window.earthlineOpenCorridorDetail16149(f,0);
  return {runToken:d.runToken};
});
await page.waitForFunction(()=>!!window.EARTHLINE_PROPERTY_TARGET_16201?.code,{timeout:5000});
const before=await page.evaluate(()=>JSON.parse(JSON.stringify(window.EARTHLINE_PROPERTY_TARGET_16201)));
await page.evaluate(()=>{ window.EARTHLINE_PROPERTY_TARGET_16201.parentRunToken=''; });
await page.evaluate(()=>document.getElementById('earthlineDeclareProperty16169')?.click());
await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347!=null,{timeout:10000,polling:50});
const audit=await page.evaluate(()=>window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347);
console.log('HANDOFF_BEFORE '+JSON.stringify(before));
console.log('HANDOFF_AUDIT '+JSON.stringify(audit));
if(audit.validParent!==true)throw new Error('direct Regional Property handoff still blocked');
if(audit.targetRebound!==true||audit.targetGeometryMatch!==true)throw new Error('verified corridor rebind did not occur');
await browser.close();
