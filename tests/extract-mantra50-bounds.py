from pathlib import Path
s=Path('index.html').read_text(encoding='utf-8')
out=[]
needles=['const visualData={runToken,query:q,bounds:b','regionalCapacity16755=','const {elev,w,h,bounds:b}=dem','async function runRegional','function runRegional']
for term in needles:
    start=0
    while True:
        i=s.find(term,start)
        if i<0: break
        start=i+1
        a=max(0,i-70000); b=min(len(s),i+12000)
        out.append(f'===== {term} AT {i} =====\n{s[a:b]}\n')
        if len(out)>=12: break
    if len(out)>=12: break
Path('mantra50-bounds-extract.txt').write_text('\n'.join(out),encoding='utf-8')
print('matches',len(out))
