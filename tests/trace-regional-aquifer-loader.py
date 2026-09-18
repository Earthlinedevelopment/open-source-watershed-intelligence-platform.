from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
for term in ['async function loadAquifers','function loadAquifers','regionalAquiferSource','regionalAquiferBoundaryClass','aquiferCount','loadAquifers(b']:
    start=0;n=0
    while True:
        i=text.find(term,start)
        if i<0: break
        n+=1
        print(f'===== {term} hit {n} @ {i} =====')
        print(text[max(0,i-4500):min(len(text),i+12500)])
        start=i+len(term)
        if n>=5: break
