from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    try{const src=mp.getSource(SAFE_SOURCE_16221);if(!src?.setData)throw new Error('safe source setData unavailable');src.setData(fc)}catch(error){window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221={build:BUILD,reason,active,verified:true,count,visible:false,error:String(error?.message||error),at:new Date().toISOString()};return {ok:false,count,visible:false,active,error:String(error?.message||error)}}"""
new="""    try{const src=mp.getSource(SAFE_SOURCE_16221);if(!src?.setData)throw new Error('safe source setData unavailable');const sig16221=String(runSerial)+'|'+String(count);if(src.__earthlineSafeRunSignature16221!==sig16221){src.setData(fc);src.__earthlineSafeRunSignature16221=sig16221}}catch(error){window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221={build:BUILD,reason,active,verified:true,count,visible:false,error:String(error?.message||error),at:new Date().toISOString()};return {ok:false,count,visible:false,active,error:String(error?.message||error)}}"""
if s.count(old)!=1:
    raise SystemExit(f"EARTHLINE 17702 anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("EARTHLINE_17702_SAFE_SOURCE_IDEMPOTENCE_APPLIED")
