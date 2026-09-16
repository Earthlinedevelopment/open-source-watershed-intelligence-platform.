import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
let result=null;
for(let attempt=1;attempt<=5&&!result;attempt++){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click()});
  try{await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329?.passed===true||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:50000,polling:150})}catch(_){ }
  await page.waitForTimeout(2500);
  const snap=await page.evaluate(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),s=m?.getSource?.('el-live-flows-15970'),fc=s?._data||s?._options?.data||{features:[]};return {flows:(fc.features||[]).filter(f=>f?.properties?.feature_type==='flow').length,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()}});
  if(!(snap.flows>0&&/published/i.test(snap.status)&&!/failed/i.test(snap.status))){await page.close();continue;}
  result=await page.evaluate(attempt=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),lv=window.EARTHLINE_LAND_VALIDITY_16584||null;
    const waterParts=Array.isArray(lv?.waterParts)?lv.waterParts:[];
    const finite=p=>Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]);
    const onSeg=(p,a,b)=>{const x=+p[0],y=+p[1],x1=+a[0],y1=+a[1],x2=+b[0],y2=+b[1],dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy;if(l<1e-20)return Math.hypot(x-x1,y-y1)<1e-10;const c=(x-x1)*dy-(y-y1)*dx;if(Math.abs(c)>1e-10)return false;const d=(x-x1)*dx+(y-y1)*dy;return d>=0&&d<=l};
    const inRing=(p,r)=>{if(!finite(p)||!Array.isArray(r)||r.length<3)return false;const x=+p[0],y=+p[1];let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[j],b=r[i];if(!finite(a)||!finite(b))continue;if(onSeg(p,a,b))return true;const xi=+b[0],yi=+b[1],xj=+a[0],yj=+a[1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-15)+xi))inside=!inside}return inside};
    const inPart=(p,o)=>{if(!o?.rings?.length)return false;const b=o.bbox;if(b&&(p[0]<b[0]||p[0]>b[2]||p[1]<b[1]||p[1]>b[3]))return false;if(!inRing(p,o.rings[0]))return false;for(let i=1;i<o.rings.length;i++)if(inRing(p,o.rings[i]))return false;return true};
    const inWater=(p)=>{for(let i=0;i<waterParts.length;i++)if(inPart(p,waterParts[i]))return i;return -1};
    const R=6371.0088,rad=x=>x*Math.PI/180,hav=(a,b)=>{const p1=rad(a[1]),p2=rad(b[1]),dp=rad(b[1]-a[1]),dl=rad(b[0]-a[0]),z=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(z)))};
    const lakeOntarioIndex=(()=>{const names=lv?.inlandWaterGeometry?.sampleNames||[];const i=names.findIndex(n=>/lake ontario/i.test(String(n)));if(i>=0&&i<waterParts.length)return i;for(let wi=0;wi<waterParts.length;wi++){const b=waterParts[wi]?.bbox;if(b&&b[0]<-79&&b[2]>-76&&b[1]<44&&b[3]>43)return wi}return -1})();
    const targetParts=lakeOntarioIndex>=0?[waterParts[lakeOntarioIndex]]:waterParts;
    const inTarget=(p)=>{for(let i=0;i<targetParts.length;i++)if(inPart(p,targetParts[i]))return i;return -1};
    function sourceData(id){try{const s=m.getSource(id);return s?._data||s?._options?.data||null}catch(_){return null}}
    function geometryLines(g){const out=[];if(!g)return out;if(g.type==='LineString')out.push(g.coordinates||[]);else if(g.type==='MultiLineString')for(const c of g.coordinates||[])out.push(c);else if(g.type==='Polygon')for(const r of g.coordinates||[])out.push(r);else if(g.type==='MultiPolygon')for(const p of g.coordinates||[])for(const r of p||[])out.push(r);return out;}
    function auditSource(id,layerIds=[]){
      const data=sourceData(id),fs=Array.isArray(data?.features)?data.features:[];let lineCount=0,samples=0,waterHits=0,targetHits=0;const examples=[];
      for(let fi=0;fi<fs.length;fi++)for(const line of geometryLines(fs[fi]?.geometry)){const pts=(line||[]).filter(finite);if(pts.length<2)continue;lineCount++;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],steps=Math.max(1,Math.min(24,Math.ceil(hav(a,b)/.4)));for(let k=0;k<=steps;k++){if(i>1&&k===0)continue;const t=k/steps,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];samples++;const w=inWater(p),tw=inTarget(p);if(w>=0)waterHits++;if(tw>=0){targetHits++;if(examples.length<20)examples.push({feature:fi,coord:p,props:fs[fi]?.properties||{},waterPart:w})}}}}
      const layers=layerIds.map(lid=>{try{const l=m.getLayer(lid);return l?{id:lid,type:l.type,visibility:m.getLayoutProperty(lid,'visibility')||'visible',color:l.type==='line'?m.getPaintProperty(lid,'line-color'):null,width:l.type==='line'?m.getPaintProperty(lid,'line-width'):null}:null}catch(_){return null}}).filter(Boolean);
      return {id,featureCount:fs.length,lineCount,samples,waterHits,targetHits,examples,layers};
    }
    const audits={
      flows:auditSource('el-live-flows-15970',['el-live-flow-casing-15970','el-live-flow-line-15970','el-live-flow-arrow-15970']),
      basin:auditSource('el-live-basin-15970',['el-live-basin-fill-15970','el-live-basin-line-15970']),
      aquifer:auditSource('el-live-aquifer-15970',['el-live-aquifer-fill-15970','el-live-aquifer-line-15970']),
      liveContours:auditSource('el-live-contours-15970',['el-live-contour-line-15970']),
      officialContours:auditSource('earthline-official-terrain-v2-15776',['earthline-official-contour-minor-15776','earthline-official-contour-major-casing-15776','earthline-official-contour-major-15776'])
    };
    let officialRendered={};for(const lid of ['earthline-official-contour-minor-15776','earthline-official-contour-major-casing-15776','earthline-official-contour-major-15776']){try{officialRendered[lid]=m.getLayer(lid)?m.queryRenderedFeatures(undefined,{layers:[lid]}).length:null}catch(e){officialRendered[lid]=String(e)}}
    return {attempt,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim(),waterNames:lv?.inlandWaterGeometry?.sampleNames||[],waterPartCount:waterParts.length,lakeOntarioIndex,lakeOntarioBBox:lakeOntarioIndex>=0?waterParts[lakeOntarioIndex]?.bbox:null,audits,officialRendered};
  },attempt);
  await page.close();
}
console.log('MANTRA38_LAKE_OWNER_INTERSECTIONS '+JSON.stringify(result));if(!result)process.exitCode=1;await browser.close();
