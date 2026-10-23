from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")
rules=[
'#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="rgba(8,18,13,.96)"]{stroke-width:20px!important;opacity:1!important}\n',
'#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="#42ff83"]{stroke-width:13.5px!important;opacity:1!important}\n',
'#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="#ffc12f"]{stroke-width:11.5px!important;opacity:1!important}\n',
'#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="#ff8a2d"]{stroke-width:9.5px!important;opacity:1!important}\n'
]
for i,r in enumerate(rules,1):
    n=s.count(r)
    if n!=1: raise SystemExit(f"REGIONAL_WIDTH_RULE_{i}_COUNT={n}")
    s=s.replace(r,'',1)
p.write_text(s)
print("EARTHLINE_REGIONAL_WIDTH_OVERRIDE_REMOVED")
