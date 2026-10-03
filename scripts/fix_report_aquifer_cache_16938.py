from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')
old="""const v=visual();
    if(v&&v.aquifers&&Array.isArray(v.aquifers.features))v.aquifers.features.forEach(addFeature);
    const rows=(typeof M!=="undefined"&&Array.isArray(M.usgsAquifers))?M.usgsAquifers:[];"""
new="""const v=visual();
    if(v&&v.aquifers&&Array.isArray(v.aquifers.features))v.aquifers.features.forEach(addFeature);
    const acceptedRegional=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_GEOJSON_16373||null;
    if(acceptedRegional&&Array.isArray(acceptedRegional.features))acceptedRegional.features.forEach(addFeature);
    const inheritedProperty=window.EARTHLINE_PROPERTY_INHERITED_AQUIFER_CONTEXT_16373||null;
    if(inheritedProperty&&Array.isArray(inheritedProperty.polys)){
      inheritedProperty.polys.forEach((poly,i)=>addFeature({type:'Feature',properties:{name:String(poly&&poly.name||'Mapped aquifer context'),source:String(poly&&poly.source||inheritedProperty.source||'Inherited official aquifer context'),report_context_only:true,index:i},geometry:{type:'Polygon',coordinates:[(poly&&Array.isArray(poly.lngLatPts)?poly.lngLatPts:[]).map(c=>[Number(c[0]),Number(c[1])]).filter(c=>Number.isFinite(c[0])&&Number.isFinite(c[1]))]}}));
    }
    const rows=(typeof M!=="undefined"&&Array.isArray(M.usgsAquifers))?M.usgsAquifers:[];"""
if old not in s: raise SystemExit('reportAquifers insertion owner not found')
s=s.replace(old,new,1)

# Make the single map read more like a finished landscape-planning plate.
s=s.replace("const title='Earthline Screening Map'+(reportPlace?' · '+reportPlace:'')+' · '+(reportTier==='focus'?'Focus':'Regional');",
            "const title='Earthline Water + Recharge Opportunity Map'+(reportPlace?' · '+reportPlace:'')+' · '+(reportTier==='focus'?'Focus':'Regional');",1)
s=s.replace('stroke="#8e9387" stroke-width=".58" opacity=".42"','stroke="#7f8b83" stroke-width=".62" opacity=".44"',1)
s=s.replace('stroke="#087bb4" stroke-width="1.65" opacity=".97"','stroke="#087bb4" stroke-width="1.85" opacity=".98"',1)
s=s.replace("mainW=r.grade==='A'?3.8:r.grade==='B'?3.2:2.65","mainW=r.grade==='A'?4.35:r.grade==='B'?3.55:2.9",1)
p.write_text(s)
