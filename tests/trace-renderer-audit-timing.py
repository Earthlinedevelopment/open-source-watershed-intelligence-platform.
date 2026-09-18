from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
terms=['function render()','function render16020','EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040','earthlineRenderRegionalOverlay16020=function','requestAnimationFrame','scheduled=']
for term in terms:
    start=0;n=0
    while True:
        i=text.find(term,start)
        if i<0: break
        n+=1
        print(f'===== {term} hit {n} @ {i} =====')
        print(text[max(0,i-5000):min(len(text),i+15000)])
        start=i+len(term)
        if n>=6: break
