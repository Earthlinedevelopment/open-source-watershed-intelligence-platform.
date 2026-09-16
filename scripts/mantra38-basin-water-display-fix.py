from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

old_fill = "if(!m.getLayer(IDS.basinFill))m.addLayer({id:IDS.basinFill,type:'fill',source:IDS.basin,paint:{'fill-color':'#27a8e0','fill-opacity':0.06}},before);"
new_fill = "if(!m.getLayer(IDS.basinFill))m.addLayer({id:IDS.basinFill,type:'fill',source:IDS.basin,filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':'#27a8e0','fill-opacity':0.06}},before);"
old_line = "if(!m.getLayer(IDS.basinLine))m.addLayer({id:IDS.basinLine,type:'line',source:IDS.basin,paint:{'line-color':'#83dcff','line-width':2.6,'line-opacity':0.96}},before);"
new_line = "if(!m.getLayer(IDS.basinLine))m.addLayer({id:IDS.basinLine,type:'line',source:IDS.basin,filter:['==',['geometry-type'],'LineString'],paint:{'line-color':'#83dcff','line-width':2.6,'line-opacity':0.96}},before);"

helper_anchor = "  function earthlineContainOptionalContext16565(geo16565,boundary16565,source16565,runToken16565){"
helper = r'''  function earthlineBasinDisplayLandSplitMantra38(geoMantra38,runTokenMantra38){
    const validityMantra38=window.EARTHLINE_LAND_VALIDITY_16584||null,
          waterPartsMantra38=Array.isArray(validityMantra38&&validityMantra38.waterParts)?validityMantra38.waterParts:[];
    if(!geoMantra38||!Array.isArray(geoMantra38.features)||!waterPartsMantra38.length)return geoMantra38;
    const finiteMantra38=p=>Array.isArray(p)&&Number.isFinite(Number(p[0]))&&Number.isFinite(Number(p[1]));
    const inWaterMantra38=p=>{
      if(!finiteMantra38(p))return true;
      const x=Number(p[0]),y=Number(p[1]);
      for(const part of waterPartsMantra38){
        if(!part||!part.bbox||!part.rings)continue;
        if(x<part.bbox[0]||x>part.bbox[2]||y<part.bbox[1]||y>part.bbox[3])continue;
        if(earthlinePointInPolygon16584(x,y,part.rings))return true;
      }
      return false;
    };
    const sameMantra38=(a,b)=>finiteMantra38(a)&&finiteMantra38(b)&&Math.abs(Number(a[0])-Number(b[0]))<1e-10&&Math.abs(Number(a[1])-Number(b[1]))<1e-10;
    const clipRingMantra38=ring=>{
      const segments=[];let current=[];
      for(const raw of (Array.isArray(ring)?ring:[])){
        if(!finiteMantra38(raw)){if(current.length>1)segments.push(current);current=[];continue;}
        const p=[Number(raw[0]),Number(raw[1])];
        if(inWaterMantra38(p)){if(current.length>1)segments.push(current);current=[];continue;}
        current.push(p);
      }
      if(current.length>1)segments.push(current);
      if(segments.length>1&&sameMantra38(segments[0][0],segments[segments.length-1][segments[segments.length-1].length-1])){
        const last=segments.pop(),first=segments.shift();segments.unshift(last.concat(first.slice(1)));
      }
      return segments;
    };
    const out=[];let polygonFeatures=0,lineFeatures=0,lineParts=0;
    for(const feature of geoMantra38.features){
      const g=feature&&feature.geometry,props=Object.assign({},feature&&feature.properties||{});
      if(!g||(g.type!=='Polygon'&&g.type!=='MultiPolygon')){out.push(feature);continue;}
      polygonFeatures++;
      out.push({type:'Feature',properties:Object.assign({},props,{earthline_context_geometry:'fill'}),geometry:g});
      const polys=g.type==='Polygon'?[g.coordinates]:(g.coordinates||[]),lines=[];
      for(const poly of polys)for(const ring of (poly||[]))for(const seg of clipRingMantra38(ring)){if(seg.length>1){lines.push(seg);lineParts++;}}
      if(lines.length){
        out.push({type:'Feature',properties:Object.assign({},props,{earthline_context_geometry:'line'}),geometry:{type:'MultiLineString',coordinates:lines}});
        lineFeatures++;
      }
    }
    window.EARTHLINE_BASIN_WATER_DISPLAY_AUDIT_MANTRA38={runToken:runTokenMantra38||null,inputFeatures:geoMantra38.features.length,polygonFeatures,lineFeatures,lineParts,waterParts:waterPartsMantra38.length,rule:'basin fill preserved; basin boundary display withheld at mapped inland-water vertices',at:new Date().toISOString()};
    return {type:'FeatureCollection',features:out};
  }

'''

old_publish = "geo=earthlineContainOptionalContext16565(geo,optionalBoundary16565,'hydrobasins-temporary-mirror',runToken);\n      if(!guardedSetGeo(runToken,map(),IDS.basin,geo,'hydrobasins-temporary-mirror'))return 0;return geo.features.length;"
new_publish = "geo=earthlineContainOptionalContext16565(geo,optionalBoundary16565,'hydrobasins-temporary-mirror',runToken);\n      geo=earthlineBasinDisplayLandSplitMantra38(geo,runToken);\n      if(!guardedSetGeo(runToken,map(),IDS.basin,geo,'hydrobasins-temporary-mirror'))return 0;return geo.features.length;"

for needle, replacement, label in [
    (old_fill,new_fill,'basin fill layer'),
    (old_line,new_line,'basin line layer'),
    (helper_anchor,helper+helper_anchor,'helper anchor'),
    (old_publish,new_publish,'basin publication'),
]:
    count=s.count(needle)
    if count!=1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    s=s.replace(needle,replacement,1)

marker='<!-- MANTRA 38 — BASIN WATER DISPLAY REPAIR. Hydrologic water paths were proven clean; only the existing HydroBASINS context line is split at the already-authoritative 16584 inland-water evidence before the same basin source publishes. Basin polygon fill/science retained; no new source, layer, renderer, listener, science variable, or jurisdiction branch. -->\n'
if not s.startswith(marker):
    s=marker+s

p.write_text(s,encoding='utf-8')
print('MANTRA38_BASIN_PATCH_OK')
