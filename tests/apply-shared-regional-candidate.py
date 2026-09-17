from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

replacements = [
    (
        'spacingPrimary',
        'const chosen=[],primarySpacing=Math.max(6,Math.round(hy.w/31));',
        'const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));',
    ),
    (
        'spacingSecondary',
        'const spacing=chosen.length<20?primarySpacing:Math.max(4,Math.round(primarySpacing*.72));',
        'const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));',
    ),
    (
        'screenCacheDecl',
        '    function screenJurisdictionCandidate16539(candidate16539){',
        '    const jurisdictionScreenCache16592=new WeakMap();\n    function screenJurisdictionCandidate16539(candidate16539){',
    ),
    (
        'screenCacheLookup',
        '      if(focusMode||!jurisdictionGeometry16539)return candidate16539;\n      const runs16539=earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);',
        '      if(focusMode||!jurisdictionGeometry16539)return candidate16539;\n      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);\n      const runs16539=earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);',
    ),
    (
        'cacheNullRuns',
        '      if(!runs16539.length)return null;',
        '      if(!runs16539.length){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}',
    ),
    (
        'cacheNullSegment',
        '      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10)return null;',
        '      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}',
    ),
    (
        'cacheNullGrid',
        '      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y))return null;',
        '      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}',
    ),
    (
        'cacheResultStart',
        '      return Object.assign({},candidate16539,{',
        '      const screenedCandidate16592=Object.assign({},candidate16539,{',
    ),
    (
        'cacheResultEnd',
        '        jurisdiction_screened:true\n      });\n    }\n    function jurisdictionEligibleCount16539',
        '        jurisdiction_screened:true\n      });\n      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screenedCandidate16592);\n      return screenedCandidate16592;\n    }\n    function jurisdictionEligibleCount16539',
    ),
    (
        'clipDuplicatePointTest',
        'const safe=run.filter(p=>earthlinePointInJurisdiction16539(p,g));if(safe.length>=2)',
        'const safe=run;if(safe.length>=2)',
    ),
    (
        'terrainStagger',
        '        stagger=setTimeout(startAlternate,250);',
        '        stagger=setTimeout(startAlternate,1200);',
    ),
]

for name, old, new in replacements:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{name}: expected exactly 1 source match, found {count}')
    text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
print(f'Applied {len(replacements)} exact shared Regional candidate replacements to index.html')
