import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE='http://127.0.0.1:8787/';
const CASES=[
  {name:'Arizona A',lat:33.52510,lng:-114.07282},
  {name:'Arizona B',lat:33.52488,lng:-114.07825}
];
const PRODUCT_SHA='3e98ef1dd1c0071a744f8b809efaf8a200ba0b7c';
const browser=await chromium.launch({headless:true});
const rows=[];

function tortuosity(coords){
  if(!Array.isArray(coords)||coords.length<2)return Infinity;
  const lat0=coords.reduce((s,p)=>s+Number(p?.[1]||0),0)/coords.length;
  const kx=111320*Math.cos(lat0*Math.PI/180),ky=111320;
  let len=0;
  for(let i=1;i<coords.length;i++){
    const a=coords[i-1],b=coords[i];
    len+=Math.hypot((b[0]-a[0])*kx,(b[1]-a[1])*ky);
  }
  const a=coords[0],b=coords[coords.length-1];
  const chord=Math.hypot((b[0]-a[0])*kx,(b[1]-a[1])*ky);
  return len/Math.max(1,chord);
}

for(let ci=0;ci<CASES.length;ci++){
  const c=CASES[ci];
  const context=await browser.newContext({viewport:{width:1600,height:1000}});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  await page.route('https://api.mapbox.com/**',async route=>{
    const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
    await route.continue({headers});
  });
  let row={name:c.name,lat:c.lat,lng:c.lng,productSha:PRODUCT_SHA,pass:false,failures:[]};
  try{
    await page.goto(BASE+'?m76-swale='+ci+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});

    await page.evaluate(({lat,lng})=>{
      const query=lat.toFixed(5)+', '+lng.toFixed(5);
      if(typeof M==='undefined'||!M)throw new Error('Earthline model unavailable');
      const loc={name:'Arizona validation',fullName:query,query,sub:'M76 exact Arizona validation point',area:'20 acres',countryCode:'us',placeType:'point',lat,lng};
      M.loc=loc; M.centerLat=lat; M.centerLng=lng; M.appliedSearchText=query;
      const input=document.getElementById('searchInput'); if(input)input.value=query;
    },c);

    await page.locator('#runBtn').click({force:true});
    await page.waitForFunction(()=>{
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      if(err)return true;
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
      return tier==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
    },null,{timeout:90000,polling:150});
    const regionalErr=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
    if(regionalErr)throw new Error('regional failed '+JSON.stringify(regionalErr));

    await page.evaluate(({lat,lng})=>{
      const query=lat.toFixed(5)+', '+lng.toFixed(5);
      const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      M.loc=Object.assign({},M.loc||{},{name:'Arizona validation',fullName:query,query,area:'20 acres',countryCode:'us',placeType:'point',lat,lng});
      M.centerLat=lat;M.centerLng=lng;M.appliedSearchText=query;
      window.EARTHLINE_PROPERTY_TARGET_16201={lat,lng,source:'m76-exact-arizona',at:new Date().toISOString()};
      if(window.earthlineRegional15778){window.earthlineRegional15778.active=false;window.earthlineRegional15778.mode='focus';}
      mp?.stop?.();mp?.jumpTo?.({center:[lng,lat],zoom:18});
    },c);
    await page.waitForTimeout(500);

    const invoke=await page.evaluate(async()=>{
      const fn=window.earthlineDeclarePropertyAtCrosshair16169||window.earthlineDeclarePropertyAtCrosshair16173;
      if(typeof fn!=='function')return {called:false,error:'direct Property declaration owner unavailable'};
      try{return {called:true,result:await Promise.resolve(fn())}}catch(e){return {called:true,error:String(e?.message||e)}}
    });
    if(!invoke.called||invoke.error)throw new Error('Property invocation failed '+JSON.stringify(invoke));

    await page.waitForFunction(()=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
      const runState=String(document.documentElement.dataset.earthlinePropertyRunState||'').toLowerCase();
      const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      return tier==='property'&&runState!=='running'&&audit?.settled===true;
    },null,{timeout:65000,polling:150});

    await page.waitForFunction(()=>{
      const a=window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null;
      return !!(a&&a.sourceReady===true&&a.imagesReady===true&&Number(a.centerlines||0)>0);
    },null,{timeout:25000,polling:150}).catch(()=>{});
    await page.waitForTimeout(5000);

    const snap=await page.evaluate(()=>{
      const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const ra=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      const pa=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
      const sv=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;
      const ta=window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null;
      const fc=(typeof M!=='undefined'&&M?.authoritativeSafeSwales15815)||null;
      const natural=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177'];
      const safe=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
      const old=['earthline-living-swales-glow-15792','earthline-living-swales-earth-15792','earthline-living-swales-life-15792','earthline-living-swales-water-15792'];
      const layer=(id)=>{
        try{
          if(!mp?.getLayer?.(id))return {id,exists:false};
          const spec=(mp.getStyle?.()?.layers||[]).find(x=>x.id===id)||{};
          const paint=spec.paint||{},layout=spec.layout||{};
          return {id,exists:true,visibility:layout.visibility||'visible',
            lineColor:paint['line-color']??null,
            lineOpacity:paint['line-opacity']??null,
            lineWidth:paint['line-width']??null,
            fillColor:paint['fill-color']??null,
            fillOpacity:paint['fill-opacity']??null,
            linePattern:paint['line-pattern']??null,
            circleColor:paint['circle-color']??null,
            circleOpacity:paint['circle-opacity']??null};
        }catch(e){return {id,exists:true,error:String(e?.message||e)}}
      };
      const canvas=mp?.getCanvas?.(),box=canvas&&[[0,0],[canvas.clientWidth||canvas.width,canvas.clientHeight||canvas.height]];
      let renderedNatural=0;
      try{
        const ids=natural.filter(id=>mp?.getLayer?.(id)&&mp.getLayoutProperty?.(id,'visibility')!=='none');
        if(box&&ids.length)renderedNatural=(mp.queryRenderedFeatures?.(box,{layers:ids})||[]).length;
      }catch(_){}
      const plantId='earthline-swale-planting-layer-15806';
      let renderedPlanting=0;
      try{if(box&&mp?.getLayer?.(plantId)&&mp.getLayoutProperty?.(plantId,'visibility')!=='none')renderedPlanting=(mp.queryRenderedFeatures?.(box,{layers:[plantId]})||[]).length}catch(_){}
      return {
        tier:String(d&&(d.tier||d.mode)||'').toLowerCase(),
        run:ra,publication:pa,safeAudit:sv,textureAudit:ta,
        finalFC:fc&&fc.type==='FeatureCollection'?fc:null,
        natural:natural.map(layer),safe:safe.map(layer),old:old.map(layer),
        planting:layer(plantId),renderedNatural,renderedPlanting,
        searchGen:Number((typeof M!=='undefined'&&M?.searchGen)||0)
      };
    });

    const features=snap.finalFC?.features||[];
    const ratios=features.map((f,i)=>({i,t:tortuosity(f?.geometry?.coordinates||[])})).filter(x=>Number.isFinite(x.t));
    const maxT=ratios.length?Math.max(...ratios.map(x=>x.t)):Infinity;
    const naturalVisible=snap.natural.filter(x=>x.exists&&x.visibility!=='none');
    const safeVisible=snap.safe.filter(x=>x.exists&&x.visibility!=='none'&&Number(x.lineOpacity??0)>0.01);
    const oldVisible=snap.old.filter(x=>x.exists&&x.visibility!=='none'&&Number(x.lineOpacity??1)>0.01);
    const casing=snap.natural.find(x=>x.id==='earthline-property-swale-natural-casing-16174');
    const footprint=snap.natural.find(x=>x.id==='earthline-property-swale-footprint-16174');
    const neutral=snap.natural.find(x=>x.id==='earthline-property-swale-neutral-16177');
    const patterned=snap.natural.filter(x=>/natural-(up|flip)-16174$/.test(x.id)&&x.exists&&x.visibility!=='none');

    const failures=[];
    if(snap.tier!=='property'||snap.run?.settled!==true||snap.run?.result!==true)failures.push('Property did not settle successfully');
    if(!features.length)failures.push('no authoritative safe swales published');
    if(maxT>1.57)failures.push('final published swale tortuosity exceeds M76 guard: '+maxT.toFixed(3));
    if(snap.renderedNatural<1)failures.push('natural swale renderer has no rendered features');
    if(naturalVisible.length<3)failures.push('natural swale layer set not visibly owned');
    if(safeVisible.length)failures.push('safe fallback remains visibly over natural renderer: '+safeVisible.map(x=>x.id).join(','));
    if(oldVisible.length)failures.push('legacy living swale layers remain visible: '+oldVisible.map(x=>x.id).join(','));
    if(String(casing?.lineColor||'').toLowerCase()!=='#6b4d32')failures.push('brown casing color not authoritative');
    if(String(footprint?.fillColor||'').toLowerCase()!=='#6f5137')failures.push('brown footprint color not authoritative');
    if(String(neutral?.lineColor||'').toLowerCase()!=='#5f985c')failures.push('green neutral swale color not authoritative');
    if(patterned.length<2)failures.push('natural patterned swale layers missing');
    if(pageErrors.length)failures.push('page errors: '+pageErrors.join(' | '));

    const shot='m76-arizona-'+(ci+1)+'.png';
    await page.screenshot({path:shot,fullPage:false});
    row={...row,pass:failures.length===0,failures,corridors:features.length,maxTortuosity:maxT,ratios:ratios.slice(0,30),
      renderedNatural:snap.renderedNatural,renderedPlanting:snap.renderedPlanting,
      natural:snap.natural,safe:snap.safe,old:snap.old,planting:snap.planting,
      textureAudit:snap.textureAudit,safeAudit:snap.safeAudit,run:snap.run,publication:snap.publication,
      screenshot:shot,pageErrors};
  }catch(e){
    row.failures.push(String(e?.message||e));
    try{await page.screenshot({path:'m76-arizona-'+(ci+1)+'-failure.png',fullPage:false})}catch(_){}
  }finally{
    rows.push(row);
    console.log('EARTHLINE_M76_SWALE_CASE '+JSON.stringify(row));
    await context.close();
  }
}
await browser.close();
const out={at:new Date().toISOString(),productSha:PRODUCT_SHA,total:rows.length,passed:rows.filter(r=>r.pass).length,pass:rows.every(r=>r.pass),rows};
fs.writeFileSync('m76-swale-validation.json',JSON.stringify(out,null,2));
console.log('EARTHLINE_M76_SWALE_SUMMARY '+JSON.stringify({productSha:PRODUCT_SHA,total:out.total,passed:out.passed,pass:out.pass,failed:rows.filter(r=>!r.pass).map(r=>({name:r.name,failures:r.failures}))}));
if(!out.pass)process.exitCode=1;
