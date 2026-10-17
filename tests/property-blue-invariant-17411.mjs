import { chromium, firefox, webkit } from 'playwright';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const TARGET={lng:-73.012909,lat:44.513845};
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1600,height:950}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?blueInvariant17411='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForFunction(()=>typeof window.applyLocation==='function'&&typeof window.earthlineSetPropertyTarget16201==='function'&&typeof window.earthlineDeclarePropertyAtCrosshair16169==='function',null,{timeout:45000,polling:100});

async function runProperty(label){
  const prep=await page.evaluate(async t=>{
    const m=(typeof M!=='undefined'&&M)||window.M||null;
    const site=window.earthlineSelectedSiteFromCenter(m?.loc||null,t.lng,t.lat,20);
    const ok=await window.applyLocation(site,null,Number(m?.searchGen||0),{analyzeNow:false,preserveMapView:false});
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(mp?.jumpTo)mp.jumpTo({center:[t.lng,t.lat],zoom:16.78,bearing:0,pitch:0});
    window.earthlineSetPropertyTarget16201({lng:t.lng,lat:t.lat,source:'blue-invariant-17411',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
    return {ok:!!ok,searchGen:Number(((typeof M!=='undefined'&&M)||window.M||{}).searchGen||0)};
  },TARGET);
  await page.waitForTimeout(1200);
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
await browser.close();

const styleKey=v=>JSON.stringify(v);
const fallbackZero=r=>Object.values(r.style.safe).every(x=>Number(x.opacity)===0);
const naturalReady=r=>r.style.images.up&&r.style.images.flip&&r.sourceFeatures>0&&r.textureAudit?.imagesReady===true;
const propertyOk=r=>!r.callError&&r.audit?.settled===true&&r.audit?.result===true;
const sameStyle=styleKey(first.style)===styleKey(second.style);
const pass=propertyOk(first)&&propertyOk(second)&&naturalReady(first)&&naturalReady(second)&&fallbackZero(first)&&fallbackZero(second)&&sameStyle;
console.log('EARTHLINE_BLUE_INVARIANT_17411 '+JSON.stringify({browser:BROWSER,pass,sameStyle,firstFallbackZero:fallbackZero(first),secondFallbackZero:fallbackZero(second),firstNaturalReady:naturalReady(first),secondNaturalReady:naturalReady(second),first,second,errors}));
if(!pass)process.exitCode=1;
