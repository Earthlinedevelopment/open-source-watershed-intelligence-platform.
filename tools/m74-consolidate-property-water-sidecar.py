from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")
original=s

def count(src, needle):
    return src.count(needle)

def function_bounds(src, name, start_at=0):
    marker="function "+name
    start=src.find(marker,start_at)
    if start < 0:
        raise RuntimeError("missing "+marker)
    brace=src.find("{",start)
    if brace < 0:
        raise RuntimeError("missing opening brace "+name)
    i=brace
    depth=0
    quote=None
    line_comment=False
    block_comment=False
    escape=False
    while i < len(src):
        ch=src[i]
        nx=src[i+1] if i+1 < len(src) else ""
        if line_comment:
            if ch=="\n":
                line_comment=False
            i+=1
            continue
        if block_comment:
            if ch=="*" and nx=="/":
                block_comment=False
                i+=2
                continue
            i+=1
            continue
        if quote is not None:
            if escape:
                escape=False
                i+=1
                continue
            if ch=="\\":
                escape=True
                i+=1
                continue
            if ch==quote:
                quote=None
                i+=1
                continue
            i+=1
            continue
        if ch=="/" and nx=="/":
            line_comment=True
            i+=2
            continue
        if ch=="/" and nx=="*":
            block_comment=True
            i+=2
            continue
        if ch in ("'", '"', "`"):
            quote=ch
            i+=1
            continue
        if ch=="{":
            depth+=1
        elif ch=="}":
            depth-=1
            if depth==0:
                return start,i+1
        i+=1
    raise RuntimeError("unterminated "+name)

def replace_function(src,name,new_text,start_at=0):
    a,b=function_bounds(src,name,start_at)
    return src[:a]+new_text+src[b:]

def must_replace(src,old,new,label):
    n=src.count(old)
    if n != 1:
        raise RuntimeError(f"{label}: expected 1 occurrence, found {n}")
    return src.replace(old,new,1)

# A. Retire old 15792 Mapbox water presentation; preserve its hydrology builder.
start=s.find("function syncPropertyFlow15792(force=false)")
if start < 0:
    raise RuntimeError("missing syncPropertyFlow15792")
s=replace_function(s,"syncPropertyFlow15792",r'''function syncPropertyFlow15792(force=false){
    /* EARTHLINE 17610 — compatibility only.
       The old 15792 Mapbox water presentation no longer owns Property-water
       generation, delivery, retries, or visibility. The governed 15824 sidecar
       commits one immutable water result per Property generation. */
    if(mapReady()){
      for(const id of [FLOW_CASING,FLOW_LINE,FLOW_PULSE,FLOW_ARROWS])layerVisible(id,false);
    }
    const publication=M&&M.authoritativeWaterPublication15824||null;
    const featureCount=Number(publication&&publication.featureCount||0);
    M.propertyFlowRenderer15792={
      build:"EARTHLINE 17610",
      generatedFeatures:featureCount,
      sourceFeatures:0,
      features:featureCount,
      visible:false,
      arrowsVisible:false,
      source:FLOW_SOURCE,
      sourceReady:false,
      retired:true,
      authoritativeCommitted:!!(
        publication&&publication.committed===true&&publication.verified===true&&
        Number(publication.searchGen)===Number(M&&M.searchGen)
      ),
      reason:"retired-to-governed-water-sidecar-17610"
    };
    return false;
  }''',start)

# B. Existing Property renderer delivery remains swale-only; water is not part of its retry owner.
start=s.find("function earthlineDeliverPropertyResult15817")
if start < 0:
    raise RuntimeError("missing earthlineDeliverPropertyResult15817")
s=replace_function(s,"earthlineDeliverPropertyResult15817",r'''function earthlineDeliverPropertyResult15817(
    reason="property-complete",
    scheduleRetries=true
  ){
    const runGen=Number(M&&M.searchGen||0);
    const safetyVerified=!!(
      M&&M.propertyResultLock15815&&
      M.propertyResultLock15815.safetyVerified===true&&
      M.safetyAudit15806&&M.safetyAudit15806.verified===true
    );
    const fc=(
      safetyVerified&&
      M.authoritativeSafeSwales15815&&
      M.authoritativeSafeSwales15815.type==="FeatureCollection"&&
      Array.isArray(M.authoritativeSafeSwales15815.features)
    )
      ?M.authoritativeSafeSwales15815
      :{type:"FeatureCollection",features:[]};
    if(!safetyVerified){
      earthlineClearPropertyMapSources16176();
      return false;
    }

    const attempt=(delayMs)=>{
      if(Number(M&&M.searchGen||0)!==runGen)return false;
      let visible=false;
      let error=null;
      try{
        if(typeof window.earthlineSyncLivingSwales15792==="function"){
          visible=!!window.earthlineSyncLivingSwales15792(fc,true);
        }else if(typeof window.earthlineRefreshPropertyRenderer15792==="function"){
          visible=!!window.earthlineRefreshPropertyRenderer15792(true);
        }
        if(typeof window.earthlineApplyRendererOwnership15805==="function"){
          window.earthlineApplyRendererOwnership15805("property");
        }
        if(typeof window.earthlineRenderSafetyPanel15806==="function"){
          window.earthlineRenderSafetyPanel15806();
        }
      }catch(e){
        error={
          name:String(e&&e.name||"Error"),
          message:String(e&&e.message||"renderer delivery failed"),
          stack:String(e&&e.stack||"")
        };
      }

      const renderer=M&&M.livingSwaleRenderer15792||null;
      const displayed=Number(renderer&&renderer.features||0);
      M.propertyRendererDelivery15817={
        build:"EARTHLINE 17610",
        reason,
        delayMs,
        searchGen:runGen,
        committedFeatures:fc.features.length,
        displayedFeatures:displayed,
        visible:!!(renderer&&renderer.visible),
        sourceReady:!!(renderer&&renderer.sourceReady),
        waterOwner:"earthlineCommitPropertyWater15824",
        waterPublication:M&&M.authoritativeWaterPublication15824||null,
        error,
        delivered:fc.features.length===0?displayed===0:displayed>0,
        attemptedAt:Date.now()
      };
      return fc.features.length===0?displayed===0:displayed>0;
    };

    const immediate=attempt(0);
    if(scheduleRetries){
      for(const timer of earthlineDeliveryTimers15817)clearTimeout(timer);
      earthlineDeliveryTimers15817.clear();
      for(const delay of [60,180,480,1100,2200]){
        const timer=setTimeout(()=>{
          earthlineDeliveryTimers15817.delete(timer);
          const delivered=attempt(delay);
          if(delivered){
            for(const pending of earthlineDeliveryTimers15817)clearTimeout(pending);
            earthlineDeliveryTimers15817.clear();
          }
        },delay);
        earthlineDeliveryTimers15817.add(timer);
      }
    }
    return immediate;
  }''',start)

# C. 15823 is compatibility-only; it cannot publish, retry, or redraw water.
anchor=s.find("window.earthlinePublishPropertyWater15823=publish;")
if anchor < 0:
    raise RuntimeError("missing 15823 export")
publish_start=s.rfind("function publish(",0,anchor)
schedule_start=s.rfind("function schedule(",0,anchor)
if publish_start < 0 or schedule_start < publish_start:
    raise RuntimeError("missing 15823 functions")
s=replace_function(s,"publish",r'''function publish(reason="manual"){
    const publication=M&&M.authoritativeWaterPublication15824||null;
    const committed=!!(
      publication&&publication.committed===true&&publication.verified===true&&
      Number(publication.searchGen)===Number(M&&M.searchGen)
    );
    M.propertyFlowDelivery15823={
      build:"EARTHLINE 17610",
      reason:String(reason||"manual"),
      legacyPublisherRetired17610:true,
      committed,
      authoritativeWaterPublication15824:publication,
      attemptedAt:Date.now()
    };
    renderStatus();
    return committed;
  }''',publish_start)

anchor=s.find("window.earthlinePublishPropertyWater15823=publish;")
schedule_start=s.rfind("function schedule(",0,anchor)
s=replace_function(s,"schedule",r'''function schedule(reason="property-result"){
    const publication=M&&M.authoritativeWaterPublication15824||null;
    const committed=!!(
      publication&&publication.committed===true&&publication.verified===true&&
      Number(publication.searchGen)===Number(M&&M.searchGen)
    );
    M.propertyFlowDelivery15823={
      build:"EARTHLINE 17610",
      reason:String(reason||"property-result"),
      legacySchedulerRetired17610:true,
      committed,
      authoritativeWaterPublication15824:publication,
      attemptedAt:Date.now()
    };
    return committed;
  }''',schedule_start)

# D. One committed Property generation owns the water sidecar result.
s=must_replace(
    s,
    "  let committedOwnerGeneration15824=null;\n  let committedFlowGeneration15824=null;",
    "  let committedWaterGeneration15824=null;",
    "15824 generation variables"
)

start=s.find("function propertyActive15824()")
if start < 0:
    raise RuntimeError("missing propertyActive15824")
s=replace_function(s,"propertyActive15824",r'''function propertyActive15824(){
    const publication=M&&M.authoritativeWaterPublication15824||null;
    const currentGen=Number(M&&M.searchGen);
    return !!(
      M&&publication&&publication.committed===true&&publication.verified===true&&
      Number(publication.searchGen)===currentGen&&
      validFC15824(M.authoritativeWaterPaths15824)&&
      M.authoritativeWaterPaths15824.features.length>0
    );
  }''',start)

s=must_replace(
    s,
    '''    /* EARTHLINE 17600 — committed geographic water geometry is immutable for the
       generation. Camera/style changes reproject it; they never regenerate it
       from mutable post-publication model state. */
    if(
      Number.isFinite(committedFlowGeneration15824)&&
      committedFlowGeneration15824===currentGen&&
      validFC15824(cachedFlow)
    )return cachedFlow;

''',
    '''    /* EARTHLINE 17610 — pure sidecar builder. It runs only during the governed
       Property publication handoff. Render events only reproject committed data. */

''',
    "remove post-publication builder reuse"
)

s=must_replace(
    s,
    '''    if(propertyActive15824())committedFlowGeneration15824=currentGen;
    M.authoritativeWaterPaths15824=cachedFlow;
''',
    "",
    "remove builder authoritative mutation"
)

# E. Add one governed commit contract after the existing hydrology-to-GeoJSON builder.
af=s.find("function authoritativeFlow15824(force=false)")
a,b=function_bounds(s,"authoritativeFlow15824",af)
commit=r'''

  function commitPropertyWater15824(reason="property-publication"){
    const currentGen=Number(M&&M.searchGen);
    const propertyPublication=M&&M.propertyPublication15816||null;
    const existing=M&&M.authoritativeWaterPublication15824||null;

    if(
      existing&&existing.committed===true&&existing.verified===true&&
      Number(existing.searchGen)===currentGen&&
      validFC15824(M&&M.authoritativeWaterPaths15824)&&
      M.authoritativeWaterPaths15824.features.length>0
    )return true;

    const publicationReady=!!(
      M&&M.analysisReady&&Number.isFinite(currentGen)&&
      propertyPublication&&propertyPublication.committed===true&&
      propertyPublication.safetyVerified===true&&
      Number(propertyPublication.searchGen)===currentGen
    );

    if(!publicationReady){
      M.authoritativeWaterPaths15824=emptyFC15824();
      M.authoritativeWaterPublication15824=Object.freeze({
        build:"EARTHLINE 17610",
        committed:false,
        verified:false,
        searchGen:currentGen,
        featureCount:0,
        reason:"property-publication-not-verified",
        requestedBy:String(reason||"property-publication"),
        at:new Date().toISOString()
      });
      return false;
    }

    const built=authoritativeFlow15824(true);
    const verified=!!(
      validFC15824(built)&&
      Array.isArray(built.features)&&
      built.features.length>0
    );

    if(!verified){
      M.authoritativeWaterPaths15824=emptyFC15824();
      M.authoritativeWaterPublication15824=Object.freeze({
        build:"EARTHLINE 17610",
        committed:false,
        verified:false,
        searchGen:currentGen,
        featureCount:0,
        reason:"authoritative-water-paths-empty",
        requestedBy:String(reason||"property-publication"),
        hydrologySource:"existing M.dir + M.acc",
        at:new Date().toISOString()
      });
      return false;
    }

    const committed=JSON.parse(JSON.stringify(built));
    M.authoritativeWaterPaths15824=committed;
    committedWaterGeneration15824=currentGen;
    M.authoritativeWaterPublication15824=Object.freeze({
      build:"EARTHLINE 17610",
      committed:true,
      verified:true,
      searchGen:currentGen,
      featureCount:committed.features.length,
      requestedBy:String(reason||"property-publication"),
      hydrologySource:"existing M.dir + M.acc",
      generationMethod:String(M&&M.waterPathGeneration15824&&M.waterPathGeneration15824.method||""),
      terrainStamp:String(M&&M.terrainStamp||""),
      framePoints:Number(Array.isArray(M&&M.analysisBoundaryLngLat)?M.analysisBoundaryLngLat.length:0),
      at:new Date().toISOString()
    });
    return true;
  }
'''
s=s[:b]+commit+s[b:]

# F. The visible renderer reads committed data only.
s=must_replace(
    s,
    "    const flow=authoritativeFlow15824(forceData);",
    "    const flow=validFC15824(M&&M.authoritativeWaterPaths15824)?M.authoritativeWaterPaths15824:emptyFC15824();",
    "renderer committed read"
)

s=must_replace(
    s,
    '''  window.earthlineRenderDirectWater15824=
    renderOverlay15824;''',
    '''  window.earthlineCommitPropertyWater15824=
    commitPropertyWater15824;
  window.earthlineRenderDirectWater15824=
    renderOverlay15824;''',
    "commit export"
)

s=must_replace(
    s,
    "    queueRender15824(true);",
    "    queueRender15824(false);",
    "install renderer"
)

# G. Canonical Property publication is the one water handoff.
marker="      if(m.layers&&m.layers.swales)m.layers.swales.on=true;"
if s.count(marker)!=1:
    raise RuntimeError("canonical publication marker count "+str(s.count(marker)))
water_lines=[
    "      const waterCommitted16220=!!(",
    "        typeof window.earthlineCommitPropertyWater15824==='function'&&",
    "        window.earthlineCommitPropertyWater15824('property-canonical-display-16220')",
    "      );",
    "      if(!waterCommitted16220){",
    "        const waterPublication16220=m.authoritativeWaterPublication15824||null;",
    "        window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220={",
    "          build:BUILD,published:false,",
    "          reason:'property-water-sidecar-unverified',",
    "          canonicalTierBefore:String(before?.tier||before?.mode||''),",
    "          generationMatches:counts.generationMatches,",
    "          currentGen:counts.currentGen,publicationGen:counts.publicationGen,lockGen:counts.lockGen,",
    "          engineCount:counts.engineCount,safeCount:counts.safeCount,publicationCount:counts.publicationCount,",
    "          waterPublication:waterPublication16220,",
    "          at:new Date().toISOString()",
    "        };",
    "        return {ok:false,counts,waterPublication:waterPublication16220};",
    "      }"
]
water_block="\n".join(water_lines)+"\n"
at=s.find(marker)
s=s[:at]+water_block+s[at:]

marker="      if(typeof window.earthlineSyncLivingSwales15792==='function')window.earthlineSyncLivingSwales15792(counts.safe,true);"
if s.count(marker)!=1:
    raise RuntimeError("canonical swale sync marker count "+str(s.count(marker)))
at=s.find(marker)+len(marker)
s=s[:at]+"\n      if(typeof window.earthlineRenderDirectWater15824==='function')window.earthlineRenderDirectWater15824(false);"+s[at:]

# H. Presentation settlement is not a water owner.
old="    try{if(typeof window.earthlineRenderDirectWater15824==='function')window.earthlineRenderDirectWater15824(true)}catch(_){ }"
if s.count(old)!=1:
    raise RuntimeError("settle direct-water call count "+str(s.count(old)))
s=s.replace(
    old,
    '''    /* EARTHLINE 17610 — presentation settlement does not own water.
       Canonical Property publication committed and rendered it already. */''',
    1
)

old="if(!propertyDisplay16220.ok){const reason='the governed Property result did not have a committed, exclusion-verified safety lock';"
new="if(!propertyDisplay16220.ok){const reason=String(window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220?.reason||'the governed Property result did not have a committed, exclusion-verified safety lock');"
s=must_replace(s,old,new,"publication failure reason")

s=must_replace(
    s,
    "    source:M&&M.authoritativeWaterPaths15824||null,",
    "    source:M&&M.authoritativeWaterPaths15824||null,\n    publication:M&&M.authoritativeWaterPublication15824||null,\n    committedGeneration:committedWaterGeneration15824,",
    "15824 audit"
)

# Governance invariants.
checks={
    "commitFn":s.count("function commitPropertyWater15824("),
    "forcedDirectRender":s.count("earthlineRenderDirectWater15824(true)"),
    "oldDeliveryWaterSync":s.count("earthlineSyncPropertyFlow15792(true)"),
    "sidecarFailClosed":s.count("property-water-sidecar-unverified"),
    "retired15792":s.count("retired-to-governed-water-sidecar-17610"),
    "listenersBefore":original.count("earthlineMap.on("),
    "listenersAfter":s.count("earthlineMap.on("),
    "intervalsBefore":original.count("setInterval("),
    "intervalsAfter":s.count("setInterval(")
}

if checks["commitFn"]!=1:
    raise RuntimeError(str(checks))
if checks["forcedDirectRender"]!=0:
    raise RuntimeError(str(checks))
if checks["oldDeliveryWaterSync"]!=0:
    raise RuntimeError(str(checks))
if checks["sidecarFailClosed"]!=1:
    raise RuntimeError(str(checks))
if checks["retired15792"]!=1:
    raise RuntimeError(str(checks))
if checks["listenersAfter"]>checks["listenersBefore"]:
    raise RuntimeError("new map listener owner added: "+str(checks))
if checks["intervalsAfter"]>checks["intervalsBefore"]:
    raise RuntimeError("new polling owner added: "+str(checks))

p.write_text(s,encoding="utf-8")
print("EARTHLINE_M74_PATCH",checks)
print("EARTHLINE_M74_SIZE",len(original),len(s))
