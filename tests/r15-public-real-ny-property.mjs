import {chromium,webkit} from 'playwright';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const profile=process.env.EARTHLINE_PROFILE||'chrome';
const engine=profile==='safari'?webkit:chromium;
const browser=await engine.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1800,height:820}});
const page=await ctx.newPage();
const pinned=readFileSync('index.html');
if(process.env.EARTHLINE_LIVE!=='1')await ctx.route('**/*',route=>{let u;try{u=new URL(route.request().url())}catch(_){return route.continue()};if(u.origin==='https://earthlinedevelopment.org'&&u.pathname.endsWith('/earthline-usfs-canopy-r15.js'))return route.fulfill({status:200,contentType:'application/javascript',body:readFileSync('earthline-usfs-canopy-r15.js')});if(u.origin==='https://earthlinedevelopment.org'&&u.pathname.endsWith('/earthline-property-swales.js'))return route.fulfill({status:200,contentType:'application/javascript',body:readFileSync('earthline-property-swales.js')});if(u.origin==='https://earthlinedevelopment.org'&&(u.pathname==='/'||u.pathname==='/index.html')&&route.request().resourceType()==='document')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:pinned});return route.continue()});
const out='founder-regression/'+profile;mkdirSync(out,{recursive:true});
const problems=[],records=[];
page.on('pageerror',e=>problems.push('PAGE: '+String(e)));
page.on('console',m=>{if(m.type()==='error')problems.push('CONSOLE: '+m.text().slice(0,220))});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function info(label){
  const data=await page.evaluate(()=>{
    const d=document.documentElement;
    const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
    const m=(typeof M!=='undefined'&&M)||window.M;
    const eng=window.__EARTHLINE_SWALE_ENGINE_HOOK_16600?.result?.();
    const t=window.EARTHLINE_PROPERTY_TARGET_16201;
    const ids=(map?.getStyle?.()?.layers||[]).filter(l=>/swale|bioswale|corridor/i.test(l.id));
    const layerInfo=ids.map(l=>{
      let rendered=-1;try{rendered=map.queryRenderedFeatures({layers:[l.id]}).length}catch(_){}
      let visibility='?';try{visibility=map.getLayoutProperty(l.id,'visibility')||'visible'}catch(_){}
      let opacity=null;try{opacity=map.getPaintProperty(l.id,l.type==='line'?'line-opacity':l.type==='fill'?'fill-opacity':'circle-opacity')}catch(_){}
      return {id:l.id,rendered,visibility,opacity};
    });
    const center=map?.getCenter?.();
    return {tier:d.dataset.earthlineAnalysisTier,propertyState:d.dataset.earthlinePropertyRunState,regionalState:d.dataset.earthlineRunState,
      center:center?{lat:center.lat,lng:center.lng}:null,
      target:t?{lat:t.lat,lng:t.lng,source:t.source,code:t.code}:null,
      modelCenter:m?{lat:m.centerLat,lng:m.centerLng}:null,
      location:m?.loc?.name||null,
      analysisReady:!!m?.analysisReady,modelSwales:m?.swales?.length,
      swalesLayerOn:m?.layers?.swales?.on,
      engineVerified:eng?.verified,engineCount:eng?.engineSwales,engineHash:eng?.determinismHash,engineVersion:eng?.engineVersion,engineMessage:eng?.message,canopyEvidence:eng?.evidence?.canopy||null,canopyProvenance:eng?.evidence?.canopyProvenance||null,
      forestOverlap:(()=>{
        const c=m?.propertySwaleEngineContext16600,l=c?.landcover;
        if(!l||!c?.frame||!eng?.features)return null;
        const w=c.params?.grid?.[0],h=c.params?.grid?.[1];
        if(!w||!h)return null;
        let samples=0,hits=0;
        for(const ft of eng.features){
          if(!ft?.geometry?.coordinates)continue;
          const coords=ft.geometry.type==='LineString'?ft.geometry.coordinates:ft.geometry.type==='MultiLineString'?ft.geometry.coordinates.flat():[];
          for(let k=1;k<coords.length;k++){
            const a=coords[k-1],b=coords[k],steps=Math.max(1,Math.ceil(Math.hypot((a[0]-b[0])*82000,(a[1]-b[1])*111111)/2));
            for(let t=0;t<=steps;t++){
              const p=[a[0]+(b[0]-a[0])*t/steps,a[1]+(b[1]-a[1])*t/steps];
              const g=c.frame.toGrid(p[0],p[1]),x=Math.round(g[0]),y=Math.round(g[1]);
              if(x<0||x>=w||y<0||y>=h)continue;samples++;if(l[y*w+x])hits++;
            }
          }
        }
        return {samples,hits};
      })(),
      safeLayers:['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'].map(id=>{
        const exists=!!map?.getLayer?.(id);let rendered=0,visibility=null,opacity=null;
        if(exists){try{rendered=map.queryRenderedFeatures({layers:[id]}).length}catch(e){rendered=-1}
          try{visibility=map.getLayoutProperty(id,'visibility')||'visible';opacity=map.getPaintProperty(id,'line-opacity')}catch(_){}}
        return {id,exists,rendered,visibility,opacity}
      }),
      naturalLayers:layerInfo.filter(x=>/natural|neutral-16177/.test(x.id)),
      totalRendered:layerInfo.reduce((n,x)=>n+(x.rendered>0?x.rendered:0),0),
      propertyAudit:{stage:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.stage,renderMode:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.renderMode},propertySafety:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
      scientificCoverage:eng?.evidence?.coverage||null,
      scientificRejections:eng?.rejections||null,
      terrainZones:(()=>{
        const c=m?.propertySwaleEngineContext16600,E=window.EarthlinePropertySwales;
        if(!c||!E?._internal?.slopePct)return null;
        const [w,h]=c.params.grid,sp=E._internal.slopePct(c.elev,w,h,c.params.cellM),inside=c.inside;
        const groups={all:[0,0,0,0],middle:[0,0,0,0],north:[0,0,0,0],south:[0,0,0,0],east:[0,0,0,0],west:[0,0,0,0]};
        for(let i=0;i<inside.length;i++){if(!inside[i])continue;
          const x=i%w,y=Math.floor(i/w),rx=x/w,ry=y/h,which=['all'];
          if(rx>.3&&rx<.7&&ry>.3&&ry<.7)which.push('middle');
          if(ry<.35)which.push('north');if(ry>.65)which.push('south');
          if(rx<.35)which.push('west');if(rx>.65)which.push('east');
          for(const g of which){groups[g][0]++;if(sp[i]>4)groups[g][1]++;if(sp[i]<.2)groups[g][2]++;if(c.landcover?.[i])groups[g][3]++;}
        }
        return Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,{inside:v[0],slopeOver4:v[1],slopeUnder0_2:v[2],forest:v[3],slopeOver4Pct:v[0]?Math.round(1000*v[1]/v[0])/10:null}]));
      })()
    };
  });
  records.push({label,data});console.log('EARTHLINE_FOUNDER_REGRESSION '+JSON.stringify({profile,label,...data}));
  return data;
}
try{
  await page.goto('https://earthlinedevelopment.org/?founder_regression=20261122',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{state:'attached',timeout:30000});
  await page.waitForFunction(()=>!!((typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap),null,{timeout:45000});
  await sleep(7000);
  await info('fresh');
  await page.evaluate(()=>{
    const input=document.getElementById('searchInput'),button=document.getElementById('runBtn');
    input.value='NEW YORK state';
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    button.click();
  });
  await sleep(15000);
  await info('after-newyork-regional-search');
  for(let n=1;n<=2;n++){
    await page.evaluate(()=>{
      const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
      // No global lock override: this reflects a visitor navigating the map.
      m.jumpTo({center:[-75.76996,42.78781],zoom:17});
    });
    await sleep(1300);
    // Genuine mouse drag event rather than synthetic map.fire("dragend").
    const canvas=page.locator('.mapboxgl-canvas').first();
    const box=await canvas.boundingBox();
    if(!box)throw Error('map canvas not visible');
    const x=box.x+box.width*0.7,y=box.y+box.height*0.65;
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+3,y+2,{steps:4});await page.mouse.up();
    await sleep(5000);
    await info('before-property-'+n);
    const started=Date.now();let pressed=false;
    while(Date.now()-started<45000){
      const ok=await page.evaluate(()=>{
        const b=document.getElementById('earthlineDeclareProperty16169');
        return !!b&&getComputedStyle(b).display!=='none'&&!b.disabled&&b.getAttribute('aria-disabled')!=='true';
      });
      if(ok){await page.click('#earthlineDeclareProperty16169',{timeout:10000});pressed=true;break}
      await sleep(500);
    }
    if(!pressed)throw Error('Property never offered on run '+n);
    await page.waitForFunction(()=>{
      const d=document.documentElement,m=(typeof M!=='undefined'&&M)||window.M;
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
      return d.dataset.earthlineAnalysisTier==='property'&&m?.analysisReady&&a?.settled&&a?.result;
    },null,{timeout:100000});
    await sleep(2500);
    const result=await info('property-result-'+n);
    await page.screenshot({path:out+'/property-'+n+'.png'});
    const near=point=>point&&Math.abs(point.lat-42.78781)<0.001&&Math.abs(point.lng+75.76996)<0.001;
    if(!near(result.center)||!near(result.target)||!result.engineVerified||
       result.engineVersion!=='1.2.0'||!result.canopyEvidence?.applied||!(result.canopyEvidence?.flaggedCells>0)||!(result.canopyProvenance?.flaggedInside>0)||!result.canopyProvenance?.source?.includes('USDA Forest Service')||result.forestOverlap?.hits>0||
       !(result.engineCount>=0)|| !result.swalesLayerOn||
       (result.engineCount>0&&result.safeLayers.filter(l=>l.exists&&l.visibility!=='none'&&l.rendered>0&&Number(l.opacity)>.8).length<4)||
       (result.engineCount===0&&!/No qualifying swales|R15|tree canopy/i.test(result.engineMessage||'')))
      throw Error('RENDER OR TARGET BAD ON RUN '+n+' '+JSON.stringify(result));
  }
  const a=records.find(x=>x.label==='property-result-1')?.data,b=records.find(x=>x.label==='property-result-2')?.data;
  if(!a||!b||a.engineHash!==b.engineHash||a.engineCount!==b.engineCount)throw Error('ENGINE RESULTS DIFFER');
  console.log('EARTHLINE_R15_FAST_INTEGRATION_PASS '+profile);
}catch(e){
  problems.push('TEST FAILED '+String(e));
  await page.screenshot({path:out+'/failure.png'}).catch(()=>{});
  throw e;
}finally{
  writeFileSync(out+'/results.json',JSON.stringify({profile,records,problems},null,2));
  await browser.close();
}
