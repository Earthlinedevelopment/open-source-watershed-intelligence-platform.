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

print("\n=== STATUS OWNER EXACT SOURCE ===")
needle='function evidence(){'
p=s.rfind(needle,0,5055000)
print('evidence offset',p)
if p>=0:print(s[p:p+5000])
print("\n=== STATUS OWNER CALL SITES ===")
p=5050000
for q in ['evidence()','function render','function update','EARTHLINE_EXCLUSION_EVIDENCE']:
 pos=0; hits=[]
 while True:
  z=s.find(q,pos)
  if z<0:break
  if z>5030000:hits.append(z)
  pos=z+1
 print(q,len(hits),[(i,s[max(0,i-110):i+260].replace("\n"," ")) for i in hits[:12]])

print("\n=== CANDIDATE V14 REPRODUCIBLE CHECKSUMS ===")
import subprocess, tempfile
with tempfile.TemporaryDirectory() as temp:
 out=str(Path(temp)/'candidate-v14.html')
 p=subprocess.run(['python3','tools/apply-swale-engine-candidate.py','index.html',out],text=True,capture_output=True)
 print('buildExit',p.returncode,'stdout',p.stdout,'stderr',p.stderr)
 if p.returncode:raise RuntimeError('Candidate v14 builder failed')
 for item in [out,'tools/adapter-16600.js','tools/apply-swale-engine-candidate.py','earthline-property-swales.js','earthline-property-swale-bridge.js']:
  data=Path(item).read_bytes()
  print('SHA256',hashlib.sha256(data).hexdigest(),'BYTES',len(data),'FILE',item)

print("\n=== PROPERTY TARGET AND CAMERA OWNERS ===")
for token in ['function syncPropertyTargetFromMap16201','function setPropertyTarget16201','earthlineDeclarePropertyAtCrosshair16173','Poudre Foothills Parcel','function earthlineSetSearchCameraLock']:
 p=0
 for k in range(8):
  i=s.find(token,p)
  if i<0:break
  print("\nTOKEN",repr(token),"offset",i,"context",s[max(0,i-900):i+4200])
  p=i+len(token)
