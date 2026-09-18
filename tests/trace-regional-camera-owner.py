from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
terms=['async function settleRegionalCamera','function settleRegionalCamera','settleRegionalCamera(','cameraSettle16310','cameraKickoffMs','fitBounds','easeTo({center','flyTo({center']
for term in terms:
    start=0;n=0
    while True:
        i=text.find(term,start)
        if i<0: break
        n+=1
        print(f'===== {term} hit {n} @ {i} =====')
        print(text[max(0,i-8000):min(len(text),i+20000)])
        start=i+len(term)
        if n>=10: break
