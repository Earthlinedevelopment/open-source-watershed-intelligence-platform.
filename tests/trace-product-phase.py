from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
anchors=[
'const preferredEligibleCount16539=jurisdictionEligibleCount16539(candidates);',
'const candidatesBeforeJurisdiction16539=candidates.length;',
'const auditedCandidates=chosen.map',
'const publishableCandidates16167=',
'EARTHLINE_SWALE_GENERATION_AUDIT_16167',
"return {type:'FeatureCollection',features"
]
for anchor in anchors:
    i=src.find(anchor,src.find('function makeSwales('))
    print('\n===== '+anchor+' @ '+str(i)+' =====')
    if i>=0: print(src[max(src.find('function makeSwales('),i-1800):min(len(src),i+7000)])
