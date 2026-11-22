import {chromium,webkit} from 'playwright';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const profile=process.env.EARTHLINE_PROFILE||'chrome';
const engine=profile==='safari'?webkit:chromium;
const browser=await engine.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1800,height:820}});
const page=await ctx.newPage();
const pinned=readFileSync('index.html');
await ctx.route('**/*',route=>{let u;try{u=new URL(route.request().url())}catch(_){return route.continue()};if(u.origin==='https://earthlinedevelopment.org'&&(u.pathname==='/'||u.pathname==='/index.html')&&route.request().resourceType()==='document')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:pinned});return route.continue()});
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
      engineVerified:eng?.verified,engineCount:eng?.engineSwales,engineHash:eng?.determinismHash,
      safeLayers:layerInfo.filter(x=>/safe.*16221/.test(x.id)),
      naturalLayers:layerInfo.filter(x=>/natural|neutral-16177/.test(x.id)),
      totalRendered:layerInfo.reduce((n,x)=>n+(x.rendered>0?x.rendered:0),0),
      propertyAudit:{stage:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.stage,renderMode:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.renderMode},propertySafety:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null
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
    if(!near(result.center)||!near(result.target)||!result.engineVerified||!(result.engineCount>0)||
       !result.swalesLayerOn||!result.totalRendered||result.safeLayers.filter(l=>l.rendered>0).length<4)
      throw Error('RENDER OR TARGET BAD ON RUN '+n+' '+JSON.stringify(result));
  }
  const a=records.find(x=>x.label==='property-result-1')?.data,b=records.find(x=>x.label==='property-result-2')?.data;
  if(!a||!b||a.engineHash!==b.engineHash||a.engineCount!==b.engineCount)throw Error('ENGINE RESULTS DIFFER');
  console.log('EARTHLINE_REAL_DRAG_PATH_PASS '+profile);
}catch(e){
  problems.push('TEST FAILED '+String(e));
  await page.screenshot({path:out+'/failure.png'}).catch(()=>{});
  throw e;
}finally{
  writeFileSync(out+'/results.json',JSON.stringify({profile,records,problems},null,2));
  await browser.close();
}
