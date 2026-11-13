import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const ORIGIN='https://earthlinedevelopment.org/';
const SOURCE='earthline-property-swale-texture-16174';
const ELDER='earthline-elder-trees-17097';
const ELAYER='earthline-elder-tree-points-17097';
const WLINE='earthline-property-swale-natural-casing-16174';
const TARGET1={lng:-93.68,lat:42.13};
const TARGET2={lng:-93.675,lat:42.135};
const files={'/':'index.html','/index.html':'index.html','/earthline-elder-restored-17097.js':'earthline-elder-restored-17097.js','/earthline-elder-worker-17129.js':'earthline-elder-worker-17129.js'};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
async function boot(size){
  const ctx=await browser.newContext({viewport:size,serviceWorkers:'block'});
  await ctx.route('**/*',async r=>{
    try{
      const u=new URL(r.request().url());
      if(['earthlinedevelopment.org','www.earthlinedevelopment.org'].includes(u.hostname)&&files[u.pathname]){
        const f=files[u.pathname];
        return r.fulfill({status:200,contentType:f.endsWith('.js')?'text/javascript':'text/html',body:await fs.readFile(f)});
      }
    }catch(_){}
    return r.continue();
  });
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(ORIGIN,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.EARTHLINE_ELDER_TREES_V1_17097,null,{timeout:45000});
  return {ctx,page,errors};
}
async function prepare(page,t){
  const p=await page.evaluate(async t=>{
    const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,t.lng,t.lat,20);
    const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    return !!applied;
  },t);
  await page.waitForFunction(t=>{
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const c=map?.getCenter?.();
    return !!c&&!map.isMoving?.()&&Math.abs(c.lng-t.lng)<.0005&&Math.abs(c.lat-t.lat)<.0005&&
      Math.abs(Number(M?.centerLng)-t.lng)<.0005&&Math.abs(Number(M?.centerLat)-t.lat)<.0005;
  },t,{timeout:60000,polling:200});
  const set=await page.evaluate(t=>window.earthlineSetPropertyTarget16201({lng:t.lng,lat:t.lat,source:'mantra3-ui'},{openPanel:false}),t);
  return {applied:p,set:!!set};
}
async function prop(page,t){
  const prepared=await prepare(page,t);
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.evaluate(()=>{void window.earthlineDeclarePropertyAtCrosshair16169()});
  await page.waitForFunction(before=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    return Number(a.serial)>before&&a.settled===true;
  },before,{timeout:90000,polling:200});
  await page.waitForFunction(t=>{
    const x=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
    return x.state==='committed'&&x.mapPublished===true&&String(x.propertyRunIdentity||'').includes(t.lng.toFixed(6))&&
      String(x.propertyRunIdentity||'').includes(t.lat.toFixed(6));
  },t,{timeout:110000,polling:250});
  return {prepared,snapshot:await page.evaluate(()=>({
    audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    last:window.EARTHLINE_ELDER_TREE_LAST_17097||null
  }))};
}
async function snapMap(page,label){
  return page.evaluate(({label,SOURCE,ELDER,ELAYER,WLINE})=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const sf=m?.getSource?.(SOURCE),ef=m?.getSource?.(ELDER);
    let sc=sf?._data?.features?.length??sf?.serialize?.()?.data?.features?.length??null;
    let ec=ef?._data?.features?.length??ef?.serialize?.()?.data?.features?.length??null;
    return {label,zoom:m?.getZoom?.(),width:m?.getPaintProperty?.(WLINE,'line-width')??null,
      swaleFeatures:sc,elderFeatures:ec,
      elderLayerPresent:!!m?.getLayer?.(ELAYER),
      elderVisibility:m?.getLayoutProperty?.(ELAYER,'visibility')||null,
      propertySerial:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||null,
      propertyCorridors:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.corridors??null,
      propertyRunToken:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.publicationAudit?.runToken||null};
  },{label,SOURCE,ELDER,ELAYER,WLINE});
}
const out={codeCandidate:'c7d98bc7da30b93ceaf170d3828eb4dbc8fbaf5a',tests:{},errors:[]};
try{
  const {ctx,page,errors}=await boot({width:1440,height:900});
  const first=await prop(page,TARGET1);out.tests.property1={published:first.snapshot.audit?.result===true,corridors:first.snapshot.audit?.corridors,elderCount:first.snapshot.last?.featureCount};
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169?.sourceReady===true,null,{timeout:30000,polling:200}).catch(()=>{});
  const samples=[];
  for(const z of [17,19,16,18,17]){
    await page.evaluate(z=>{
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      m.jumpTo({zoom:z});
    },z);
    await page.waitForTimeout(700);
    samples.push(await snapMap(page,'zoom '+z));
  }
  await page.evaluate(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const c=m.getCenter();m.jumpTo({center:[c.lng+.0004,c.lat+.0003]});
  });
  await page.waitForTimeout(800);
  samples.push(await snapMap(page,'pan'));
  out.tests.zoom={samples,
    elderPersist:samples.every(x=>x.elderFeatures===first.snapshot.last.featureCount&&x.elderLayerPresent&&x.elderVisibility!=='none'),
    swaleStable:samples.every(x=>x.swaleFeatures===samples[0].swaleFeatures&&Number(x.swaleFeatures)>0),
    widthChanged:Number(samples[1]?.width)>Number(samples[0]?.width)};
  const second=await prop(page,TARGET2);
  const newMap=await snapMap(page,'property2 new location');
  out.tests.property2={published:second.snapshot.audit?.result===true,
    center:second.snapshot.audit?.center,
    corridors:second.snapshot.audit?.corridors,
    newRunToken:second.snapshot.audit?.publicationAudit?.runToken!==first.snapshot.audit?.publicationAudit?.runToken,
    correctCenter:Math.abs(Number(second.snapshot.audit?.center?.lng)-TARGET2.lng)<.0005&&Math.abs(Number(second.snapshot.audit?.center?.lat)-TARGET2.lat)<.0005,
    elderIdentity:String(second.snapshot.last?.propertyRunIdentity||''),
    activeMap:newMap
  };
  out.errors.push(...errors);
  await ctx.close();
  const mobile=await boot({width:390,height:844});
  await mobile.page.evaluate(()=>{
    window.EARTHLINE_DISPLAYED_RUN_16151={tier:'focus',mode:'focus'};
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    m?.jumpTo?.({zoom:17});
  });
  await mobile.page.waitForTimeout(900);
  out.tests.mobile=await mobile.page.evaluate(()=>{
    const hint=document.getElementById('earthlineMoveMapHintM2');
    const zoom=document.querySelector('.mapboxgl-ctrl-zoom-in');
    const crosshair=document.getElementById('earthlineDeclareProperty16169');
    const r=e=>{if(!e)return null;const q=e.getBoundingClientRect();return {left:q.left,right:q.right,top:q.top,bottom:q.bottom,width:q.width,height:q.height}};
    const h=r(hint),z=r(zoom),b=r(crosshair);
    const overlap=(a,b)=>!!a&&!!b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    return {viewport:{width:innerWidth,height:innerHeight},hintText:hint?.textContent||null,visible:!!hint&&getComputedStyle(hint).display!=='none',
      hint:h,zoom:z,button:b,zoomOverlap:overlap(h,z),buttonOverlap:overlap(h,b)};
  });
  out.errors.push(...mobile.errors);
  await mobile.ctx.close();
  out.passed=out.tests.property1.published&&out.tests.zoom.elderPersist&&out.tests.zoom.swaleStable&&out.tests.zoom.widthChanged&&
    out.tests.property2.published&&out.tests.property2.newRunToken&&out.tests.property2.correctCenter&&
    out.tests.property2.elderIdentity.includes(TARGET2.lng.toFixed(6))&&
    out.tests.mobile.visible&&!out.tests.mobile.zoomOverlap&&!out.tests.mobile.buttonOverlap;
}catch(e){out.fatal=String(e?.stack||e).slice(0,1500);out.passed=false}
finally{
 await fs.writeFile('mantra3-ui-browser-result.json',JSON.stringify(out,null,2));
 console.log('MANTRA3_UI_RESULT '+JSON.stringify({passed:out.passed,first:out.tests.property1,zoom:out.tests.zoom&&{
   elderPersist:out.tests.zoom.elderPersist,swaleStable:out.tests.zoom.swaleStable,
   widthChanged:out.tests.zoom.widthChanged,samples:out.tests.zoom.samples.map(x=>({label:x.label,width:x.width,swales:x.swaleFeatures,elders:x.elderFeatures}))},
   second:out.tests.property2&&{published:out.tests.property2.published,corridors:out.tests.property2.corridors,correctCenter:out.tests.property2.correctCenter,newRunToken:out.tests.property2.newRunToken,elderIdentity:out.tests.property2.elderIdentity},
   mobile:out.tests.mobile&&{visible:out.tests.mobile.visible,zoomOverlap:out.tests.mobile.zoomOverlap,buttonOverlap:out.tests.mobile.buttonOverlap},fatal:out.fatal,errors:out.errors.slice(0,10)}));
 await browser.close();if(!out.passed)process.exitCode=1;
}
