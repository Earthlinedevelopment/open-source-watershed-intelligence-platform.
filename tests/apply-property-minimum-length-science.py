from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "index.html")
s = path.read_text(encoding="utf-8")

old = '''function earthlineMinimumSwaleLengthM15768(){
  const cell=Math.max(0.25,Number(M.cellM||1));
  return Math.max(12,Math.min(40,cell*4));
}'''
new = '''function earthlineMinimumSwaleLengthM15768(){
  const cell=Math.max(0.25,Number(M.cellM||1));
  if(!earthlineLargeAreaMode())return 6;
  return Math.max(12,Math.min(40,cell*4));
}'''

if s.count(old) != 1:
    raise SystemExit(f"expected one minimum-length science owner; found {s.count(old)}")
s=s.replace(old,new)

geometry_old = "if(!pts||pts.length<3||lenM<12)return false;"
geometry_new = "if(!pts||pts.length<3||lenM<earthlineMinimumSwaleLengthM15768())return false;"
if s.count(geometry_old) != 1:
    raise SystemExit(f"expected one geometry minimum-length owner; found {s.count(geometry_old)}")
s=s.replace(geometry_old, geometry_new)

path.write_text(s,encoding="utf-8")
print("PROPERTY_MINIMUM_LENGTH_SCIENCE_READY")
