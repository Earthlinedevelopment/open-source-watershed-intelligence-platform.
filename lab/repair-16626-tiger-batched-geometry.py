from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16626 — BATCHED OFFICIAL TIGER HYDRO GEOMETRY'
if marker in s:
    raise SystemExit('guard failed: 16626 marker already present')
start_needle='const queryTigerCount16620=async(layer16620,coords16620)=>{'
end_needle='tigerMs16617=Math.round(performance.now()-tigerStart16617);'
if s.count(start_needle)!=1:
    raise SystemExit(f'guard failed: TIGER count owner count {s.count(start_needle)}')
start=s.index(start_needle)
end=s.index(end_needle,start)
old=s[start:end]
if 'returnCountOnly' not in old or 'chunkSize16620=6' not in old or 'swales16609={...swales16609,features:safe16620}' not in old:
    raise SystemExit('guard failed: expected per-swale TIGER owner shape not found')
new=r'''/* EARTHLINE 16626 — BATCHED OFFICIAL TIGER HYDRO GEOMETRY.
         Preserve Census TIGERweb/Hydro as the U.S. final-safety authority, but stop
         issuing two network requests per candidate swale. Up to 24 candidate paths
         are submitted in one official polyline-intersection request per Hydro layer;
         returned official geometry is then evaluated by the existing local exact
         segment-intersection owner below. No water rule or source is weakened. */
      const queryTigerGeometry16626=async(layer16626,paths16626)=>{
        const controller16626=new AbortController(),timer16626=setTimeout(()=>controller16626.abort(),5000);
        const geometry16626=JSON.stringify({paths:paths16626,spatialReference:{wkid:4326}});
        const body16626=new URLSearchParams({
          where:'1=1',geometry:geometry16626,geometryType:'esriGeometryPolyline',inSR:'4326',
          spatialRel:'esriSpatialRelIntersects',outFields:'OBJECTID',returnGeometry:'true',
          outSR:'4326',f:'geojson'
        });
        try{
          const response16626=await fetch('https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Hydro/MapServer/'+layer16626+'/query',{
            method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
            body:body16626,signal:controller16626.signal,cache:'no-store'
          });
          const data16626=await response16626.json();
          if(!response16626.ok||data16626&&data16626.error||data16626?.type!=='FeatureCollection')
            throw new Error(String(data16626&&data16626.error&&data16626.error.message||'TIGERweb Hydro geometry query failed'));
          if(data16626.exceededTransferLimit===true)
            throw new Error('TIGERweb Hydro geometry transfer limit exceeded');
          return Array.isArray(data16626.features)?data16626.features:[];
        }finally{clearTimeout(timer16626);}
      };
      try{
        const chunkSize16626=24,batches16626=[];
        for(let i16626=0;i16626<candidates16620.length;i16626+=chunkSize16626){
          const paths16626=[];
          for(const f16626 of candidates16620.slice(i16626,i16626+chunkSize16626)){
            const coords16626=f16626&&f16626.geometry&&f16626.geometry.type==='LineString'?f16626.geometry.coordinates:[];
            if(coords16626.length>1)paths16626.push(coords16626);
          }
          if(paths16626.length)batches16626.push(paths16626);
        }
        tigerBatchCount16618=batches16626.length;
        const batchResults16626=await Promise.all(batches16626.map(async paths16626=>{
          const [linear16626,areal16626]=await Promise.all([
            queryTigerGeometry16626(0,paths16626),queryTigerGeometry16626(1,paths16626)
          ]);
          return {linear16626,areal16626};
        }));
        for(const result16626 of batchResults16626){
          tigerLinearFeatures16617+=result16626.linear16626.length;
          tigerArealFeatures16617+=result16626.areal16626.length;
          const lineBefore16626=lines16609.length,polyBefore16626=polys16609.length;
          for(const f16626 of result16626.linear16626)addGeometry16609(f16626&&f16626.geometry);
          for(const f16626 of result16626.areal16626)addGeometry16609(f16626&&f16626.geometry);
          tigerLines16617+=Math.max(0,lines16609.length-lineBefore16626);
          tigerPolygonParts16617+=Math.max(0,polys16609.length-polyBefore16626);
        }
        tigerRejected16620=0; /* counted once by the shared exact filter below */
        tigerVerified16617=true;
      }catch(e16626){
        tigerVerified16617=false;
        tigerError16617=String(e16626&&e16626.message||e16626||'TIGERweb Hydro batched geometry unavailable');
      }
      '''
s=s[:start]+new+s[end:]
p.write_text(s,encoding='utf-8')
print('16626 patch applied')
