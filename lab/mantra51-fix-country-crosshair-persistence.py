from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")
original=s

old_guard="if(existing&&existing.source==='country-center'&&window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845)return true;"
new_guard="if(existing&&existing.source==='country-center'&&window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845&&window.EARTHLINE_COUNTRY_TARGET_LOCK_16845!==false)return true;"
if old_guard in s:
    s=s.replace(old_guard,new_guard,1)
elif new_guard not in s:
    raise SystemExit("country-center persistence guard not found")

sync_anchor="function syncPropertyTargetFromMap16201(){"
unlock_block="""if(!window.EARTHLINE_COUNTRY_CROSSHAIR_UNLOCK_BOUND_16845){
  window.EARTHLINE_COUNTRY_CROSSHAIR_UNLOCK_BOUND_16845=true;
  document.addEventListener('pointerdown',function(ev){
    try{
      const mapEl=document.getElementById('map');
      if(mapEl&&(ev.target===mapEl||mapEl.contains(ev.target))){
        window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;
      }
    }catch(_){}
  },true);
}
"""
if unlock_block not in s:
    pos=s.find(sync_anchor)
    if pos<0:
        raise SystemExit("syncPropertyTargetFromMap16201 anchor not found")
    s=s[:pos]+unlock_block+s[pos:]

patterns=[
"""if(setTarget16845&&Number.isFinite(targetLng)&&Number.isFinite(targetLat)){
              setTarget16845({lng:targetLng,lat:targetLat,source:'country-center'},{openPanel:false});
            }""",
"""if(setTarget16845)setTarget16845({lng:Number(cc.lng),lat:Number(cc.lat),source:'country-center'},{openPanel:false});"""
]
repls=[
"""if(setTarget16845&&Number.isFinite(targetLng)&&Number.isFinite(targetLat)){
              window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=true;
              setTarget16845({lng:targetLng,lat:targetLat,source:'country-center'},{openPanel:false});
            }""",
"""if(setTarget16845){
            window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=true;
            setTarget16845({lng:Number(cc.lng),lat:Number(cc.lat),source:'country-center'},{openPanel:false});
          }"""
]
for old,new in zip(patterns,repls):
    if old in s:
        s=s.replace(old,new,1)

required=[
    new_guard,
    "EARTHLINE_COUNTRY_CROSSHAIR_UNLOCK_BOUND_16845",
    "window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false",
    "source:'country-center'",
    "source:'crosshair'"
]
for item in required:
    if item not in s:
        raise SystemExit("post-patch verification failed: "+item)

if s==original:
    print("interactive NZ crosshair release already present")
else:
    p.write_text(s,encoding="utf-8")
    print("patched: initial country center protected; user map gesture releases target to crosshair")
