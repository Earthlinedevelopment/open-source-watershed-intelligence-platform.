from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

css_anchor="#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070,#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149{pointer-events:all!important;cursor:pointer!important}"
css_new=css_anchor+"\nhtml.earthline-alaska-map-interaction-16921 #earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070{pointer-events:none!important;cursor:default!important}"
if "earthline-alaska-map-interaction-16921 #earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070" not in s:
    if css_anchor not in s: raise SystemExit("regional swale hit CSS anchor missing")
    s=s.replace(css_anchor,css_new,1)

js_anchor="const activePackage16556=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null;"
js_new=js_anchor+"\n    try{document.documentElement.classList.toggle('earthline-alaska-map-interaction-16921',String(activePackage16556&&activePackage16556.profileId||'')==='us-ak');}catch(_){}"
if "classList.toggle('earthline-alaska-map-interaction-16921'" not in s:
    if js_anchor not in s: raise SystemExit("active package anchor missing")
    s=s.replace(js_anchor,js_new,1)

if "earthline-alaska-map-interaction-16921" not in s: raise SystemExit("Alaska interaction patch missing")
p.write_text(s,encoding="utf-8")
print("patched Alaska-only swale hit-path pointer pass-through")

# trigger Alaska interaction repair
