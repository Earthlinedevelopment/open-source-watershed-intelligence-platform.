from pathlib import Path
import sys
path=Path(sys.argv[1] if len(sys.argv)>1 else "index.html")
s=path.read_text(encoding="utf-8")
old='''    const targetSpacingM15771=isRegionalTile15769
      ?Math.max(24,Math.min(60,Math.max(1,M.cellM||1)*4))
      :TARGET_M;'''
new='''    const targetSpacingM15771=isRegionalTile15769
      ?Math.max(24,Math.min(60,Math.max(1,M.cellM||1)*4))
      :MIN_M;'''
if s.count(old)!=1:
    raise SystemExit(f"expected one Property target-spacing owner; found {s.count(old)}")
s=s.replace(old,new)
path.write_text(s,encoding="utf-8")
print("PROPERTY_15FT_TARGET_SPACING_SCIENCE_READY")
