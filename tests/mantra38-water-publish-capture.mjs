import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});

async function run(query){
 const page=await browser.newPage({viewport:{width:1800,height:1000}});const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});
 await page.waitForFunction(()=>!!(window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)),null,{timeout:20000});
 await page.evaluate(()=>{
   const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);window.__EARTHLINE_WATER_PUBLISH_CAPTURES=[];
   const capture=(id,data)=>{try{
     if(id!=='el-live-flows-15970'||!data?.features)return;
     const flowCount=data.features.filter(f=>f?.properties?.feature_type==='flow').length;if(!flowCount)return;
     const style=m.getStyle?.()||{sources:{},layers:[]};const waters=[];
     for(const [sid,sdef] of Object.entries(style.sources||{})){if(String(sdef?.type||'').toLowerCase()!=='vector')continue;try{for(const f of (m.querySourceFeatures(sid,{sourceLayer:'water'})||[])){const g=f?.geometry;if(g&&(g.type==='Polygon'||g.type==='MultiPolygon'))waters.push({source:sid,geometry:JSON.parse(JSON.stringify(g)),properties:{class:f.properties?.class,type:f.properties?.type,name:f.properties?.name}})}}catch(_){}}
     window.__EARTHLINE_WATER_PUBLISH_CAPTURES.push({at:new Date().toISOString(),flows:JSON.parse(JSON.stringify(data)),waters,styleLayers:(style.layers||[]).filter(l=>{const t=(String(l.id||'')+' '+String(l['source-layer']||'')).toLowerCase();return /water|lake|reservoir|riverbank|ocean|sea/.test(t)&&!/groundwater|aquifer|grace|basin/.test(t)}).map(l=>({id:l.id,type:l.type,source:l.source,sourceLayer:l['source-layer']}))});
   }catch(_){}};
   const wrap=id=>{try{const s=m.getSource(id);if(!s||s.__traceWrapped||typeof s.setData!=='function')return;const base=s.setData.bind(s);s.setData=function(data){capture(id,data);return base(data)};s.__traceWrapped=true}catch(_){}};
   wrap('el-live-flows-15970');const add=m.addSource?.bind(m);if(add&&!m.__traceAddSource){m.addSource=function(id,spec){const r=add(id,spec);if(id==='el-live-flows-15970')wrap(id);return r};m.__traceAddSource=true;}
 });
 await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click()},query);
 try{await page.waitForFunction(()=>window.__EARTHLINE_WATER_PUBLISH_CAPTURES?.length>0||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:50000,polling:100})}catch(_){ }
 await page.waitForTimeout(1200);
 const result=await page.evaluate(q=>{
   const caps=window.__EARTHLINE_WATER_PUBLISH_CAPTURES||[],cap=caps[caps.length-1]||null,lv=window.EARTHLINE_LAND_VALIDITY_16584||null,ga=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,si=window.EARTHLINE_STYLE_WATER_INDEX_16584||null;
   if(!cap)return {query:q,capture:false,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim(),gridAudit:ga,finalWaterGate:si};
   const flows=(cap.flows.features||[]).filter(f=>f?.properties?.feature_type==='flow'&&f?.geometry?.type==='LineString'),waterGeoms=cap.waters||[];
   const finite=p=>Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]);
   const onSeg=(p,a,b)=>{const x=+p[0],y=+p[1],x1=+a[0],y1=+a[1],x2=+b[0],y2=+b[1],dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy;if(l<1e-20)return Math.hypot(x-x1,y-y1)<1e-10;const c=(x-x1)*dy-(y-y1)*dx;if(Math.abs(c)>1e-10)return false;const d=(x-x1)*dx+(y-y1)*dy;return d>=0&&d<=l};
   const inRing=(p,r)=>{if(!finite(p)||!Array.isArray(r)||r.length<3)return false;const x=+p[0],y=+p[1];let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[j],b=r[i];if(!finite(a)||!finite(b))continue;if(onSeg(p,a,b))return true;const xi=+b[0],yi=+b[1],xj=+a[0],yj=+a[1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-15)+xi))inside=!inside}return inside};
   const inPoly=(p,rings)=>{if(!rings?.length||!inRing(p,rings[0]))return false;for(let i=1;i<rings.length;i++)if(inRing(p,rings[i]))return false;return true};
   const inGeom=(p,g)=>g?.type==='Polygon'?inPoly(p,g.coordinates):g?.type==='MultiPolygon'?(g.coordinates||[]).some(r=>inPoly(p,r)):false;
   const R=6371.0088,rad=x=>x*Math.PI/180,hav=(a,b)=>{const p1=rad(a[1]),p2=rad(b[1]),dp=rad(b[1]-a[1]),dl=rad(b[0]-a[0]),z=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(z)))};
   let samples=0,vectorWaterHits=0;const examples=[];
   for(let li=0;li<flows.length;li++){const pts=flows[li].geometry.coordinates||[];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],steps=Math.max(1,Math.min(20,Math.ceil(hav(a,b)/.5)));for(let k=0;k<=steps;k++){if(i>1&&k===0)continue;const t=k/steps,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];samples++;let hit=null;for(let wi=0;wi<waterGeoms.length;wi++)if(inGeom(p,waterGeoms[wi].geometry)){hit=waterGeoms[wi];break}if(hit){vectorWaterHits++;if(examples.length<20)examples.push({line:li,coord:p,source:hit.source,props:hit.properties})}}}}
   const north=flows.map((f,i)=>{const c=f.geometry.coordinates||[],ys=c.map(p=>+p[1]),xs=c.map(p=>+p[0]);return {i,minLng:Math.min(...xs),maxLng:Math.max(...xs),minLat:Math.min(...ys),maxLat:Math.max(...ys),count:c.length}}).sort((a,b)=>b.maxLat-a.maxLat).slice(0,8);
   return {query:q,capture:true,captureCount:caps.length,flowCount:flows.length,vectorWaterFeatureCount:waterGeoms.length,waterSources:[...new Set(waterGeoms.map(w=>w.source))],styleWaterLayers:cap.styleLayers,vectorComparison:{samples,vectorWaterHits,examples},north,landValidity:{waterFeatures:lv?.inlandWaterGeometry?.mappedFeatureCount||0,waterNames:lv?.inlandWaterGeometry?.sampleNames||[]},gridAudit:ga,finalWaterGate:si,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()};
 },query);
 result.errors=errors.slice(0,20);await page.close();return result;
}
const vt=await run('Vermont'),ny=await run('New York');console.log('MANTRA38_WATER_PUBLISH_CAPTURE '+JSON.stringify({vt,ny}));await browser.close();
