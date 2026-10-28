import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1798,height:831}});
await page.goto(URL+'?az-first-press='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(700);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click().catch(()=>{});
await page.locator('#runBtn').click();
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:100});
const target={lng:-111.93066,lat:34.21568};
await page.evaluate(t=>{
 const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
 m.jumpTo({center:[t.lng,t.lat],zoom:16.59});
 try{m.fire?.('dragend')}catch(_){}
},target);
await page.waitForFunction(t=>{
 const p=window.EARTHLINE_PROPERTY_TARGET_16201||null;
 return !!p&&Math.abs(Number(p.lng)-t.lng)<.00008&&Math.abs(Number(p.lat)-t.lat)<.00008;
},target,{timeout:15000,polling:100});
const before=await page.evaluate(()=>({
 serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
 accepted:window.EARTHLINE_PROPERTY_ACCEPTED_TARGET_M7839||null,
 state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
 button:{disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,owner:document.getElementById('earthlineDeclareProperty16169')?.dataset.earthlinePropertyClickOwner16546||null}
}));
await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForTimeout(3500);
const after1=await page.evaluate(()=>({
 serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
 audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
 declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
 accepted:window.EARTHLINE_PROPERTY_ACCEPTED_TARGET_M7839||null,
 state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
 displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
 handoff:window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null,
 waterGate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null
}));
let after2=null;
if(Number(after1.serial)<=Number(before.serial)){
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForTimeout(3500);
  after2=await page.evaluate(()=>({
   serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
   audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
   declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
   accepted:window.EARTHLINE_PROPERTY_ACCEPTED_TARGET_M7839||null,
   state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
   displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
   handoff:window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null,
   waterGate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null
  }));
}
console.log('EARTHLINE_AZ_FIRST_PRESS_DIAG '+JSON.stringify({before,after1,after2}));
await browser.close();
