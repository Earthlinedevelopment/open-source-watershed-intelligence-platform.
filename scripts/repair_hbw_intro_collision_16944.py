from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')
a="const intro=take('The idea in one minute');"
b="const coreIntro16944=take('The idea in one minute');"
if a not in s: raise SystemExit('colliding intro owner not found')
s=s.replace(a,b,1)
a2="const sequence=[ intro,"
b2="const sequence=[ coreIntro16944,"
if a2 not in s: raise SystemExit('colliding sequence owner not found')
s=s.replace(a2,b2,1)
p.write_text(s)
