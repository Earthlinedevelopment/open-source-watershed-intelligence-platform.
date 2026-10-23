from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")
rules=[
'''#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="rgba(8,18,13,.96)"]{
  opacity:1!important;stroke-width:18px!important
}
''',
'''#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="#42ff83"]{
  opacity:1!important;stroke-width:12.5px!important;filter:url(#elGlow16020) drop-shadow(0 0 4px rgba(66,255,131,.55))!important
}
''',
'''#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="#ffc12f"]{
  opacity:1!important;stroke-width:10.5px!important;filter:url(#elGlow16020) drop-shadow(0 0 3px rgba(255,193,47,.46))!important
}
''',
'''#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="#ff8a2d"]{
  opacity:.98!important;stroke-width:8.5px!important;filter:url(#elGlow16020)!important
}
''',
'''#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="#e1ffeb"],
#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="#fff2b0"],
#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="#ffe0bd"]{
  opacity:.92!important;stroke-width:2px!important
}
'''
]
for i,r in enumerate(rules,1):
    n=s.count(r)
    if n!=1: raise SystemExit(f"REGIONAL_16060_RULE_{i}_COUNT={n}")
    s=s.replace(r,'',1)
p.write_text(s)
print("EARTHLINE_REGIONAL_16060_WIDTH_OVERRIDE_REMOVED")
