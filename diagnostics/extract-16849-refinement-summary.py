from pathlib import Path
import hashlib, re

s = Path('index.html').read_text(encoding='utf-8', errors='replace')
out=[]
out += [
  'EARTHLINE 16849 COMPACT REFINEMENT SUMMARY',
  'index_sha256='+hashlib.sha256(s.encode()).hexdigest(),
  'chars='+str(len(s)),
  ''
]
markers=['used16780','16787','16788','16816','16821']
for marker in markers:
    positions=[]
    p=0
    while True:
        i=s.find(marker,p)
        if i<0: break
        positions.append(i); p=i+len(marker)
    out.append('='*80)
    out.append(f'MARKER {marker} count={len(positions)}')
    for n,i in enumerate(positions[:12],1):
        line=s.count('\n',0,i)+1
        lo=max(0,i-2600); hi=min(len(s),i+5200)
        ctx=s[lo:hi]
        out.append(f'--- occurrence {n} char={i} line={line} context={lo}:{hi} ---')
        out.append(ctx)
        out.append('')

# Detect likely named owner declarations and calls near refinement markers.
rx=re.compile(r'(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>',re.M)
owners=[]
for m in rx.finditer(s):
    name=m.group(1) or m.group(2)
    if re.search(r'(refin|terrain|contour|regional|gap|dem|swale)',name,re.I):
        owners.append((m.start(),name))
out.append('='*80)
out.append('LIKELY OWNER DECLARATIONS')
for pos,name in owners[:120]:
    line=s.count('\n',0,pos)+1
    out.append(f'{name} char={pos} line={line}')

# Show every function/arrow owner whose declaration sits within 25k chars of used16780.
out.append('')
out.append('='*80)
out.append('OWNERS NEAR used16780')
used=[]; p=0
while True:
    i=s.find('used16780',p)
    if i<0: break
    used.append(i); p=i+1
for pos,name in owners:
    if any(abs(pos-u)<=25000 for u in used):
        out.append(f'{name} char={pos} line={s.count(chr(10),0,pos)+1}')

Path('diagnostics/16849-refinement-summary.txt').write_text('\n'.join(out),encoding='utf-8')
print('summary bytes',Path('diagnostics/16849-refinement-summary.txt').stat().st_size)
