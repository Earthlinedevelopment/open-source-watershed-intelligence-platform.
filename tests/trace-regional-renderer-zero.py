from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
for term in ['earthlineRenderRegionalOverlay16020','EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040','earthlineRegionalVectorOverlay16020','swaleLines']:
    start=0;n=0
    while True:
        i=text.find(term,start)
        if i<0: break
        n+=1
        print(f'===== {term} hit {n} @ {i} =====')
        print(text[max(0,i-7000):min(len(text),i+18000)])
        start=i+len(term)
        if n>=8: break
