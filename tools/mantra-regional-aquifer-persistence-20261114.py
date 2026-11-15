#!/usr/bin/env python3
"""Mantra aquifer persistence: fail-closed same-extent Regional patch.
Run from repository root. Stops if any source anchor has changed.
"""
from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
def change(old,new,label):
    global s
    count=s.count(old)
    if count!=1: raise RuntimeError(f"{label}: expected one source match, found {count}")
    s=s.replace(old,new,1)
    print("PATCHED",label)

change("  function guardedSetGeo(token,m,id,data,sourceId){",'''
  /* Mantra aquifer persistence: accepted aquifer context is bound to its exact extent. */
  function aquiferSameExtentM14(hash){
    const a=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_AUDIT_16373||null;
    const g=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_GEOJSON_16373||null;
    return !!(hash&&a&&a.boundsHash===hash&&g&&Array.isArray(g.features)&&g.features.length);
  }
  function aquiferRestoreM14(token,hash,reason){
    if(!isCurrentRun(token)||!aquiferSameExtentM14(hash))return 0;
    const source=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_GEOJSON_16373,m=map();
    if(!m?.getSource?.(IDS.aquifer))return 0;
    const data={type:'FeatureCollection',features:source.features.map(f=>({...f,properties:{...(f.properties||{}),earthline_context_carried_over:true,earthline_context_status:'Carried over from previous run'}}))};
    setGeo(m,IDS.aquifer,data);
    window.EARTHLINE_REGIONAL_AQUIFER_CARRYOVER_M14={runToken:String(token),boundsHash:hash,featureCount:data.features.length,status:'Carried over from previous run',reason:String(reason),at:new Date().toISOString()};
    return data.features.length;
  }
  function guardedSetGeo(token,m,id,data,sourceId){''',"helpers")
change("features:data.features.length,acceptedAt:new Date().toISOString()","features:data.features.length,boundsHash:(window.EARTHLINE_REGIONAL_AQUIFER_PENDING_EXTENT_M14?.runToken===String(token)?window.EARTHLINE_REGIONAL_AQUIFER_PENDING_EXTENT_M14.boundsHash:null),acceptedAt:new Date().toISOString()","cache-extent")
change("""const aquifers=(acceptedAqAudit&&String(acceptedAqAudit.runToken||'')===String(token||'')&&acceptedAq&&Array.isArray(acceptedAq.features))
      ?acceptedAq
      :(visualData.aquifers||EMPTY);""","""const currentAq=acceptedAqAudit&&String(acceptedAqAudit.runToken||'')===String(token||'')&&acceptedAq&&Array.isArray(acceptedAq.features)?acceptedAq:null;
    const carryAq=!currentAq&&aquiferSameExtentM14(visualData.boundsHash)?acceptedAq:null;
    const aquifers=currentAq||carryAq||visualData.aquifers||EMPTY;
    if(carryAq)window.EARTHLINE_REGIONAL_AQUIFER_CARRYOVER_M14={runToken:String(token),boundsHash:visualData.boundsHash,featureCount:carryAq.features.length,status:'Carried over from previous run',reason:'same-extent core publication before groundwater response',at:new Date().toISOString()};""","native-owner")
change("if(!guardedSetGeo(token,m,id,data,sourceId))return false;","if(id===IDS.aquifer&&carryAq){setGeo(m,id,data);continue;}\n      if(!guardedSetGeo(token,m,id,data,sourceId))return false;","avoid-cache-recapture")
change("function clearLive(){const m=map();if(!m)return;for(const id of [IDS.basin,IDS.aquifer,IDS.contours,IDS.flows,IDS.swales])setGeo(m,id,EMPTY);}","function clearLive(preserveAquifer=false){const m=map();if(!m)return;for(const id of [IDS.basin,IDS.aquifer,IDS.contours,IDS.flows,IDS.swales]){if(id===IDS.aquifer&&preserveAquifer)continue;setGeo(m,id,EMPTY);}}","selective-clear")
change("const b=analysisBounds(loc),bHash=boundsHash(b);","const b=analysisBounds(loc),bHash=boundsHash(b);\n    window.EARTHLINE_REGIONAL_AQUIFER_PENDING_EXTENT_M14={runToken:String(runToken),boundsHash:bHash,bounds:b.slice(),at:new Date().toISOString()};\n    window.EARTHLINE_REGIONAL_AQUIFER_CARRYOVER_M14=null;","run-owner")
change("clearLive();ensureLayers();","clearLive(aquiferSameExtentM14(bHash));ensureLayers();","initial-clear")
old="        clearLive();\n        window.EARTHLINE_REGIONAL_VISUAL_DATA_16020=null;"
assert s.count(old)==3, "expected exactly three error handlers"
for new in [
  "        clearLive(aquiferSameExtentM14(bHash));\n        window.EARTHLINE_REGIONAL_VISUAL_DATA_16020=null;",
  "        clearLive(aquiferSameExtentM14(bHash));\n        window.EARTHLINE_REGIONAL_VISUAL_DATA_16020=null;",
  "        clearLive(window.EARTHLINE_REGIONAL_AQUIFER_PENDING_EXTENT_M14?.runToken===String(runToken)&&aquiferSameExtentM14(window.EARTHLINE_REGIONAL_AQUIFER_PENDING_EXTENT_M14.boundsHash));\n        window.EARTHLINE_REGIONAL_VISUAL_DATA_16020=null;"
]: s=s.replace(old,new,1)
print("PATCHED three failure paths")
change("recordRun('source_unavailable',runToken,{sourceId:'usgs-principal+karst-regional-context',error:String(usgsError&&usgsError.message||usgsError)});\n          return 0;","recordRun('source_unavailable',runToken,{sourceId:'usgs-principal+karst-regional-context',error:String(usgsError&&usgsError.message||usgsError)});\n          return aquiferRestoreM14(runToken,boundsHash(b),'USGS principal and karst requests failed');","usgs-fallback")
change("    return loadIGRACAquifers(b,runToken);\n  }","    try{return await loadIGRACAquifers(b,runToken);}\n    catch(error){if(!isCurrentRun(runToken))return 0;recordRun('source_unavailable',runToken,{sourceId:'igrac-whymap-continental-overview',error:String(error&&error.message||error)});return aquiferRestoreM14(runToken,boundsHash(b),'IGRAC request failed');}\n  }","igrac-fallback")
change("const aquiferCount16198=typeof aquiferResult16198==='number'?aquiferResult16198:0;","let aquiferCount16198=typeof aquiferResult16198==='number'?aquiferResult16198:0;\n        if(!focusMode&&aquiferCount16198===0)aquiferCount16198=aquiferRestoreM14(runToken,bHash,'optional aquifer context failed or timed out');","timeout-fallback")
change("if(!propertyOwnsDisplay16726)setRunStatus((focusMode?'Focus screening published. ':(isVermont?'Vermont screening published. ':'Regional screening published. '))+(failures16198.length?'Unavailable context: '+failures16198.join(', ')+'. ':'Watershed and groundwater context updated. ')+swaleNote+(!focusMode?earthlineLandValidityStatus16584():''),'published');",
"if(!propertyOwnsDisplay16726)setRunStatus((focusMode?'Focus screening published. ':(isVermont?'Vermont screening published. ':'Regional screening published. '))+(window.EARTHLINE_REGIONAL_AQUIFER_CARRYOVER_M14?.runToken===String(runToken)?'Aquifer context carried over from previous run for this exact extent. ':'')+(failures16198.length?'Unavailable context: '+failures16198.join(', ')+'. ':'Watershed and groundwater context updated. ')+swaleNote+(!focusMode?earthlineLandValidityStatus16584():''),'published');","visible-carry-label")
assert "function clearLive(){" not in s
assert "aquiferSameExtentM14" in s
p.write_text(s,encoding="utf-8")
print("PATCH SUCCESS; live branch untouched")
