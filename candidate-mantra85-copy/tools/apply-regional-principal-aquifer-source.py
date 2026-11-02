from pathlib import Path

path = Path("index.html")
text = path.read_text(encoding="utf-8")

anchor = """  async function loadIGRACAquifers(b,runToken){"""
if text.count(anchor) != 1:
    raise SystemExit(f"principal aquifer insert anchor: expected 1 match, found {text.count(anchor)}")

principal = """  async function loadUSGSPrincipalAquifers16626(b,runToken,optionalBoundary16565=null){
    const base='https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Aquifers_Feature_Layer_view/FeatureServer/0/query';
    const span=Math.max(Math.abs(b[2]-b[0]),Math.abs(b[3]-b[1]));
    const params={where:'1=1',geometry:b.join(','),geometryType:'esriGeometryEnvelope',inSR:'4326',spatialRel:'esriSpatialRelIntersects',outFields:'AQ_NAME,ROCK_TYPE,ROCK_NAME',returnGeometry:'true',outSR:'4326',maxAllowableOffset:String(span>5?.01:span>2?.004:.001),geometryPrecision:'5',resultRecordCount:'2000'};
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),7000);
    try{
      const p=new URLSearchParams(Object.assign({},params,{f:'geojson'}));
      const r=await fetch(base+'?'+p.toString(),{mode:'cors',cache:'force-cache',signal:ctl.signal});
      if(!r.ok)throw new Error('USGS principal aquifer HTTP '+r.status);
      const j=await r.json();if(j&&j.error)throw new Error(j.error.message||'USGS principal aquifer service error');
      const raw=(j&&j.features||[]).filter(f=>{
        const n=String(f&&f.properties&&f.properties.AQ_NAME||'').trim();
        return !!(f&&f.geometry&&n&&!/^other\\s+rocks?$/i.test(n));
      });
      let geo={type:'FeatureCollection',features:raw.map(f=>({
        type:'Feature',
        properties:Object.assign({},f.properties||{},{
          name:String(f.properties&&f.properties.AQ_NAME||'USGS principal aquifer'),
          source:'USGS Principal Aquifers of the United States',
          boundary_class:'national principal-aquifer extent — regional context, not a parcel boundary'
        }),
        geometry:f.geometry
      }))};
      if(!geo.features.length)throw new Error('USGS principal-aquifer layer returned no mapped polygon for this view');
      geo=earthlineContainOptionalContext16565(geo,optionalBoundary16565,'usgs-principal-regional-context',runToken);
      if(!geo.features.length)throw new Error('USGS principal-aquifer polygons were outside or crossed the selected jurisdiction boundary');
      if(!guardedSetGeo(runToken,map(),IDS.aquifer,geo,'usgs-principal-regional-context'))return 0;
      regionalAquiferSource='USGS Principal Aquifers of the United States';
      regionalAquiferBoundaryClass='national principal-aquifer extent — regional context, not a parcel boundary';
      window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126={source:regionalAquiferSource,bounds:b,features:geo.features.length,transport:'fetch',boundaryClass:regionalAquiferBoundaryClass,loadedAt:new Date().toISOString()};
      return geo.features.length;
    }finally{clearTimeout(timer);}
  }

"""
text = text.replace(anchor, principal + anchor, 1)

old = """    if(bboxIntersectsContiguousUS(b)){
      try{return await loadUSGSKarstAquifers(b,runToken,optionalBoundary16565);}
      catch(usgsError){
        if(!isCurrentRun(runToken))return 0;
        regionalAquiferSource='Mapped U.S. aquifer geometry unavailable in the installed regional dataset';
        regionalAquiferBoundaryClass='absence of a polygon is not absence of groundwater';
        recordRun('source_unavailable',runToken,{sourceId:'usgs-karst-regional-context',error:String(usgsError&&usgsError.message||usgsError)});
        return 0;
      }
    }"""

new = """    if(bboxIntersectsContiguousUS(b)){
      try{return await loadUSGSPrincipalAquifers16626(b,runToken,optionalBoundary16565);}
      catch(principalError16626){
        if(!isCurrentRun(runToken))return 0;
        recordRun('source_fallback',runToken,{sourceId:'usgs-principal-regional-context',fallback:'usgs-karst-regional-context',error:String(principalError16626&&principalError16626.message||principalError16626)});
        try{return await loadUSGSKarstAquifers(b,runToken,optionalBoundary16565);}
        catch(usgsError){
          if(!isCurrentRun(runToken))return 0;
          regionalAquiferSource='Mapped U.S. aquifer geometry unavailable in the installed regional datasets';
          regionalAquiferBoundaryClass='absence of a polygon is not absence of groundwater';
          recordRun('source_unavailable',runToken,{sourceId:'usgs-principal+karst-regional-context',error:String(usgsError&&usgsError.message||usgsError)});
          return 0;
        }
      }
    }"""

if text.count(old) != 1:
    raise SystemExit(f"loadAquifers replacement: expected 1 match, found {text.count(old)}")
text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")
print("Applied shared USGS principal-aquifer-first Regional source repair")
