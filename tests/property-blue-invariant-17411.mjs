import { chromium, firefox, webkit } from 'playwright';
import { readFileSync } from 'node:fs';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const BASE='https://earthlinedevelopment.org/';
const TARGET={lng:-73.012909,lat:44.513845};
const browser=await launcher.launch({headless});
const context=await browser.newContext({viewport:{width:1600,height:950}});
const patchedIndex=readFileSync('index.html');
await context.route('https://earthlinedevelopment.org/?*',r=>r.fulfill({status:200,body:patchedIndex,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}}));
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?blueInvariant17412='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count())await opts.first().click();
const runBtn=page.locator('#runBtn');
if(await runBtn.isVisible()){
  const busy=await runBtn.evaluate(b=>b.dataset.busy==='1'||b.disabled);
  if(!busy)await runBtn.click();
}
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  return String(d?.tier||d?.mode||'').toLowerCase()==='regional'&&/vermont/i.test(String(d?.query||''));
},null,{timeout:120000,polling:100});
await page.waitForFunction(()=>typeof window.earthlineFocusRunEngine16158==='function'&&typeof window.earthlineSetPropertyTarget16201==='function'&&typeof window.earthlineDeclarePropertyAtCrosshair16169==='function',null,{timeout:30000,polling:100});

async function prepareFocus(){
  await page.evaluate(async t=>{
    await window.earthlineFocusRunEngine16158({center:{lng:t.lng,lat:t.lat},sizeM:3000,label:'Vermont blue invariant'});
  },TARGET);
  await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'').toLowerCase()==='focus',null,{timeout:120000,polling:100});
  await page.evaluate(t=>new Promise(resolve=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!mp?.jumpTo)return resolve();
    let done=false;const finish=()=>{if(done)return;done=true;resolve()};
    mp.once?.('moveend',finish);mp.jumpTo({center:[t.lng,t.lat],zoom:16.78,bearing:0,pitch:0});setTimeout(finish,1600);
  }),TARGET);
  await page.evaluate(t=>window.earthlineSetPropertyTarget16201({lng:t.lng,lat:t.lat,source:'blue-invariant-17412',code:'',score:0,at:new Date().toISOString()},{openPanel:false}),TARGET);
  await page.waitForTimeout(250);
}

async function runProperty(label){
  await prepareFocus();
  const prep=await page.evaluate(()=>({ok:true,searchGen:Number(((typeof M!=='undefined'&&M)||window.M||{}).searchGen||0)}));
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const started=Date.now();
  let callResult=null,callError=null;
  try{callResult=await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());}
  catch(e){callError=String(e)}
  try{
    await page.waitForFunction(pre=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      return Number(a?.serial||0)>pre&&a?.settled===true;
    },before,{timeout:90000,polling:100});
  }catch(_){}
  await page.evaluate(async()=>{
    try{if(typeof window.earthlineSyncPropertyTexture16169==='function')await window.earthlineSyncPropertyTexture16169('blue-invariant-force')}catch(_){}
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  });
  const snap=await page.evaluate(()=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const ids={
      footprint:'earthline-property-swale-footprint-16174',
      casing:'earthline-property-swale-natural-casing-16174',
      up:'earthline-property-swale-natural-up-16174',
      flip:'earthline-property-swale-natural-flip-16174',
      neutral:'earthline-property-swale-neutral-16177'
    };
    const safe=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
    const paint=(id,p)=>{try{return mp?.getLayer?.(id)?mp.getPaintProperty(id,p):null}catch(_){return null}};
    const layout=(id,p)=>{try{return mp?.getLayer?.(id)?mp.getLayoutProperty(id,p):null}catch(_){return null}};
    const style={
      footprint:{opacity:paint(ids.footprint,'fill-opacity'),visibility:layout(ids.footprint,'visibility')},
      casing:{color:paint(ids.casing,'line-color'),opacity:paint(ids.casing,'line-opacity'),width:paint(ids.casing,'line-width'),visibility:layout(ids.casing,'visibility')},
      up:{pattern:paint(ids.up,'line-pattern'),opacity:paint(ids.up,'line-opacity'),width:paint(ids.up,'line-width'),visibility:layout(ids.up,'visibility')},
      flip:{pattern:paint(ids.flip,'line-pattern'),opacity:paint(ids.flip,'line-opacity'),width:paint(ids.flip,'line-width'),visibility:layout(ids.flip,'visibility')},
      neutral:{color:paint(ids.neutral,'line-color'),opacity:paint(ids.neutral,'line-opacity'),width:paint(ids.neutral,'line-width'),visibility:layout(ids.neutral,'visibility')},
      safe:Object.fromEntries(safe.map(id=>[id,{opacity:paint(id,'line-opacity'),visibility:layout(id,'visibility')}])),
      images:{
        up:!!mp?.hasImage?.('earthline-swale-natural-uphill-16174'),
        flip:!!mp?.hasImage?.('earthline-swale-natural-uphill-flipped-16174')
      }
    };
    const src=mp?.getSource?.('earthline-property-swale-texture-16174');
    return {
      style,
      sourceFeatures:Array.isArray(src?._data?.features)?src._data.features.length:0,
      textureAudit:window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null,
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||'')
    };
  });
  return {label,prep,elapsedMs:Date.now()-started,callResult,callError,...snap};
}

const first=await runProperty('first');
const second=await runProperty('repeat');
await context.close();
await browser.close();

const styleKey=v=>JSON.stringify(v);
const fallbackZero=r=>Object.values(r.style.safe).every(x=>Number(x.opacity)===0);
const naturalReady=r=>r.style.images.up&&r.style.images.flip&&r.sourceFeatures>0&&r.textureAudit?.imagesReady===true;
const propertyOk=r=>!r.callError&&r.audit?.settled===true&&r.audit?.result===true;
const sameStyle=styleKey(first.style)===styleKey(second.style);
const pass=propertyOk(first)&&propertyOk(second)&&naturalReady(first)&&naturalReady(second)&&fallbackZero(first)&&fallbackZero(second)&&sameStyle;
console.log('EARTHLINE_BLUE_INVARIANT_17411 '+JSON.stringify({browser:BROWSER,pass,sameStyle,firstFallbackZero:fallbackZero(first),secondFallbackZero:fallbackZero(second),firstNaturalReady:naturalReady(first),secondNaturalReady:naturalReady(second),first,second,errors}));
if(!pass)process.exitCode=1;
