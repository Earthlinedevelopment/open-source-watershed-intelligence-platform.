import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1798,height:830}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(1800);

async function regional(){
  await page.locator('#searchInput').fill('Arizona');
  await page.locator('#runBtn').click();
  await page.waitForFunction(()=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return String(d?.tier||d?.mode||'').toLowerCase()==='regional'&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},{timeout:120000});
}
async function property(lat,lng){
  await page.evaluate(({lat,lng})=>{
    if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201({lat,lng,source:'mantra83-accuracy-test'},{openPanel:true});
    else window.EARTHLINE_PROPERTY_TARGET_16201={lat,lng,source:'mantra83-accuracy-test'};
  },{lat,lng});
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.evaluate(async()=>{
    if(typeof window.earthlineDeclarePropertyAtCrosshair16173==='function')return await window.earthlineDeclarePropertyAtCrosshair16173();
    const b=document.getElementById('earthlineDeclareProperty16169');if(b)b.click();
  });
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return String(d?.tier||d?.mode||'').toLowerCase()==='property'&&String(d?.runToken||'')!==String(prev||'');
  },before,{timeout:180000});
  await page.waitForTimeout(1200);
  return await page.evaluate(({lat,lng})=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const m=(typeof M!=='undefined'&&M)||window.M||null;
    const safeRaw=m?.authoritativeSafeSwales15815??m?.swales??[];
    const safe=Array.isArray(safeRaw)?safeRaw:Array.isArray(safeRaw?.features)?safeRaw.features:Array.isArray(safeRaw?.segments)?safeRaw.segments:[];
    let maxSlope=-Infinity,minSlope=Infinity;
    const slopeFields={};
    for(const sw of safe){
      const p=sw?.properties||sw||{};
      for(const [k,v] of Object.entries(p)){
        if(!/slope/i.test(k))continue;const n=Number(v);if(!Number.isFinite(n))continue;
        slopeFields[k]=Math.max(slopeFields[k]??-Infinity,n);maxSlope=Math.max(maxSlope,n);minSlope=Math.min(minSlope,n);
      }
    }
    const elderKeys=Object.keys(m||{}).filter(k=>/elder/i.test(k));
    const elderState={};for(const k of elderKeys){const v=m[k];elderState[k]=Array.isArray(v)?{type:'array',length:v.length}:v&&typeof v==='object'?{type:'object',keys:Object.keys(v).slice(0,20)}:v;}
    const globals=Object.keys(window).filter(k=>/elder/i.test(k)).slice(0,80);
    const globalState={};for(const k of globals){try{const v=window[k];globalState[k]=Array.isArray(v)?{type:'array',length:v.length}:v&&typeof v==='object'?{type:'object',keys:Object.keys(v).slice(0,15)}:typeof v;}catch(_){}}
    const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return {
      requested:{lat,lng},displayed:d?{runToken:d.runToken,tier:d.tier||d.mode,query:d.query}:null,
      target:target?{lat:Number(target.lat),lng:Number(target.lng),source:target.source,code:target.code}:null,
      model:{centerLat:Number(m?.centerLat),centerLng:Number(m?.centerLng),swales:Array.isArray(m?.swales)?m.swales.length:null,safe:safe.length},
      slopes:{max:Number.isFinite(maxSlope)?maxSlope:null,min:Number.isFinite(minSlope)?minSlope:null,fields:slopeFields},
      elderState,globalState,
      pub:m?.propertyPublication15816||window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      errors:[]
    };
  },{lat,lng});
}
await regional();
const rows=[];
for(const p of [[34.21568,-111.93067],[34.21300,-111.94471]])rows.push(await property(p[0],p[1]));
console.log('M83_ARIZONA_PROPERTY '+JSON.stringify({rows,errors:errors.slice(0,30)}));
await browser.close();