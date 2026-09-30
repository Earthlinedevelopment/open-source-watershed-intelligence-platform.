from pathlib import Path
s=Path('index.html').read_text(encoding='utf-8')
out=[]
needles=['18','14','bbox','bounds','analysisBBox','regionalExtent']
seen=[]
for term in ['18','14','bbox','bounds']:
    start=0
    while True:
        i=s.find(term,start)
        if i<0: break
        start=i+len(term)
        a=max(0,i-2400); b=min(len(s),i+3200); text=s[a:b]
        low=text.lower()
        if 'bbox' not in low and 'bounds' not in low: continue
        if 'regional' not in low and 'terrain' not in low and 'dem' not in low and 'analysisbbox' not in low: continue
        key=(a,b)
        if any(abs(a-x)<600 for x,_ in seen): continue
        seen.append(key)
        out.append(f'===== {term} AT {i} =====\n{text}\n')
        if len(out)>=60: break
    if len(out)>=60: break
Path('mantra50-bounds-extract.txt').write_text('\n'.join(out),encoding='utf-8')
print('matches',len(out))
