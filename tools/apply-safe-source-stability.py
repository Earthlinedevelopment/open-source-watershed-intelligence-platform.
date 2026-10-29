from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
locked="const thr=streamThreshold(),chanThr=Math.max(thr*3.2,Number(M.maxAcc||0)*0.06),maxS=4;"
if locked not in s:
    raise SystemExit("locked <=4% active Property science missing")

old="""  function clearSafePropertyFallback16221(reason='clear'){
    const mp=map();
    try{const src=mp?.getSource?.(SAFE_SOURCE_16221);if(src?.setData)src.setData(SAFE_EMPTY_16221)}catch(_){ }
    setSafeLayerVisibility16221(false);"""
new="""  function clearSafePropertyFallback16221(reason='clear'){
    const mp=map();
    try{const src=mp?.getSource?.(SAFE_SOURCE_16221);if(src?.setData)src.setData(SAFE_EMPTY_16221)}catch(_){ }
    window.EARTHLINE_PROPERTY_SAFE_SOURCE_SIGNATURE_17701='';
    setSafeLayerVisibility16221(false);"""
if s.count(old)!=1:
    raise SystemExit(f"clear safe source anchor count {s.count(old)}")
s=s.replace(old,new,1)

old2="""    try{const src=mp.getSource(SAFE_SOURCE_16221);if(!src?.setData)throw new Error('safe source setData unavailable');src.setData(fc)}catch(error){window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221={build:BUILD,reason,active,verified:true,count,visible:false,error:String(error?.message||error),at:new Date().toISOString()};return {ok:false,count,visible:false,active,error:String(error?.message||error)}}"""
new2="""    try{
      const src=mp.getSource(SAFE_SOURCE_16221);
      if(!src?.setData)throw new Error('safe source setData unavailable');
      const md17701=model()||{},pub17701=md17701.propertyPublication15816||{};
      const sig17701=[Number(md17701.searchGen||0),Number(pub17701.searchGen||0),count].join('|');
      if(String(window.EARTHLINE_PROPERTY_SAFE_SOURCE_SIGNATURE_17701||'')!==sig17701){
        src.setData(fc);
        window.EARTHLINE_PROPERTY_SAFE_SOURCE_SIGNATURE_17701=sig17701;
      }
    }catch(error){window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221={build:BUILD,reason,active,verified:true,count,visible:false,error:String(error?.message||error),at:new Date().toISOString()};return {ok:false,count,visible:false,active,error:String(error?.message||error)}}"""
if s.count(old2)!=1:
    raise SystemExit(f"safe source publication anchor count {s.count(old2)}")
s=s.replace(old2,new2,1)

p.write_text(s,encoding="utf-8")
print("stabilized safe Property source publication")
