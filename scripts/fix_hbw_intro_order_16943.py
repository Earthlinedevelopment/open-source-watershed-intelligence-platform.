from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(errors='ignore')
a="take('The core idea');take('Why transparent limits matter');"
b="const coreIntro16943=take('The idea in one minute');take('Why transparent limits matter');"
if a not in s: raise SystemExit('How Swales intro extractor not found')
s=s.replace(a,b,1)
pat=re.compile(r"const sequence=\[\s*take\('What happens when water leaves too quickly'\),")
s,n=pat.subn("const sequence=[ coreIntro16943, take('What happens when water leaves too quickly'),",s,count=1)
if n!=1: raise SystemExit('How Swales sequence array not found')
p.write_text(s)
