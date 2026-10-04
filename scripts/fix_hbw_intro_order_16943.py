from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')
a="take('The core idea');take('Why transparent limits matter');"
b="const intro=take('The idea in one minute');take('Why transparent limits matter');"
if a not in s: raise SystemExit('How Swales intro extractor not found')
s=s.replace(a,b,1)
a2="const sequence=[             take('What happens when water leaves too quickly'),"
b2="const sequence=[             intro,             take('What happens when water leaves too quickly'),"
if a2 not in s: raise SystemExit('How Swales sequence array not found')
s=s.replace(a2,b2,1)
p.write_text(s)
