from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
terms=['async function loadDEM','function loadDEM','loadDEM(b,openGrid16201','terrainProductsAndPublishMs','swaleCandidateContours16609','makeFlows(hy','makeContours(hy','makeSwales(hy']
for term in terms:
    start=0;n=0
    while True:
        i=text.find(term,start)
        if i<0: break
        n+=1
        print(f'===== {term} hit {n} @ {i} =====')
        print(text[max(0,i-5000):min(len(text),i+14000)])
        start=i+len(term)
        if n>=8: break
