from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
terms=['earthlineResolveLandValidity16584','function earthlineLandValidityMask16584','async function hydrology','function hydrology','EARTHLINE_LAND_VALIDITY_16584','landValidityPromise16584']
for term in terms:
    start=0;n=0
    while True:
        i=text.find(term,start)
        if i<0: break
        n+=1
        print(f'===== {term} hit {n} @ {i} =====')
        print(text[max(0,i-5000):min(len(text),i+16000)])
        start=i+len(term)
        if n>=8: break
