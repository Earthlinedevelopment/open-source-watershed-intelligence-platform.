import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true});
const out='visual-swale-audit';
mkdirSync(out,{recursive:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push('PAGE:'+String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE:'+m.text().slice(0,240));});
try{
  await page.goto('https://earthlinedevelopment.org/?earthline_visual_rollback=20261122',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{state:'attached',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap)),{timeout:30000});
  await page.waitForTimeout(8000);
  await page.evaluate(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap);
    window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;
    m.jumpTo({center:[-75.76996,42.78781],zoom:17});
    m.fire('dragend');
  });
  await page.waitForTimeout(5000);
  await page.click('#earthlineDeclareProperty16169',{timeout:20000});
  await page.waitForFunction(()=>Boolean(((typeof M!=='undefined'&&M)||window.M)?.analysisReady&&document.documentElement.dataset.earthlineAnalysisTier==='property'),{timeout:90000});
  await page.waitForTimeout(3500);
  await page.screenshot({path:out+'/newyork-property-after-rollback.png',fullPage:false});
  const state=await page.evaluate(()=>{
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),md=(typeof M!=='undefined'&&M)||window.M||null;
    const style=map?.getStyle?.()||{},layers=(style.layers||[]),c=map.getCenter();
    const getComputed=id=>{const e=document.getElementById(id);if(!e)return null;const z=getComputedStyle(e);return {display:z.display,visibility:z.visibility,opacity:z.opacity,childCount:e.children.length}};
    const srcCount=id=>{try{const src=map.getSource(id);const d=src?._data||(src?.serialize?.().data);return {count:Array.isArray(d?.features)?d.features.length:null,type:d?.type||null};}catch(e){return {err:String(e)}}};
    const swaleLayers=layers.filter(l=>/swale|bioswale|corridor|water|flow|recharge|property-safe/i.test(l.id)).map(l=>{
      let rendered=null,renderError=null,visibility=null;
      try{visibility=map.getLayoutProperty(l.id,'visibility')||'visible';}catch(e){visibility='error:'+String(e)}
      if(l.type==='line'||l.type==='fill'||l.type==='symbol'||l.type==='circle'){
        try{rendered=map.queryRenderedFeatures({layers:[l.id]}).length;}catch(e){renderError=String(e).slice(0,130);}
      }
      return {id:l.id,type:l.type,source:l.source,visibility,rendered,renderError,src:typeof l.source==='string'?srcCount(l.source):null,
         opacityPaint:map.getPaintProperty(l.id,l.type==='line'?'line-opacity':l.type==='fill'?'fill-opacity':l.type==='circle'?'circle-opacity':'text-opacity')};
    });
    const hasSwales=swaleLayers.filter(x=>/swale|bioswale|corridor/i.test(x.id));
    const water=swaleLayers.filter(x=>/water|flow/i.test(x.id));
    return {url:location.href,center:{lng:c.lng,lat:c.lat},zoom:map.getZoom(),tier:document.documentElement.dataset.earthlineAnalysisTier,
      analysisReady:!!md?.analysisReady,internalSwales:md?.swales?.length,
      engineResult:window.__EARTHLINE_SWALE_ENGINE_HOOK_16600?.result?.(),
      swaleLayers:hasSwales,waterLayers:water,hold:window.EARTHLINE_WATERPATH_HOLD||null,
      propertyWaterOverlay:getComputed('earthlinePropertyWaterOverlay15824'),
      interceptionOverlay:getComputed('earthlineInterceptionOverlay15825'),
      mapContainer:getComputed('mapboxBase')
    };
  });
  const summary={
    center:state.center,zoom:state.zoom,tier:state.tier,analysisReady:state.analysisReady,
    internalSwales:state.internalSwales,
    engineVerified:state.engineResult?.verified,
    engineSwales:state.engineResult?.engineSwales,
    publishedSwales:state.engineResult?.publishedSwales,
    swaleLayers:state.swaleLayers,waterLayerCount:state.waterLayers.length,
    hold:state.hold,propertyWaterOverlay:state.propertyWaterOverlay,
    interceptionOverlay:state.interceptionOverlay,errors,
  };
  writeFileSync(out+'/diagnostic.json',JSON.stringify({summary,state},null,2));
  console.log('EARTHLINE_VISUAL_SWALE_ROLLBACK '+JSON.stringify(summary).slice(0,40000));
  if(!state.analysisReady || !state.engineResult?.verified || state.internalSwales!==23 || errors.length)throw Error('Engine state or page errors fail');
  const safeIds=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
  const safe=safeIds.map(id=>state.swaleLayers.find(l=>l.id===id));
  const natural=state.swaleLayers.filter(l=>/^earthline-property-swale-natural-(up|flip)-16174$/.test(l.id)||l.id==='earthline-property-swale-neutral-16177');
  if(Math.abs(state.center.lat-42.78781)>0.001||Math.abs(state.center.lng+75.76996)>0.001)throw Error('PROPERTY CAMERA OUTSIDE NEW YORK');
  if(safe.some(l=>!l||l.visibility==='none'||l.rendered<1||Number(l.opacityPaint)<0.9))throw Error('VERIFIED SAFE BLUE SWALES NOT VISIBLE');
  if(natural.some(l=>l.visibility!=='none'))throw Error('DUAL RENDERERS ACTIVE');
}finally{await browser.close();}
