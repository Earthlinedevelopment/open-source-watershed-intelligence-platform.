from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""  async function earthlineClipFeatureCollection16539(fc,g){
    const out=[],features16661=(fc&&fc.features||[]);let featureIndex16661=0;
    for(const feature of features16661){
      if(feature&&feature.geometry){
        const geom=feature.geometry,props=Object.assign({},feature.properties||{});
        if(geom.type==='Point'){
          if(earthlinePointInJurisdiction16539(geom.coordinates,g))out.push({type:'Feature',properties:props,geometry:JSON.parse(JSON.stringify(geom))});
        }else{
          const lines=geom.type==='LineString'?[geom.coordinates]:geom.type==='MultiLineString'?(geom.coordinates||[]):[];
          for(const line of lines)for(const run of earthlineClipLine16539(line,g)){const safe=run;if(safe.length>=2)out.push({type:'Feature',properties:Object.assign({},props,{jurisdiction_boundary_screened:true}),geometry:{type:'LineString',coordinates:safe}});}
        }
      }
      if((++featureIndex16661%256)===0)await earthlineCooperativeYield16661();
    }
    return {type:'FeatureCollection',features:out};
  }
  async function earthlineOutsideCoordinateCount16539(fc,g){
    let outside=0,featureIndex16661=0;
    for(const f of (fc&&fc.features||[])){
      const geom=f&&f.geometry;
      if(geom){
        if(geom.type==='Point'){if(!earthlinePointInJurisdiction16539(geom.coordinates,g))outside++;}
        else{const lines=geom.type==='LineString'?[geom.coordinates]:geom.type==='MultiLineString'?(geom.coordinates||[]):[];for(const line of lines)for(const p of (line||[]))if(earthlineFinitePoint16539(p)&&!earthlinePointInJurisdiction16539(p,g))outside++;}
      }
      if((++featureIndex16661%256)===0)await earthlineCooperativeYield16661();
    }
    return outside;
  }"""
new="""  const earthlineCertifiedPublishedFeature17316=new WeakSet();
  function earthlineLineBounds17316(line17316){
    let w17316=Infinity,s17316=Infinity,e17316=-Infinity,n17316=-Infinity;
    for(const p17316 of (line17316||[])){if(!earthlineFinitePoint16539(p17316))continue;const x17316=Number(p17316[0]),y17316=Number(p17316[1]);if(x17316<w17316)w17316=x17316;if(x17316>e17316)e17316=x17316;if(y17316<s17316)s17316=y17316;if(y17316>n17316)n17316=y17316;}
    return Number.isFinite(w17316)?[w17316,s17316,e17316,n17316]:null;
  }
  async function earthlineClipFeatureCollection16539(fc,g){
    const out=[],features16661=(fc&&fc.features||[]);let featureIndex16661=0;
    for(const feature of features16661){
      if(feature&&feature.geometry){
        const geom=feature.geometry,props=Object.assign({},feature.properties||{});
        if(geom.type==='Point'){
          if(earthlinePointInJurisdiction16539(geom.coordinates,g))out.push({type:'Feature',properties:props,geometry:JSON.parse(JSON.stringify(geom))});
        }else{
          const lines=geom.type==='LineString'?[geom.coordinates]:geom.type==='MultiLineString'?(geom.coordinates||[]):[];
          for(const line of lines){
            const bounds17316=earthlineLineBounds17316(line),certified17316=!!(bounds17316&&earthlineBBoxCertifiedInterior16850(bounds17316,g));
            const clipGeometry17316=certified17316?{earthlineCertifiedInterior16850:true}:g;
            for(const run of earthlineClipLine16539(line,clipGeometry17316)){
              const safe=run;if(safe.length<2)continue;
              const outFeature17316={type:'Feature',properties:Object.assign({},props,{jurisdiction_boundary_screened:true}),geometry:{type:'LineString',coordinates:safe}};
              out.push(outFeature17316);if(certified17316)earthlineCertifiedPublishedFeature17316.add(outFeature17316);
            }
          }
        }
      }
      if((++featureIndex16661%256)===0)await earthlineCooperativeYield16661();
    }
    return {type:'FeatureCollection',features:out};
  }
  async function earthlineOutsideCoordinateCount16539(fc,g){
    let outside=0,featureIndex16661=0;
    for(const f of (fc&&fc.features||[])){
      if(earthlineCertifiedPublishedFeature17316.has(f)){if((++featureIndex16661%256)===0)await earthlineCooperativeYield16661();continue;}
      const geom=f&&f.geometry;
      if(geom){
        if(geom.type==='Point'){if(!earthlinePointInJurisdiction16539(geom.coordinates,g))outside++;}
        else{const lines=geom.type==='LineString'?[geom.coordinates]:geom.type==='MultiLineString'?(geom.coordinates||[]):[];for(const line of lines)for(const p of (line||[]))if(earthlineFinitePoint16539(p)&&!earthlinePointInJurisdiction16539(p,g))outside++;}
      }
      if((++featureIndex16661%256)===0)await earthlineCooperativeYield16661();
    }
    return outside;
  }"""
if s.count(old)!=1: raise SystemExit(f"publication owner anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_CERTIFIED_PUBLICATION_INTERIOR_17316: final Regional line features wholly inside jurisdiction bbox are certified against all boundary-edge boxes, retain identical densification, and skip redundant outside verification; boundary-near features use original exact clip + verification. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed certified publication interior fast path 17316")
