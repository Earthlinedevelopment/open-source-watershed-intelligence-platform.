from pathlib import Path
import re
text=Path('index.html').read_text(encoding='utf-8')
i=text.find('function makeSwales')
if i<0: raise SystemExit('makeSwales not found')
block=text[i:min(len(text),i+70000)]
for term in ['fallback','coverage','bucket','quadrant','sector','bin','density','distribution','gap','hole','preferredEligibleCount16539','relaxedFractions','chosen=[]','primarySpacing']:
    print(f'===== TERM {term} =====')
    for m in list(re.finditer(re.escape(term),block,re.I))[:20]:
        p=m.start(); print(block[max(0,p-1200):min(len(block),p+2600)])
