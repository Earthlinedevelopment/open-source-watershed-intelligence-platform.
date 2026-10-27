from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
needle='makeSwales('
start=0
out=[]
n=0
while True:
    i=src.find(needle,start)
    if i<0: break
    n+=1
    lo=max(0,i-1200); hi=min(len(src),i+2600)
    out.append(f'===== HIT {n} CHARS {lo}-{hi} =====\n'+src[lo:hi])
    start=i+1
Path('makeswales-callers-17297.txt').write_text('\n\n'.join(out),encoding='utf-8')
print('hits',n)
