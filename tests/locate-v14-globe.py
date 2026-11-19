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

print("\n=== initRealGlobe16233 all callers ===")
p=0
while True:
 m=s.find("initRealGlobe16233(",p)
 if m<0:break
 print("offset",m,"context",s[max(0,m-900):m+1100].replace("\n"," "))
 p=m+1

print("\n=== SCIENTIFIC STATUS/COUNT TEXT ===")
for token in ["publication must remain blocked","publication blocked","No qualifying swales","proposed swale alignments","exclusion evidence","exclusionVerified"]:
 print("\nSEARCH",token)
 start=0
 for hit in range(15):
  p=s.lower().find(token.lower(),start)
  if p<0:break
  print("offset",p,"line",s.count("\n",0,p)+1,s[max(0,p-400):p+480].replace("\n"," "))
  start=p+len(token)
