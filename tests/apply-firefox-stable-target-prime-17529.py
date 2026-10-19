from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""window.EARTHLINE_PROPERTY_TARGET_16201={lng:Number(target.lng),lat:Number(target.lat),source:String(target.source||'crosshair'),code:target.code?String(target.code):'',score:Number(target.score||0),parentRunToken:parentRunToken16347||'',at:new Date().toISOString()};if(window.EARTHLINE_PROPERTY_TARGET_16201.code){try{void window.EARTHLINE_ELDER_TREES_V1_17097?.primePropertyEvidence?.()}catch(_){}}"""
new="""window.EARTHLINE_PROPERTY_TARGET_16201={lng:Number(target.lng),lat:Number(target.lat),source:String(target.source||'crosshair'),code:target.code?String(target.code):'',score:Number(target.score||0),parentRunToken:parentRunToken16347||'',at:new Date().toISOString()};"""
if s.count(old)!=1:
    raise SystemExit(f"setter prime anchor count={s.count(old)}")
s=s.replace(old,new,1)

old_sync="""if(existing&&existing.code){const lat0=Number(existing.lat),lng0=Number(existing.lng),lat=Number(c.lat),lng=Number(c.lng),dy=(lat-lat0)*111320,dx=(lng-lng0)*111320*Math.max(.05,Math.cos(lat0*Math.PI/180));if(Math.hypot(dx,dy)>18)return true;return prefetch17174(setPropertyTarget16201({lng,lat,source:'crosshair'},{openPanel:false}))}"""
new_sync="""if(existing&&existing.code){const lat0=Number(existing.lat),lng0=Number(existing.lng),lat=Number(c.lat),lng=Number(c.lng),dy=(lat-lat0)*111320,dx=(lng-lng0)*111320*Math.max(.05,Math.cos(lat0*Math.PI/180));if(Math.hypot(dx,dy)>18)return true;const ok17529=setPropertyTarget16201({lng,lat,source:'crosshair'},{openPanel:false});if(ok17529){try{void window.EARTHLINE_ELDER_TREES_V1_17097?.primePropertyEvidence?.()}catch(_){}}return prefetch17174(ok17529)}"""
if s.count(old_sync)!=1:
    raise SystemExit(f"sync anchor count={s.count(old_sync)}")
s=s.replace(old_sync,new_sync,1)

s="<!-- EARTHLINE_FIREFOX_STABLE_TARGET_PRIME_17529: exact Elder compute starts only after existing move-end owner finalizes corridor crosshair target; duplicate overlapping detector removed. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed stable-target Elder prime 17529")
