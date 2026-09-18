from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
terms=[
 'Watershed and groundwater context are updating independently',
 'regionalLiveAquiferVisible',
 'cachedRegionalFeatures',
 'earthline-aquifers',
 'el-live-aquifer-15970',
 'EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_GEOJSON_16373',
 'groundwater context updated',
 'groundwater context'
]
for term in terms:
    start=0;n=0
    while True:
        i=text.find(term,start)
        if i<0: break
        n+=1
        print(f'===== {term} hit {n} @ {i} =====')
        print(text[max(0,i-5000):min(len(text),i+11000)])
        start=i+len(term)
        if n>=6: break
