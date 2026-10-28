from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="    let levelStepRaw=medSlope*(isRegionalTile15769?targetSpacingM15771:targetSpacingM15771*.5);"
new="    let levelStepRaw=medSlope*(isRegionalTile15769?targetSpacingM15771:targetSpacingM15771*.4);"
count=s.count(old)
if count != 1:
    raise SystemExit(f"Property contour-density owner count={count}")
p.write_text(s.replace(old,new),encoding="utf-8")
