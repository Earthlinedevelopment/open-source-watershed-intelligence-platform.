#!/usr/bin/env python3
"""Read-only source locator, no production mutation."""
from pathlib import Path
import re,hashlib
s=Path('index.html').read_text(encoding='utf-8')
print('BASE_HASH',hashlib.sha256(s.encode()).hexdigest(),'BYTES',len(s.encode()))
patterns=[
  r'globe.{0,25}(?:intro|animation|opening|start|fly|ease)',
  r'(?:intro|animation|opening|start|fly|ease).{0,25}globe',
  r'\b(?:18|18\.0)\s*[,}]\s*0(?:\.0)?\b',
  r'\b0(?:\.0)?\s*[,}]\s*18(?:\.0)?\b',
  r'(?:flyTo|easeTo|jumpTo)\s*\(',r'globe',r'earthlineGlobe',r'startIntro',
  r'\bopening\b',r'\bintro\b'
]
for pattern in patterns:
 hits=list(re.finditer(pattern,s,re.I|re.S))
 print('\n=== PATTERN',pattern,'TOTAL',len(hits),'===')
 for m in hits[:20]:
  start=max(0,m.start()-250);end=min(len(s),m.end()+420)
  print('--- @',m.start(),'line',s.count('\n',0,m.start())+1,'---',re.sub(r'\s+',' ',s[start:end])[:680])

print("\\n=== STARTUP CAMERA EXACT SOURCES ===")
for token in ["m.jumpTo({center:[0,18],zoom:1.25", "earthlineMap.on(\"load\",()=>", "function earthlineSettleGlobeSplash16171", "function earthlineEnterGlobe", "function earthlineShowGlobe", "function earthlineSetGlobe"]:
  i=s.find(token)
  print("\\nTOKEN",repr(token),"offset",i,"line",s.count("\\n",0,i)+1 if i>=0 else -1)
  if i>=0:
    print(s[max(0,i-2400):min(len(s),i+2300)])
