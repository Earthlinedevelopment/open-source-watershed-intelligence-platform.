import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});

async function run(query){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  try{
    await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329?.passed===true||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:50000,polling:150});
    await page.waitForTimeout(2200);
    return await page.evaluate(q=>{
      const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      const lv=window.EARTHLINE_LAND_VALIDITY_16584||null;
      const ga=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
      const vd=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
      const si=window.EARTHLINE_STYLE_WATER_INDEX_16584||null;
      const src=mp?.getSource?.('el-live-flows-15970');
      const fc=src?._data||src?._options?.data||{type:'FeatureCollection',features:[]};
      const flows=(fc.features||[]).filter(f=>f?.properties?.feature_type==='flow'&&f?.geometry?.type==='LineString');
      const style=mp?.getStyle?.()||{layers:[],sources:{}};
      const waterLayers=(style.layers||[]).filter(l=>{
        if(l.type!=='fill')return false;
        const tag=(String(l.id||'')+' '+String(l['source-layer']||'')).toLowerCase();
        return /water|lake|reservoir|riverbank|ocean|sea/.test(tag)&&!/groundwater|aquifer|grace|basin/.test(tag);
      }).map(l=>l.id);
      const waterParts=Array.isArray(lv?.waterParts)?lv.waterParts:[];
      const landParts=Array.isArray(lv?.landParts)?lv.landParts:[];
      const finite=p=>Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]);
      const onSeg=(p,a,b)=>{const x=+p[0],y=+p[1],x1=+a[0],y1=+a[1],x2=+b[0],y2=+b[1],dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy;if(l<1e-20)return Math.hypot(x-x1,y-y1)<1e-10;const c=(x-x1)*dy-(y-y1)*dx;if(Math.abs(c)>1e-10)return false;const d=(x-x1)*dx+(y-y1)*dy;return d>=0&&d<=l;};
      const inRing=(p,r)=>{if(!finite(p)||!Array.isArray(r)||r.length<3)return false;const x=+p[0],y=+p[1];let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[j],b=r[i];if(!finite(a)||!finite(b))continue;if(onSeg(p,a,b))return true;const xi=+b[0],yi=+b[1],xj=+a[0],yj=+a[1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-15)+xi))inside=!inside;}return inside;};
      const inPart=(p,part)=>{if(!part?.rings?.length)return false;const b=part.bbox;if(b&&(p[0]<b[0]||p[0]>b[2]||p[1]<b[1]||p[1]>b[3]))return false;if(!inRing(p,part.rings[0]))return false;for(let i=1;i<part.rings.length;i++)if(inRing(p,part.rings[i]))return false;return true;};
      const inAny=(p,parts)=>{for(let i=0;i<parts.length;i++)if(inPart(p,parts[i]))return i;return -1;};
      const R=6371.0088,rad=x=>x*Math.PI/180,hav=(a,b)=>{const p1=rad(a[1]),p2=rad(b[1]),dp=rad(b[1]-a[1]),dl=rad(b[0]-a[0]),z=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(z)));};
      const bounds=vd?.bounds||null;
      let cell={dxKm:null,dyKm:null,diagKm:null};
      if(Array.isArray(bounds)&&bounds.length===4&&ga?.grid?.w>1&&ga?.grid?.h>1){const [w,s,e,n]=bounds,mid=(s+n)/2,dx=hav([w,mid],[w+(e-w)/(ga.grid.w-1),mid]),dy=hav([w,mid],[w,mid+(n-s)/(ga.grid.h-1)]);cell={dxKm:+dx.toFixed(3),dyKm:+dy.toFixed(3),diagKm:+Math.hypot(dx,dy).toFixed(3)};}
      let samples=0,neWaterHits=0,outsideLandHits=0,renderedWaterHits=0,renderedOnlyHits=0,neOnlyHits=0;
      const examples=[];
      const sourceWaterCounts={};
      if(typeof mp?.querySourceFeatures==='function')for(const [sid,sdef] of Object.entries(style.sources||{})){if(String(sdef?.type||'').toLowerCase()!=='vector')continue;try{const fs=mp.querySourceFeatures(sid,{sourceLayer:'water'})||[];if(fs.length)sourceWaterCounts[sid]=fs.length;}catch(_){}}
      for(let li=0;li<flows.length;li++){
        const pts=(flows[li].geometry.coordinates||[]).filter(finite);
        for(let i=1;i<pts.length;i++){
          const a=pts[i-1],b=pts[i],segKm=hav(a,b),steps=Math.max(1,Math.min(12,Math.ceil(segKm/1.0)));
          for(let k=0;k<=steps;k++){
            if(i>1&&k===0)continue;
            const t=k/steps,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];samples++;
            const ne=inAny(p,waterParts)>=0,land=inAny(p,landParts)>=0;
            if(ne)neWaterHits++;if(!land)outsideLandHits++;
            let rw=false,hitLayers=[];
            try{const px=mp.project({lng:p[0],lat:p[1]});if(px&&Number.isFinite(px.x)&&Number.isFinite(px.y)&&px.x>=0&&px.y>=0&&px.x<=mp.getCanvas().width&&px.y<=mp.getCanvas().height&&waterLayers.length){const hits=mp.queryRenderedFeatures([px.x,px.y],{layers:waterLayers})||[];rw=hits.length>0;hitLayers=[...new Set(hits.map(h=>h.layer?.id).filter(Boolean))];}}catch(_){ }
            if(rw)renderedWaterHits++;
            if(rw&&!ne){renderedOnlyHits++;if(examples.length<20)examples.push({kind:'rendered-water-not-NE',line:li,coord:p,land,hitLayers});}
            if(ne&&!rw){neOnlyHits++;if(examples.length<20)examples.push({kind:'NE-water-not-rendered',line:li,coord:p,land,hitLayers});}
          }
        }
      }
      const north=flows.map((f,i)=>{const c=f.geometry.coordinates||[];const ys=c.map(p=>+p[1]).filter(Number.isFinite),xs=c.map(p=>+p[0]).filter(Number.isFinite);return {i,minLat:ys.length?Math.min(...ys):null,maxLat:ys.length?Math.max(...ys):null,minLng:xs.length?Math.min(...xs):null,maxLng:xs.length?Math.max(...xs):null,count:c.length};}).sort((a,b)=>(b.maxLat||-999)-(a.maxLat||-999)).slice(0,6);
      return {
        query:q,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim(),
        preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,
        landValidity:{acquisitionResult:lv?.acquisitionResult||null,waterFeatures:lv?.inlandWaterGeometry?.mappedFeatureCount||0,waterParts:waterParts.length,waterNames:lv?.inlandWaterGeometry?.sampleNames||[],landFeatures:lv?.landSurfaceGeometry?.mappedFeatureCount||0},
        gridAudit:ga,cell,bounds,
        boundary:{vermont:window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178||null,generic:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null},
        finalWaterGate:si,
        waterLayers,sourceWaterCounts,
        flowCount:flows.length,north,
        comparison:{samples,neWaterHits,outsideLandHits,renderedWaterHits,renderedOnlyHits,neOnlyHits,examples},
        errors
      };
    },query);
  }finally{await page.close();}
}

const vt=await run('Vermont');
const ny=await run('New York');
const out={test:'Mantra 38 shared not-over-water rule trace',productUrl:URL,vt,ny};
console.log('MANTRA38_WATER_RULE_TRACE '+JSON.stringify(out));
await browser.close();
