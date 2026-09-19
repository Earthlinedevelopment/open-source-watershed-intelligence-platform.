from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
for anchor in ['function makeSwales(','function earthlineClipRegionalProducts16539(','function earthlineClipFeatureCollection16539(','function earthlineClipLine16539(','function earthlineRerankRegionalSwales16539(']:
    i=src.find(anchor)
    print('\n===== '+anchor+' @ '+str(i)+' =====')
    if i>=0:
        print(src[max(0,i-500):min(len(src),i+16000)])
