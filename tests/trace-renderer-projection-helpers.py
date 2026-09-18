from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
for term in ['function points','const points','function project','const project','map.project','earthlineRegionalVectorOverlay16020']:
    start=0;n=0
    while True:
        i=text.find(term,start)
        if i<0: break
        n+=1
        print(f'===== {term} hit {n} @ {i} =====')
        print(text[max(0,i-5000):min(len(text),i+10000)])
        start=i+len(term)
        if n>=12: break
