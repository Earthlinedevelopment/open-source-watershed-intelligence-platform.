import { chromium } from 'playwright';

const BASE='https://earthlinedevelopment.org/';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));

async function waitFor17133(){
  for(let i=0;i<30;i++){
    const ok=await page.request.get(BASE+'earthline-launch-16872.js?probe17133='+Date.now(),{timeout:15000}).then(async r=>(await r.text()).includes('EARTHLINE 17133')).catch(()=>false);
    if(ok)return true;
    await sleep(10000);
  }
  return false;
}

if(!await waitFor17133())throw new Error('17133 not live after deployment wait');

await page.goto(BASE+'?live17133='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
await page.waitForTimeout(1200);

await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  if(!i||!b)throw new Error('regional search controls missing');
  i.value='California';
  i.dispatchEvent(new Event('input',{bubbles:true}));
  i.dispatchEvent(new Event('change',{bubbles:true}));
  b.click();
});
await page.waitForFunction(()=>{
  const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
  const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
  return !!err||/screening published\./i.test(s);
},{timeout:45000,polling:150});
await page.waitForTimeout(700);

const regional=await page.evaluate(()=>({
  error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
  status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
  tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
  hitCount:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').length,
  overlayCount:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-raw-index],#earthlineRegionalVectorOverlay16020 path').length
}));
if(regional.error)throw new Error('regional error '+JSON.stringify(regional.error));
if(!/screening published\./i.test(regional.status))throw new Error('regional not published');

let opened=false;
const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
if(await hit.count()){
  try{await hit.click({force:true,timeout:10000});opened=true;}catch(_){}
}
if(!opened){
  opened=await page.evaluate(()=>{
    const fn=window.earthlineOpenCorridorDetail16149;
    const candidates=[
      window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970?.features,
      window.EARTHLINE_DISPLAYED_RUN_16151?.features,
      window.EARTHLINE_DISPLAYED_RUN_16147?.features
    ];
    let f=null;
    for(const xs of candidates){if(Array.isArray(xs)&&xs.length){f=xs[0];break}}
    if(typeof fn==='function'&&f){fn(f,0);return true}
    return false;
  });
}
await page.waitForTimeout(500);

const buttonsBefore=await page.locator('button:visible').allTextContents();
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count()))throw new Error('Zoom to this location button missing; visible buttons='+JSON.stringify(buttonsBefore.slice(-30)));
await zoom.click({force:true});
await page.waitForTimeout(1400);

const afterZoom=await page.evaluate(()=>{
  const b=document.getElementById('earthlineDeclareProperty16169');
  const rect=b?.getBoundingClientRect();
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  return {
    propertyButton: b?{
      html:b.innerHTML,
      text:String(b.textContent||'').replace(/\s+/g,' ').trim(),
      disabled:!!b.disabled,
      ariaDisabled:b.getAttribute('aria-disabled'),
      display:getComputedStyle(b).display,
      visibility:getComputedStyle(b).visibility,
      width:rect?.width||0,height:rect?.height||0,
      orb:!!b.querySelector('.earthline-orb-shell-16244'),
      svgCount:b.querySelectorAll('svg').length,
      iconCount:b.querySelectorAll('i').length
    }:null,
    tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
    propState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    center:m?.getCenter?.()?{lng:m.getCenter().lng,lat:m.getCenter().lat}:null
  };
});
if(!afterZoom.propertyButton)throw new Error('Property button missing after Zoom');
if(afterZoom.propertyButton.disabled||afterZoom.propertyButton.ariaDisabled==='true')throw new Error('Property button disabled after Zoom '+JSON.stringify(afterZoom));
if(afterZoom.propertyButton.display==='none'||afterZoom.propertyButton.visibility==='hidden'||afterZoom.propertyButton.width<20||afterZoom.propertyButton.height<20)throw new Error('Property button not visible after Zoom '+JSON.stringify(afterZoom));

await page.evaluate(()=>document.getElementById('earthlineDeclareProperty16169')?.click());
await page.waitForFunction(()=>{
  const s=String(document.documentElement.dataset.earthlinePropertyRunState||'');
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
  return s==='settled'||a?.settled===true||a?.result===true;
},{timeout:30000,polling:150}).catch(()=>{});
await page.waitForTimeout(1200);

const samples=[];
for(let n=0;n<10;n++){
  samples.push(await page.evaluate(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const layerRows=(m?.getStyle?.()?.layers||[])
      .filter(l=>/property|swale/i.test(l.id))
      .map(l=>{
        let visibility='visible',opacity=null,width=null;
        try{visibility=m.getLayoutProperty(l.id,'visibility')||'visible'}catch(_){}
        try{
          if(l.type==='line'){opacity=m.getPaintProperty(l.id,'line-opacity');width=m.getPaintProperty(l.id,'line-width')}
          else if(l.type==='fill')opacity=m.getPaintProperty(l.id,'fill-opacity');
          else if(l.type==='circle')opacity=m.getPaintProperty(l.id,'circle-opacity');
          else if(l.type==='symbol')opacity=m.getPaintProperty(l.id,'icon-opacity');
        }catch(_){}
        return {id:l.id,type:l.type,visibility,opacity,width};
      });
    const cross=[...document.querySelectorAll('[id*="crosshair" i],[class*="crosshair" i],[data-crosshair16247]')].map(el=>({
      tag:el.tagName,id:el.id||'',class:el.className?.baseVal||el.className||'',
      data:el.getAttribute?.('data-crosshair16247'),
      text:String(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,120),
      before:getComputedStyle(el,'::before').content,
      after:getComputedStyle(el,'::after').content,
      display:getComputedStyle(el).display,
      visibility:getComputedStyle(el).visibility,
      opacity:getComputedStyle(el).opacity
    }));
    return {
      t:Date.now(),
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
      propState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
      layers:layerRows,
      crosshair:cross,
      propertyButton:document.getElementById('earthlineDeclareProperty16169')?.outerHTML||null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      safeFallback:window.EARTHLINE_PROPERTY_SAFE_FALLBACK_AUDIT_16221||window.EARTHLINE_PROPERTY_SAFE_FALLBACK_16221||null,
      texture:window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16174||null
    };
  }));
  await page.waitForTimeout(2000);
}
console.log('EARTHLINE_17133_SAMPLES '+JSON.stringify(samples,null,2));

const property=await page.evaluate(()=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const ids=[
    'earthline-property-swale-ditch-16166',
    'earthline-property-safe-water-16221'
  ];
  const layers={};
  for(const id of ids){
    const layer=m?.getLayer?.(id);
    layers[id]=layer?{
      visibility:m.getLayoutProperty(id,'visibility')||'visible',
      opacity:(()=>{try{return m.getPaintProperty(id,'line-opacity')}catch(_){return null}})()
    }:null;
  }
  const sourceIds=['earthline-property-swales-16166','earthline-property-safe-swales-16221','earthline-property-safe-source-16221'];
  const sources={};
  for(const id of sourceIds){
    const src=m?.getSource?.(id);
    if(src){
      let d=src._data;
      try{if((!d||typeof d==='string')&&typeof src.serialize==='function')d=src.serialize()?.data}catch(_){}
      sources[id]={featureCount:Array.isArray(d?.features)?d.features.length:null,type:typeof d};
    }
  }
  const allStyle=(m?.getStyle?.()?.sources)||{};
  for(const [id,def] of Object.entries(allStyle)){
    if(/property|swale/i.test(id)&&!sources[id]){
      const src=m?.getSource?.(id);let d=src?._data;
      try{if((!d||typeof d==='string')&&typeof src?.serialize==='function')d=src.serialize()?.data}catch(_){}
      sources[id]={featureCount:Array.isArray(d?.features)?d.features.length:null};
    }
  }
  return {
    tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
    propState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    runAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    safeCount:Number(window.M?.authoritativeSafeSwales15815?.length||globalThis.M?.authoritativeSafeSwales15815?.length||0),
    renderer:window.earthlineApplyRendererOwnership15805?true:false,
    layers,sources,
    elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
    button:document.getElementById('earthlineDeclareProperty16169')?.innerHTML||null
  };
});

console.log('EARTHLINE_17133_LIVE '+JSON.stringify({regional,afterZoom,property,errors},null,2));

const sourcePositive=Object.values(property.sources).some(x=>Number(x?.featureCount)>0);
const swaleVisible=Object.values(property.layers).some(x=>x&&x.visibility!=='none'&&x.visibility!=='hidden');
if(errors.length)throw new Error('page errors '+JSON.stringify(errors));
if(!/property/i.test(property.tier))throw new Error('Property tier not published '+JSON.stringify(property));
if(!sourcePositive)throw new Error('No Property swale source features '+JSON.stringify(property.sources));
if(!swaleVisible)throw new Error('No Property swale layer visible '+JSON.stringify(property.layers));
const finalSample=samples[samples.length-1]||{};
const rendered=Array.isArray(finalSample.layers)&&finalSample.layers.some(l=>{
  const vis=l&&l.visibility!=='none'&&l.visibility!=='hidden';
  const op=typeof l?.opacity==='number'?l.opacity:1;
  return vis&&op>0.01&&/property|swale/i.test(l.id||'');
});
if(!rendered)throw new Error('No actually rendered Property swale layer after 18s '+JSON.stringify(finalSample.layers));
const elderAt=Date.parse(finalSample.elder?.at||0);
const propertyStarted=Date.parse(property.runAudit?.startedAt||0);
if(!(elderAt>=propertyStarted))throw new Error('Elder did not refresh after Property publication '+JSON.stringify(finalSample.elder));


await browser.close();
