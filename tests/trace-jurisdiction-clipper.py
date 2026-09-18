from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
for term in ['function earthlineClipRegionalProducts16539','function earthlineClipLine16539','function earthlinePointInJurisdiction16539']:
    i=text.find(term)
    print(f'===== {term} @ {i} =====')
    if i>=0: print(text[i:min(len(text),i+22000)])
