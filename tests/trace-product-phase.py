from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
anchors=['function earthlineClipLine16539(','function earthlineClipFeatureCollection16539(','function earthlinePointInJurisdiction16539(','const finalFeatures16167=']
for anchor in anchors:
    i=src.find(anchor)
    print('\n===== '+anchor+' @ '+str(i)+' =====')
    if i>=0: print(src[i:min(len(src),i+6500)])
