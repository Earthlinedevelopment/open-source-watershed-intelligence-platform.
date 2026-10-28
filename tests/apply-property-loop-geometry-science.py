from pathlib import Path
import sys
path=Path(sys.argv[1] if len(sys.argv)>1 else "index.html")
s=path.read_text(encoding="utf-8")
old='const loopish=gapM<Math.max(8,lenM*0.12);'
new='const loopish=gapM<(earthlineLargeAreaMode()?Math.max(8,lenM*0.12):Math.max(2,lenM*0.12));'
if s.count(old)!=1:
    raise SystemExit(f"expected one loop geometry owner; found {s.count(old)}")
s=s.replace(old,new)
path.write_text(s,encoding="utf-8")
print("PROPERTY_LOOP_GEOMETRY_SCIENCE_READY")
