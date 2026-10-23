from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")
old="""  function mapReady(){
    return !!(typeof earthlineMap!=="undefined"&&earthlineMap&&earthlineMap.isStyleLoaded&&earthlineMap.isStyleLoaded());
  }"""
new="""  function mapReady(){
    if(!(typeof earthlineMap!=="undefined"&&earthlineMap))return false;
    try{return typeof earthlineMap.getStyle==="function"&&!!earthlineMap.getStyle()}catch(_){return false}
  }"""
n=s.count(old)
if n!=1: raise SystemExit("MAP_READY_COUNT="+str(n))
s=s.replace(old,new,1)
p.write_text(s)
print("EARTHLINE_LIVING_RENDERER_READY_PATCH_OK")
