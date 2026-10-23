from pathlib import Path

p=Path("index.html")
s=p.read_text(errors="strict")

old="const maxGapM17700=Math.min(12,Math.max(5,targetSpacingM15771*1.25));"
new="const maxGapM17700=Math.min(24,Math.max(12,targetSpacingM15771*3));"
n=s.count(old)
if n!=1:
    raise SystemExit(f"PATCH_GAP_COUNT={n}")
s=s.replace(old,new,1)

p.write_text(s)
print("EARTHLINE_M75_PROPERTY_LONG_JOIN_PATCH_OK")
