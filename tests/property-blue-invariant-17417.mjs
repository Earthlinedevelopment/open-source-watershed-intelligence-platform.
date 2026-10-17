import { chromium, firefox, webkit } from 'playwright';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
await page.goto(BASE+'?blue17417='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForFunction(()=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  return !!mp&&typeof window.earthlineSyncPropertyTexture16169==='function'&&(!mp.isStyleLoaded||mp.isStyleLoaded());
},null,{timeout:30000,polling:100});

const fixture=await page.evaluate(async()=>{
  try{
    const m=(typeof M!=='undefined'?M:null),s=window.earthlineRegional15778||(window.earthlineRegional15778={});
    if(!m)return {ok:false,error:'model unavailable'};
    s.mode='property';s.active=false;m.analysisReady=true;
    m.propertyResultLock15815={safetyVerified:true};
    m.safetyAudit15806={verified:true};
    m.authoritativeSafeSwales15815={type:'FeatureCollection',features:[{
      type:'Feature',id:'blue-17417',
      properties:{rawIndex:17417},
      geometry:{type:'LineString',coordinates:[[-72.5780,44.2600],[-72.5768,44.2604],[-72.5758,44.2608]]}
    }]};
    window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221={count:1,visible:true};
    await window.earthlineSyncPropertyTexture16169('blue-17417-first');
    await new Promise(r=>setTimeout(r,500));
    await window.earthlineSyncPropertyTexture16169('blue-17417-first-settle');
    return {ok:true};
  }catch(e){return {ok:false,error:String(e)}}
});
const snap=()=>page.evaluate(()=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const get=(id,p)=>{try{return mp?.getLayer?.(id)?mp.getPaintProperty(id,p):null}catch(_){return null}};
  return {
    casing:{opacity:get('earthline-property-swale-natural-casing-16174','line-opacity'),width:get('earthline-property-swale-natural-casing-16174','line-width'),color:get('earthline-property-swale-natural-casing-16174','line-color')},
    up:{opacity:get('earthline-property-swale-natural-up-16174','line-opacity'),width:get('earthline-property-swale-natural-up-16174','line-width'),pattern:get('earthline-property-swale-natural-up-16174','line-pattern')},
    flip:{opacity:get('earthline-property-swale-natural-flip-16174','line-opacity'),width:get('earthline-property-swale-natural-flip-16174','line-width'),pattern:get('earthline-property-swale-natural-flip-16174','line-pattern')},
    neutral:{opacity:get('earthline-property-swale-neutral-16177','line-opacity'),width:get('earthline-property-swale-neutral-16177','line-width'),color:get('earthline-property-swale-neutral-16177','line-color')},
    safeWater:get('earthline-property-safe-water-16221','line-opacity')
  };
});
const first=await snap();
await page.evaluate(()=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const edits=[
    ['earthline-property-swale-natural-casing-16174','line-opacity',.12],
    ['earthline-property-swale-natural-casing-16174','line-width',7],
    ['earthline-property-swale-natural-up-16174','line-opacity',.18],
    ['earthline-property-swale-natural-up-16174','line-width',8],
    ['earthline-property-swale-natural-flip-16174','line-opacity',.21],
    ['earthline-property-swale-neutral-16177','line-opacity',.25],
    ['earthline-property-safe-water-16221','line-opacity',.98]
  ];
  for(const [id,p,v] of edits)try{if(mp?.getLayer?.(id))mp.setPaintProperty(id,p,v)}catch(_){}
});
await page.evaluate(async()=>{
  await window.earthlineSyncPropertyTexture16169('blue-17417-repeat');
  await new Promise(r=>setTimeout(r,500));
  await window.earthlineSyncPropertyTexture16169('blue-17417-repeat-settle');
});
const second=await snap();
await browser.close();
const same=JSON.stringify(first)===JSON.stringify(second);
const expected=first.casing.opacity===0.64&&first.up.opacity===0.72&&first.flip.opacity===0.72&&first.neutral.opacity===0.66&&
  Number(first.casing.width)>0&&Number(first.up.width)>0&&Number(first.flip.width)>0&&Number(first.neutral.width)>0&&
  !!first.up.pattern&&!!first.flip.pattern&&(first.safeWater===0||first.safeWater===null);
const pass=fixture.ok&&same&&expected;
console.log('EARTHLINE_BLUE_INVARIANT_17417 '+JSON.stringify({browser:BROWSER,pass,fixture,same,expected,first,second}));
if(!pass)process.exitCode=1;
