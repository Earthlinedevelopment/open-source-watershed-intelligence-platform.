from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
terms=['earthlineInheritRegionalAquiferContext16334','fetchUSGSAquifers','currentMapBBox','EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556','regionalLiveAquiferVisible','cachedRegionalFeatures']
for term in terms:
    start=0;n=0
    while True:
        i=text.find(term,start)
        if i<0: break
        n+=1
        print(f'===== {term} hit {n} @ {i} =====')
        print(text[max(0,i-3500):min(len(text),i+8000)])
        start=i+len(term)
        if n>=8: break
