from pathlib import Path
import re
s=Path('index.html').read_text(encoding='utf-8')
out=[]
patterns=[
 r'.{0,5000}Math\.(?:min|max)\([^\n;]{0,160}\b18\b[^\n;]{0,160}\).{0,5000}',
 r'.{0,5000}\b14\b.{0,5000}',
 r'.{0,5000}bbox[^\n]{0,500}span.{0,5000}',
 r'.{0,5000}span[^\n]{0,500}bbox.{0,5000}',
 r'.{0,5000}analysisBBox.{0,5000}'
]
seen=set()
for pi,p in enumerate(patterns):
    for m in re.finditer(p,s,re.S|re.I):
        text=m.group(0)
        if text in seen: continue
        seen.add(text)
        if pi==1 and not any(x in text.lower() for x in ['bbox','bounds','terrain','regional','dem']): continue
        out.append(f'===== PATTERN {pi} AT {m.start()} =====\n{text}\n')
        if len(out)>=80: break
    if len(out)>=80: break
Path('mantra50-bounds-extract.txt').write_text('\n'.join(out),encoding='utf-8')
print('matches',len(out))
