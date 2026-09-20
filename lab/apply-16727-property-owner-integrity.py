from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name,old,new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

# Property science is anchored to the declared 20-acre frame. A camera/style
# movement is presentation state and must not invalidate an otherwise identical
# declared Property coordinate. Identity-vs-anchor remains fail-closed.
old_assert_head="""  function assertLocationIntegrity15801(identity,anchor,mode,phase){
    const zoom=Number(earthlineMap&&earthlineMap.getZoom?earthlineMap.getZoom():M.viewZoom);
    const result={
      ok:false,phase:String(phase||"unspecified"),mode:String(mode||""),
      zoom,anchor:anchor?{lat:Number(anchor.lat),lng:Number(anchor.lng)}:null,
      identity:identity?{
        name:String(identity.fullName||identity.name||""),
        placeType:String(identity.placeType||""),
        lat:Number(identity.lat),lng:Number(identity.lng)
      }:null,
      reasons:[]
    };
    if(!anchor||!Number.isFinite(Number(anchor.lat))||!Number.isFinite(Number(anchor.lng))){
      result.reasons.push("analysis anchor is not finite");
    }
    if(!Number.isFinite(zoom)||zoom<9){
      result.reasons.push("zoom below terrain-analysis floor");
    }"""
new_assert_head="""  function assertLocationIntegrity15801(identity,anchor,mode,phase){
    const zoom=Number(earthlineMap&&earthlineMap.getZoom?earthlineMap.getZoom():M.viewZoom);
    const declaration16727=window.EARTHLINE_PROPERTY_DECLARATION_16169||null;
    const declaredCenter16727=declaration16727&&declaration16727.center||null;
    const declaredDelta16727=(mode==="property"&&anchor&&declaredCenter16727&&
      Number.isFinite(Number(anchor.lat))&&Number.isFinite(Number(anchor.lng))&&
      Number.isFinite(Number(declaredCenter16727.lat))&&Number.isFinite(Number(declaredCenter16727.lng)))
      ?haversineM([Number(declaredCenter16727.lng),Number(declaredCenter16727.lat)],[Number(anchor.lng),Number(anchor.lat)]):Infinity;
    const governedDeclaredProperty16727=mode==="property"&&declaredDelta16727<=25&&
      String(document.documentElement.dataset.earthlinePropertyRunState||"")==="running";
    const result={
      ok:false,phase:String(phase||"unspecified"),mode:String(mode||""),
      zoom,anchor:anchor?{lat:Number(anchor.lat),lng:Number(anchor.lng)}:null,
      identity:identity?{
        name:String(identity.fullName||identity.name||""),
        placeType:String(identity.placeType||""),
        lat:Number(identity.lat),lng:Number(identity.lng)
      }:null,
      governedDeclaredProperty16727,
      declaredDeltaM16727:Number.isFinite(declaredDelta16727)?Number(declaredDelta16727.toFixed(3)):null,
      reasons:[]
    };
    if(!anchor||!Number.isFinite(Number(anchor.lat))||!Number.isFinite(Number(anchor.lng))){
      result.reasons.push("analysis anchor is not finite");
    }
    if(!Number.isFinite(zoom)){
      result.reasons.push("map zoom unavailable");
    }else if(zoom<9&&!governedDeclaredProperty16727){
      result.reasons.push("zoom below terrain-analysis floor");
    }else if(zoom<9){
      result.cameraZoomDiagnostic16727="presentation zoom moved below terrain-analysis floor after the governed Property frame was declared";
    }"""
patch("location-head",old_assert_head,new_assert_head)

old_map="""      const mapTolerance=mode==="property"?250:10000;
      if(result.mapDeltaM>mapTolerance){
        result.reasons.push("map moved away from the active analysis anchor");
      }
    }catch(e){
      result.reasons.push("map center unavailable");
    }
    result.ok=result.reasons.length===0;
    state.lastLocationIntegrity15801=result;"""
new_map="""      const mapTolerance=mode==="property"?250:10000;
      if(result.mapDeltaM>mapTolerance&&!governedDeclaredProperty16727){
        result.reasons.push("map moved away from the active analysis anchor");
      }else if(result.mapDeltaM>mapTolerance){
        result.cameraDeltaDiagnostic16727=Number(result.mapDeltaM.toFixed(3));
      }
    }catch(e){
      if(!governedDeclaredProperty16727)result.reasons.push("map center unavailable");
      else result.cameraDiagnostic16727="map center unavailable after governed Property declaration";
    }
    result.ok=result.reasons.length===0;
    state.lastLocationIntegrity15801=result;
    window.EARTHLINE_LOCATION_INTEGRITY_15801=JSON.parse(JSON.stringify(result));"""
patch("location-map",old_map,new_map)

# Existing presentation handoff already owns zoom/move/style events. Extend that
# owner so a safely published Property remains canonical after its runState goes idle,
# but only while its Regional parent token is still the current active run.
old_handoff="""    const propertyRunActive=document.documentElement.dataset.earthlinePropertyRunState==='running'||document.documentElement.classList.contains('earthline-property-running-16233');
    const currentTier=propertyRunActive?'property':(tier()||'regional');"""
new_handoff="""    const propertyRunActive=document.documentElement.dataset.earthlinePropertyRunState==='running'||document.documentElement.classList.contains('earthline-property-running-16233');
    const propertyPublication16727=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const propertyRun16727=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const propertyTarget16727=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const activeRegionalToken16727=String(window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||'');
    const propertyParentToken16727=String(propertyTarget16727&&propertyTarget16727.parentRunToken||'');
    const publishedPropertyOwns16727=!!(
      propertyPublication16727&&propertyPublication16727.published===true&&
      propertyRun16727&&propertyRun16727.settled===true&&propertyRun16727.result===true&&
      propertyParentToken16727&&propertyParentToken16727===activeRegionalToken16727
    );
    const currentTier=(propertyRunActive||publishedPropertyOwns16727)?'property':(tier()||'regional');"""
patch("handoff-owner",old_handoff,new_handoff)

# During optional post-science presentation verification, a stale reassertion of
# the same parent Regional result is not a newer user run. Re-publish the already
# verified Property display instead of treating that stale presentation as supersession.
old_presentation="""      const displayedAfterScience16334=
        window.EARTHLINE_DISPLAYED_RUN_16151||
        window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const displayedTierAfterScience16334=String(
        displayedAfterScience16334&&(displayedAfterScience16334.tier||displayedAfterScience16334.mode)||''
      ).toLowerCase();
      const presentationStillCurrent16334=!!(
        serial===runSerial&&
        Number(m.searchGen||0)===propertyPublicationGen16334&&
        displayedTierAfterScience16334!=='regional'
      );"""
new_presentation="""      let displayedAfterScience16334=
        window.EARTHLINE_DISPLAYED_RUN_16151||
        window.EARTHLINE_DISPLAYED_RUN_16147||null;
      let displayedTierAfterScience16334=String(
        displayedAfterScience16334&&(displayedAfterScience16334.tier||displayedAfterScience16334.mode)||''
      ).toLowerCase();
      const targetParent16727=String(window.EARTHLINE_PROPERTY_TARGET_16201&&window.EARTHLINE_PROPERTY_TARGET_16201.parentRunToken||'');
      const activeParent16727=String(window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||'');
      const samePropertyGeneration16727=serial===runSerial&&Number(m.searchGen||0)===propertyPublicationGen16334;
      const staleParentRegional16727=samePropertyGeneration16727&&displayedTierAfterScience16334==='regional'&&
        targetParent16727&&targetParent16727===activeParent16727;
      if(staleParentRegional16727){
        const republished16727=publishPropertyDisplay16220(site,selectedCode);
        try{
          const regionalState16727=window.earthlineRegional15778;
          if(regionalState16727){regionalState16727.active=false;regionalState16727.mode='property'}
          if(typeof window.earthlineApplyRendererOwnership15805==='function')window.earthlineApplyRendererOwnership15805('property');
          document.documentElement.dataset.earthlineAnalysisTier='property';
        }catch(_){}
        window.EARTHLINE_PROPERTY_DISPLAY_RECLAIM_16727={
          build:'EARTHLINE 16727',reclaimed:!!(republished16727&&republished16727.ok===true),
          parentRunToken:targetParent16727,at:new Date().toISOString()
        };
        displayedAfterScience16334=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
        displayedTierAfterScience16334=String(displayedAfterScience16334&&(displayedAfterScience16334.tier||displayedAfterScience16334.mode)||'').toLowerCase();
      }
      const presentationStillCurrent16334=!!(
        samePropertyGeneration16727&&
        displayedTierAfterScience16334!=='regional'
      );"""
patch("presentation-reclaim",old_presentation,new_presentation)

p.write_text(s,encoding="utf-8")
print("16727 applied")
