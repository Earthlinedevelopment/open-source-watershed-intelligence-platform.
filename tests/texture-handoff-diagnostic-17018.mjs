import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/?texturediag='+Date.now();
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
});
await page.waitForFunction(()=>Number(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated||0)>0,{timeout:60000,polling:100});
const target=await page.evaluate(()=>{
  const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
  const f=[...sw].sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999))[0];
  if(!f)return null;
  const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
  return {lng:Number(c[0]),lat:Number(c[1]),source:'texture-diag',code:String(f.properties?.display_code||f.properties?.grade||''),score:Number(f.properties?.score||0),query:'Vermont',parentRunToken:String(window.EARTHLINE_DISPLAYED_RUN_16151?.runToken||'')};
});
if(!target)throw new Error('no target');
await page.evaluate(async t=>{
  window.EARTHLINE_PROPERTY_TARGET_16201=t;
  if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(t);
  await Promise.resolve(window.earthlineDeclarePropertyAtCrosshair16173());
},target);
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:60000,polling:100});
await page.waitForTimeout(5000);
const out=await page.evaluate(()=>{
  const fn=n=>{try{return typeof window[n]==='function'?String(window[n]):null}catch(_){return null}};
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const sourceIds=['earthline-property-swale-natural-16174','earthline-property-safe-16221'];
  const sources={};
  for(const id of sourceIds){
    try{
      const s=m?.getSource?.(id);
      sources[id]={exists:!!s,data:s?._data||null,features:Array.isArray(s?._data?.features)?s._data.features.length:null};
    }catch(e){sources[id]={error:String(e)}}
  }
  const ids=(m?.getStyle?.().layers||[]).map(x=>x.id).filter(id=>/property-swale-natural|property-safe/i.test(id));
  const layers=ids.map(id=>{
    try{
      return {id,visibility:m.getLayoutProperty(id,'visibility'),opacity:m.getPaintProperty(id,'line-opacity'),width:m.getPaintProperty(id,'line-width')};
    }catch(e){return {id,error:String(e)}}
  });
  return {
    target,
    publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
    run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    textureAudit:typeof window.earthlinePropertyTextureAudit16169==='function'?window.earthlinePropertyTextureAudit16169():window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null,
    textureSyncSource:fn('earthlineSyncPropertyTexture16169'),
    textureAuditSource:fn('earthlinePropertyTextureAudit16169'),
    safeSyncSource:fn('syncSafePropertyFallback16221'),
    authoritativeSafeCount:Array.isArray(window.M?.authoritativeSafeSwales15815)?window.M.authoritativeSafeSwales15815.length:null,
    authoritativeRawCount:Array.isArray(window.M?.authoritativePropertySwales15800)?window.M.authoritativePropertySwales15800.length:null,
    sources,layers
  };
});
console.log('EARTHLINE_TEXTURE_HANDOFF_DIAG '+JSON.stringify(out));
await browser.close();