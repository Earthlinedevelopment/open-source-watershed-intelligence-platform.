from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
terms=['earthlineRenderRegionalOverlay16020','EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040','earthlineRegionalVectorOverlay16020']
for term in terms:
    start=0;n=0
    while True:
        i=text.find(term,start)
        if i<0: break
        n+=1
        print(f'===== {term} hit {n} @ {i} =====')
        print(text[max(0,i-9000):min(len(text),i+26000)])
        start=i+len(term)
        if n>=10: break
