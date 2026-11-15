#!/usr/bin/env python3
"""Apply October Regional aquifer run-owner integration, exact anchors only.
Does not change Property science, slope, swales, UI assets, or production.
"""
from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
def change(old,new,label,count=1):
    global s
    actual=s.count(old)
    if actual!=count: raise SystemExit(f"STOP {label}: expected {count} anchors, found {actual}")
    s=s.replace(old,new,count)
    print("PATCH",label)

helpers="""
  /* October isolated aquifer ownership: one authoritative run per exact extent. */
  let regionalAquiferOwnerM14=null,regionalAquiferTokenM14=null;
  function regionalAquiferCarryM14(token,reason){
    if(!isCurrentRun(token)||!regionalAquiferOwnerM14||!regionalAquiferTokenM14||
       regionalAquiferTokenM14.runId!==String(token))return 0;
    const present=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_AUDIT_16373||null;
    if(present&&String(present.runToken||'')===String(token)&&present.status==='current'){
      return Number(present.features||0);
    }
    const result=regionalAquiferOwnerM14.provisional(regionalAquiferTokenM14,reason);
    if(!result.ok)return 0;
    const m=map();
    if(!m||!m.getSource?.(IDS.aquifer))return 0;
    setGeo(m,IDS.aquifer,result.data);
    window.EARTHLINE_REGIONAL_AQUIFER_CARRYOVER_M14={
      runToken:String(token),fromRunId:result.fromRunId,boundsHash:result.extentKey,
      status:'provisional-carryover',label:'Carried over from previous run',
      reason:String(reason),featureCount:result.data.features.length,at:new Date().toISOString()
    };
    recordRun('aquifer_provisional_carryover',token,window.EARTHLINE_REGIONAL_AQUIFER_CARRYOVER_M14);
    return result.data.features.length;
  }
"""
change("  function guardedSetGeo(token,m,id,data,sourceId){",helpers+"  function guardedSetGeo(token,m,id,data,sourceId){","owner-helper")
change("""    setGeo(m,id,data);
    /* EARTHLINE 16373 — capture accepted Regional aquifer geometry at the same
       authoritative publication point that commits it to the live Regional map. */
    if(id===IDS.aquifer&&data&&Array.isArray(data.features)&&data.features.length){
      try{
        window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_GEOJSON_16373=JSON.parse(JSON.stringify(data));
        window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_AUDIT_16373={
          build:'EARTHLINE 16373',runToken:String(token||''),sourceId:String(sourceId||id),
          features:data.features.length,acceptedAt:new Date().toISOString()
        };
      }catch(_){}
    }""","""    if(id===IDS.aquifer&&data&&Array.isArray(data.features)&&data.features.length){
      if(!regionalAquiferOwnerM14||!regionalAquiferTokenM14||
         regionalAquiferTokenM14.runId!==String(token))return false;
      const accepted=regionalAquiferOwnerM14.accept(regionalAquiferTokenM14,data,String(sourceId||id));
      if(!accepted.ok){recordRun('aquifer_owner_rejected',token,{reason:accepted.reason});return false;}
      setGeo(m,id,accepted.data);
      window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_GEOJSON_16373=accepted.data;
      window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_AUDIT_16373={
        build:'EARTHLINE 16373',runToken:String(token),boundsHash:accepted.extentKey,
        status:'current',sourceId:String(sourceId||id),features:accepted.data.features.length,
        acceptedAt:new Date().toISOString()
      };
      window.EARTHLINE_REGIONAL_AQUIFER_CARRYOVER_M14=null;
    }else setGeo(m,id,data);""","guarded-source-accept")
change("""    const aquifers=(acceptedAqAudit&&String(acceptedAqAudit.runToken||'')===String(token||'')&&acceptedAq&&Array.isArray(acceptedAq.features))
      ?acceptedAq
      :(visualData.aquifers||EMPTY);""","""    const currentAq=acceptedAqAudit&&String(acceptedAqAudit.runToken||'')===String(token||'')&&
      acceptedAqAudit.status==='current'&&acceptedAq&&Array.isArray(acceptedAq.features)?acceptedAq:null;
    const carryCountM14=!currentAq?regionalAquiferCarryM14(token,'same extent; current aquifer source pending'):0;
    const carriedM14=carryCountM14>0&&
      window.EARTHLINE_REGIONAL_AQUIFER_CARRYOVER_M14?.runToken===String(token);
    const priorM14=carriedM14?regionalAquiferOwnerM14.provisional(regionalAquiferTokenM14,'core publication'):null;
    const aquifers=currentAq||(priorM14?.ok?priorM14.data:null)||visualData.aquifers||EMPTY;""","native-fallback")
change("      if(!guardedSetGeo(token,m,id,data,sourceId))return false;","      if(id===IDS.aquifer&&carriedM14){setGeo(m,id,data);continue;}\n      if(!guardedSetGeo(token,m,id,data,sourceId))return false;","native-do-not-reaccept-carry")
change("  function clearLive(){const m=map();if(!m)return;for(const id of [IDS.basin,IDS.aquifer,IDS.contours,IDS.flows,IDS.swales])setGeo(m,id,EMPTY);}",
"  function clearLive(preserveAquifer=false){const m=map();if(!m)return;for(const id of [IDS.basin,IDS.aquifer,IDS.contours,IDS.flows,IDS.swales]){if(id===IDS.aquifer&&preserveAquifer)continue;setGeo(m,id,EMPTY);}}","selective-clear")
change("    const b=analysisBounds(loc),bHash=boundsHash(b);","""    const b=analysisBounds(loc),bHash=boundsHash(b);
    if(!regionalAquiferOwnerM14){
      const moduleM14=await import('./engine-next/core/source-owner.mjs');
      regionalAquiferOwnerM14=new moduleM14.SourceOwner('regional-aquifer');
    }
    if(!isCurrentRun(runToken))return false;
    regionalAquiferTokenM14=regionalAquiferOwnerM14.begin({extentKey:bHash,runId:String(runToken)});
    window.EARTHLINE_REGIONAL_AQUIFER_CARRYOVER_M14=null;""","begin-regional-owner")
change("    clearLive();ensureLayers();","    const keepAquiferM14=!!regionalAquiferCarryM14(runToken,'same extent; Regional run starting');\n    clearLive(keepAquiferM14);ensureLayers();","initial-selective-clear")
change("""          return 0;
        }
      }
    }
    return loadIGRACAquifers(b,runToken);""","""          return regionalAquiferCarryM14(runToken,'USGS aquifer services unavailable');
        }
      }
    }
    try{return await loadIGRACAquifers(b,runToken);}
    catch(error){
      if(!isCurrentRun(runToken))return 0;
      recordRun('source_unavailable',runToken,{sourceId:'igrac-whymap-overview',error:String(error)});
      return regionalAquiferCarryM14(runToken,'IGRAC aquifer request unavailable');
    }""","source-failure-fallback")
change("        const aquiferCount16198=typeof aquiferResult16198==='number'?aquiferResult16198:0;",
"""        let aquiferCount16198=typeof aquiferResult16198==='number'?aquiferResult16198:0;
        if(!focusMode&&!aquiferCount16198)
          aquiferCount16198=regionalAquiferCarryM14(runToken,'optional aquifer request failed or timed out');""","timeout-fallback")
change("        clearLive();\n        window.EARTHLINE_REGIONAL_VISUAL_DATA_16020=null;",
"""        clearLive(!!regionalAquiferCarryM14(runToken,'Regional run failed; preserve previous same-extent aquifer context'));
        window.EARTHLINE_REGIONAL_VISUAL_DATA_16020=null;""","failure-path-clears",3)
change("if(!propertyOwnsDisplay16726)setRunStatus(","if(!propertyOwnsDisplay16726)setRunStatus((window.EARTHLINE_REGIONAL_AQUIFER_CARRYOVER_M14?.runToken===String(runToken)?'Aquifer context carried over from previous run for this exact extent. ':'')+","provisional-visible-status")
assert s.count("function regionalAquiferCarryM14(")==1
assert s.count("regionalAquiferOwnerM14.accept(")==1
assert s.count("clearLive(!!regionalAquiferCarryM14(")==3
p.write_text(s,encoding="utf-8")
print("PASS: Regional aquifer source owner wired; exact expected anchors only")
