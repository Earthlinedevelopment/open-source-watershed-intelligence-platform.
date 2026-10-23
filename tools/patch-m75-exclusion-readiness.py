from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='strict')
old='  if(!earthlineMapActive())return {ready:false,status:"map-inactive",waitedMs:0};'
new='  const map15862B=(typeof earthlineMap!=="undefined"&&earthlineMap)?earthlineMap:null;\n  if(!map15862B||typeof map15862B.getStyle!=="function")return {ready:false,status:"map-unavailable",waitedMs:0};'
n=s.count(old)
if n != 1: raise SystemExit('READINESS_GUARD_COUNT='+str(n))
s=s.replace(old,new,1)
p.write_text(s)
print('EARTHLINE_M75_EXCLUSION_READINESS_PATCH_OK')