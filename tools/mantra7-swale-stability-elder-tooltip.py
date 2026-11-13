#!/usr/bin/env python3
"""Mantra 7: pinned presentation-only swale stability + transient Elder tooltip.

Do not change hydrology, exclusions, swale geometry, model data, logo, search orb.
Requires the precise Mantra 6 production blobs; fails closed on divergence.
"""
from pathlib import Path
import subprocess

def blob(path):
    return subprocess.check_output(["git", "hash-object", str(path)], text=True).strip()

def replace_once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise RuntimeError(f"STOP: {label}, expected 1 match; found {n}")
    return text.replace(old, new, 1)

index = Path("index.html")
elder_path = Path("earthline-elder-restored-17097.js")
assert blob(index) == "ba3a2d0864f5620530e87d800d2d5222e0590c34", "STOP: wrong HTML parent"
assert blob(elder_path) == "07b7ce9418daa5753afc6cdead432865a885485b", "STOP: wrong Elder parent"
s = index.read_bytes().decode("utf-8")
e = elder_path.read_bytes().decode("utf-8")

s = replace_once(s,
    "  const safeLayerTimers16221=new Set();",
    """  const safeLayerTimers16221=new Set();
  /* Mantra 7 display-only: no reupload or reordering of verified swales on camera motion. */
  let lastSafeSourceM7=null,lastSafeFCM7=null,lastSafeKeyM7='',lastSafeClearedM7=null;""",
    "fallback ownership memo")
s = replace_once(s,
    "      try{if(mp?.getLayer?.(id))mp.setLayoutProperty(id,'visibility',on?'visible':'none')}catch(_){ }",
    "      try{if(mp?.getLayer?.(id)){const next=on?'visible':'none';if((mp.getLayoutProperty?.(id,'visibility')||'visible')!==next)mp.setLayoutProperty(id,'visibility',next)}}catch(_){ }",
    "fallback duplicate visibility")
s = replace_once(s,
    """    try{const src=mp?.getSource?.(SAFE_SOURCE_16221);if(src?.setData)src.setData(SAFE_EMPTY_16221)}catch(_){ }
    setSafeLayerVisibility16221(false);""",
    """    try{const src=mp?.getSource?.(SAFE_SOURCE_16221);if(src?.setData&&(src!==lastSafeClearedM7||(Array.isArray(src._data?.features)&&src._data.features.length>0)))src.setData(SAFE_EMPTY_16221);lastSafeClearedM7=src||null}catch(_){ }
    lastSafeSourceM7=null;lastSafeFCM7=null;lastSafeKeyM7='';
    setSafeLayerVisibility16221(false);""",
    "clear only on actual retirement")
s = replace_once(s,
    "    try{const src=mp.getSource(SAFE_SOURCE_16221);if(!src?.setData)throw new Error('safe source setData unavailable');src.setData(fc)}catch(error){window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221=",
    """    let changedM7=false;
    try{const src=mp.getSource(SAFE_SOURCE_16221);if(!src?.setData)throw new Error('safe source setData unavailable');const md=model()||{},key=String(md.searchGen??'')+'|'+String(md.propertyPublication15816?.searchGen??'');changedM7=src!==lastSafeSourceM7||fc!==lastSafeFCM7||key!==lastSafeKeyM7||(Array.isArray(src._data?.features)&&src._data.features.length===0);if(changedM7){src.setData(fc);lastSafeSourceM7=src;lastSafeFCM7=fc;lastSafeKeyM7=key;lastSafeClearedM7=null;for(const id of Object.values(SAFE_LAYERS_16221)){if(mp.getLayer?.(id)&&mp.getPaintProperty?.(id,'line-opacity')===0)mp.setPaintProperty(id,'line-opacity',.98)}}}catch(error){window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221=""",
    "publish only changed verified source")
s = replace_once(s,
    "    for(const id of Object.values(SAFE_LAYERS_16221)){try{if(mp.getLayer?.(id)){mp.moveLayer?.(id);moved.push(id)}}catch(_){ }}",
    "    if(changedM7)for(const id of Object.values(SAFE_LAYERS_16221)){try{if(mp.getLayer?.(id)){mp.moveLayer?.(id);moved.push(id)}}catch(_){ }}",
    "no camera reordering")
s = replace_once(s,
    "    const audit={build:BUILD,reason,active,verified:true,count,sourceReady:true,layersReady:true,visible:ok,visibleLayers,moved,geometrySource:",
    "    const audit={build:BUILD,reason,active,verified:true,count,sourceReady:true,layersReady:true,visible:ok,visibleLayers,moved,sourceReuploaded:changedM7,geometrySource:",
    "fallback instrumentation")
s = replace_once(s,
    "const update=()=>requestAnimationFrame(()=>{ensureBuild();applyTierStyling();syncFullscreen()});for(const ev of ['style.load','zoomend','moveend','resize'])m.on(ev,update);",
    "const update=(ev)=>requestAnimationFrame(()=>{ensureBuild();const t=tier();if(ev==='style.load'||ev==='resize'||t!==lastTier||(t==='property'&&!map()?.getLayer?.(PROPERTY.ditch)))applyTierStyling();syncFullscreen()});for(const ev of ['style.load','zoomend','moveend','resize'])m.on(ev,()=>update(ev));",
    "avoid repeated tier owner on camera motion")

e = replace_once(e,
    "  const state={loaded:false,loading:null,manifest:null,all:[],active:[],lastSummary:null,dynamic:{worker:null,seq:0,pending:new Map(),key:'',result:null,promise:null,error:null,warmPromise:null,warmed:false,tileWarmKey:'',tileWarmPromise:null}};\n",
    """  const state={loaded:false,loading:null,manifest:null,all:[],active:[],lastSummary:null,dynamic:{worker:null,seq:0,pending:new Map(),key:'',result:null,promise:null,error:null,warmPromise:null,warmed:false,tileWarmKey:'',tileWarmPromise:null}};
  /* M7 temporary Elder Tree hover label; existing click details retain evidence distinctions. */
  let elderHoverPopupM7=null,elderHoverBoundM7=false;
  function dismissElderHoverM7(){try{elderHoverPopupM7?.remove()}catch(_){}elderHoverPopupM7=null}
""",
    "temporary Elder label state")
e = replace_once(e,
    "        m.on('click',LAYER,e=>{\n          const f=e?.features?.[0];",
    "        m.on('click',LAYER,e=>{\n          dismissElderHoverM7();\n          const f=e?.features?.[0];",
    "Elder click removes tooltip")
e = replace_once(e,
    "          const body='<div style=\"font:700 13px/1.25 system-ui,sans-serif;color:#17323d\">'+esc(title)+'</div>'+",
    """          const body='<div style="font:900 12px/1.2 system-ui,sans-serif;color:#245e39">ELDER TREE</div>'+
            '<div style="margin-top:4px;font:700 13px/1.25 system-ui,sans-serif;color:#17323d">'+esc(title)+'</div>'+""",
    "Elder details header")
e = replace_once(e,
    """        });
      }
      try{
        if(m.getLayer?.(LAYER)){""",
    """        });
      }
      if(!elderHoverBoundM7){
        elderHoverBoundM7=true;
        m.on('mouseenter',LAYER,e=>{
          const pt=e?.features?.[0]?.geometry?.coordinates;
          if(!Array.isArray(pt)||pt.length<2)return;
          dismissElderHoverM7();
          try{elderHoverPopupM7=new mapboxgl.Popup({closeButton:false,closeOnClick:false,offset:12,className:'earthline-elder-hover-m7'}).setLngLat(pt).setHTML('<span style="font:900 11px/1.2 Noto Sans,system-ui,sans-serif;color:#245e39;letter-spacing:.4px">ELDER TREE</span>').addTo(m)}catch(_){dismissElderHoverM7()}
        });
        m.on('mouseleave',LAYER,dismissElderHoverM7);
        m.on('movestart',dismissElderHoverM7);
      }
      try{
        if(m.getLayer?.(LAYER)){""",
    "temporary hover events")

index.write_bytes(s.encode("utf-8"))
elder_path.write_bytes(e.encode("utf-8"))
assert "sourceReuploaded:changedM7" in s
assert "ELDER TREE" in e and "mouseenter" in e
print("MANTRA7_PINNED_PATCH_SUCCEEDED", blob(index), blob(elder_path))
