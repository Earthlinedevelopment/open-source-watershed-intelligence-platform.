from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
for anchor in ['function earthlinePrepareJurisdiction16539(','const earthlinePreparedJurisdictionCache16539','function earthlineBoundaryPoint16539(','function earthlinePointInRing16539(']:
    i=src.find(anchor)
    print('\n===== '+anchor+' @ '+str(i)+' =====')
    if i>=0: print(src[max(0,i-800):min(len(src),i+6500)])
