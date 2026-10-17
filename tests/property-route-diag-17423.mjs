import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?route17423='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{state:'attached',timeout:30000});
if(!(await page.locator('#searchInput').isVisible()))await page.evaluate(()=>{try{document.documentElement.classList.add('earthline-panel-open-16188');window.earthlineReconcilePanel16188?.();document.getElementById('earthlineRailSearch16188')?.click?.();window.earthlineReconcilePanel16188?.()}catch(_){}});
await page.waitForSelector('#searchInput',{state:'visible',timeout:15000});
await page.locator('#searchInput').fill('Vermont');await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(await opts.count())await opts.first().click();
const rb=page.locator('#runBtn');if(await rb.isVisible())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:90000,polling:100});
await page.waitForFunction(()=>typeof window.earthlineFocusRunEngine16158==='function',null,{timeout:20000,polling:100});
const pt={lng:-72.5778,lat:44.2601};
await page.evaluate(async p=>{const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);mp?.jumpTo?.({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});await window.earthlineFocusRunEngine16158({center:{lng:p.lng,lat:p.lat},sizeM:3000,label:'route diag'});},pt);
await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'').toLowerCase()==='focus',null,{timeout:90000,polling:100});
await page.evaluate(p=>new Promise(resolve=>{const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);if(!mp?.jumpTo)return resolve();let done=false;const f=()=>{if(done)return;done=true;resolve()};mp.once?.('moveend',f);mp.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});setTimeout(f,1200)}),pt);
await page.evaluate(()=>{try{window.earthlineSyncPropertyTargetFromMap16201?.()}catch(_){}});
await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return b&&getComputedStyle(b).display!=='none'&&!b.disabled},null,{timeout:20000,polling:100});

const snapshot=()=>page.evaluate(()=>({
 serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
 state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
 tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
 runner:typeof window.earthlineGovernedPropertyRun16202,
 terminal:typeof window.earthlineDeclarePropertyAtCrosshair16173,
 waterGate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null,
 status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),
 tierNotice:String(document.getElementById('earthlineTierNotice16173')?.textContent||''),
 btnOwner:document.getElementById('earthlineDeclareProperty16169')?.dataset?.earthlinePropertyClickOwner16546||null,
 btnOnclick:!!document.getElementById('earthlineDeclareProperty16169')?.onclick
}));

const before=await snapshot();
await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForTimeout(1200);
const afterButton=await snapshot();

let domClickReturn='not-called',afterDom=afterButton;
if(Number(afterButton.serial)===Number(before.serial)&&afterButton.state!=='running'&&afterButton.tier!=='property'){
  domClickReturn=await page.evaluate(async()=>{
    try{
      const b=document.getElementById('earthlineDeclareProperty16169');
      if(!b)return 'missing-button';
      b.click();
      return 'clicked';
    }catch(e){return 'error:'+String(e)}
  });
  await page.waitForTimeout(800);
  afterDom=await snapshot();
}
let directReturn='not-called';
if(Number(afterDom.serial)===Number(before.serial)&&afterDom.state!=='running'&&afterDom.tier!=='property'){
  directReturn=await page.evaluate(async()=>{
    try{
      const fn=window.earthlineDeclarePropertyAtCrosshair16173;
      if(typeof fn!=='function')return 'missing';
      const r=await Promise.race([Promise.resolve(fn()),new Promise(resolve=>setTimeout(()=>resolve('pending-after-2500'),2500))]);
      return r;
    }catch(e){return 'error:'+String(e)}
  });
}
await page.waitForTimeout(300);
const afterDirect=await snapshot();
console.log('EARTHLINE_PROPERTY_ROUTE_17423 '+JSON.stringify({before,afterButton,domClickReturn,afterDom,directReturn,afterDirect,errors}));
await browser.close();
const buttonStarted=afterButton.serial>before.serial||afterButton.state==='running'||afterButton.tier==='property';
const domStarted=afterDom.serial>afterButton.serial||afterDom.state==='running'||afterDom.tier==='property';
const directStarted=afterDirect.serial>afterDom.serial||afterDirect.state==='running'||afterDirect.tier==='property'||directReturn==='pending-after-2500'||directReturn===true;
if(buttonStarted||domStarted||directStarted)process.exitCode=0;else process.exitCode=1;
