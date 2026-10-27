from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_prop="""        screening:focusMode?'Earthline focus corridor derived from a modeled contour; longitudinal relief and end-to-end elevation change are each limited to 5 m. Field and bare-earth verification remain required.':'Earthline regional opportunity corridor derived from modeled contour geometry. The 5 m focus tolerance is not enforced against coarse regional DEM cells; a focus or property run is required before placement.'
      },geometry:{type:'LineString',coordinates:c.segment}});"""
new_prop="""        screening:focusMode?'Earthline focus corridor derived from a modeled contour; longitudinal relief and end-to-end elevation change are each limited to 5 m. Field and bare-earth verification remain required.':'Earthline regional opportunity corridor derived from modeled contour geometry. The 5 m focus tolerance is not enforced against coarse regional DEM cells; a focus or property run is required before placement.',
        jurisdiction_boundary_screened:(!focusMode&&jurisdictionGeometry16539&&c.jurisdiction_screened===true)?true:null
      },geometry:{type:'LineString',coordinates:c.segment}});"""
if s.count(old_prop)!=1: raise SystemExit(f"swale proof property anchor count {s.count(old_prop)}")
s=s.replace(old_prop,new_prop,1)

old_swales="""    const contours=await earthlineClipFeatureCollection16539(payload.contours,g);
    const flows=await earthlineClipFeatureCollection16539(payload.flows,g);
    const swales=earthlineRerankRegionalSwales16539(await earthlineClipFeatureCollection16539(payload.swales,g));"""
new_swales="""    const contours=await earthlineClipFeatureCollection16539(payload.contours,g);
    const flows=await earthlineClipFeatureCollection16539(payload.flows,g);
    const swaleFeatures17332=(payload.swales&&payload.swales.features)||[];
    const swalesProven17332=swaleFeatures17332.length===0||swaleFeatures17332.every(f=>f&&f.properties&&f.properties.jurisdiction_boundary_screened===true);
    const swales=earthlineRerankRegionalSwales16539(swalesProven17332?payload.swales:await earthlineClipFeatureCollection16539(payload.swales,g));"""
if s.count(old_swales)!=1: raise SystemExit(f"publication swale clip anchor count {s.count(old_swales)}")
s=s.replace(old_swales,new_swales,1)

old_audit="""    const audit={build:'EARTHLINE 16539',runToken:payload.runToken||null,query:String(payload.query||''),placeType:boundary.placeType,capability:boundary.capability,source:boundary.source,sourceTier:boundary.sourceTier,sourceVintage:boundary.sourceVintage||null,before,after,outsideAfterClip,removed:{contours:Math.max(0,before.contours-after.contours),flows:Math.max(0,before.flows-after.flows),swales:Math.max(0,before.swales-after.swales)},rule:'hydrology computed continuously on the full DEM envelope; only published Regional products are clipped to the selected administrative polygon',at:new Date().toISOString()};"""
new_audit="""    const audit={build:'EARTHLINE 16539',runToken:payload.runToken||null,query:String(payload.query||''),placeType:boundary.placeType,capability:boundary.capability,source:boundary.source,sourceTier:boundary.sourceTier,sourceVintage:boundary.sourceVintage||null,before,after,outsideAfterClip,swalesPreScreenedReuse17332:swalesProven17332,removed:{contours:Math.max(0,before.contours-after.contours),flows:Math.max(0,before.flows-after.flows),swales:Math.max(0,before.swales-after.swales)},rule:'hydrology computed continuously on the full DEM envelope; only published Regional products are clipped to the selected administrative polygon',at:new Date().toISOString()};"""
if s.count(old_audit)!=1: raise SystemExit(f"audit anchor count {s.count(old_audit)}")
s=s.replace(old_audit,new_audit,1)

s="<!-- EARTHLINE_PROVEN_SWALE_PUBLICATION_REUSE_17332: reuse swale geometry only when every published swale carries proof from the authoritative makeSwales jurisdiction screen; otherwise original publication clip runs. Final outside-boundary invariant always runs. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed proven swale publication reuse 17332")
