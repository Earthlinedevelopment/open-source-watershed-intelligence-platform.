from pathlib import Path
import hashlib
s=Path('index.html').read_text(encoding='utf-8',errors='replace')
out=['EARTHLINE 16849 STAGE-PAIR EXTRACT','sha256='+hashlib.sha256(s.encode()).hexdigest(),'']
for marker in ['16702','16780','refined16702','tile16702','fineOpportunity16780']:
    pos=[]; p=0
    while True:
        i=s.find(marker,p)
        if i<0: break
        pos.append(i); p=i+len(marker)
    out.append('='*72); out.append(f'{marker} count={len(pos)}')
    # Keep only a bounded set; every 16702 occurrence gets a short context, while 16780 owner gets longer context.
    for n,i in enumerate(pos[:30],1):
        radius_before=1800 if marker!='16780' else 2600
        radius_after=4200 if marker!='16780' else 5200
        out.append(f'--- {n} char={i} line={s.count(chr(10),0,i)+1} ---')
        out.append(s[max(0,i-radius_before):min(len(s),i+radius_after)])
        out.append('')
# Also list nearby DEM refinement calls with their containing marker neighborhood.
out.append('='*72); out.append('loadDEM calls near 16702/16780')
allmarks=[]
for marker in ['16702','16780']:
    p=0
    while True:
        i=s.find(marker,p)
        if i<0: break
        allmarks.append(i); p=i+len(marker)
p=0
calls=[]
while True:
    i=s.find('loadDEM(',p)
    if i<0: break
    if any(abs(i-m)<18000 for m in allmarks): calls.append(i)
    p=i+8
for n,i in enumerate(calls[:50],1):
    out.append(f'--- loadDEM {n} char={i} line={s.count(chr(10),0,i)+1} ---')
    out.append(s[max(0,i-1200):min(len(s),i+2200)])
Path('diagnostics/16849-stage-pairs.txt').write_text('\n'.join(out),encoding='utf-8')
print('markers',len(allmarks),'nearby loadDEM',len(calls),'bytes',Path('diagnostics/16849-stage-pairs.txt').stat().st_size)
