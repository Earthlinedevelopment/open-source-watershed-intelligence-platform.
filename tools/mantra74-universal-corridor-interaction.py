from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s

old="    try{document.documentElement.classList.toggle('earthline-alaska-map-interaction-16921',String(activePackage16556&&activePackage16556.profileId||'')==='us-ak');}catch(_){}\n"
if s.count(old)!=1: raise RuntimeError("Alaska class owner count "+str(s.count(old)))
s=s.replace(old,"",1)

for old_css in [
'html.earthline-alaska-map-interaction-16921 #earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070,html.earthline-alaska-map-interaction-16921 #earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149{pointer-events:none!important;cursor:default!important}\n',
'html.earthline-alaska-map-interaction-16921 #earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070{pointer-events:none!important;cursor:default!important}\n'
]:
    if s.count(old_css)!=1: raise RuntimeError("Alaska CSS count "+str(s.count(old_css)))
    s=s.replace(old_css,"",1)

if "earthline-alaska-map-interaction-16921" in s:
    raise RuntimeError("Alaska-specific interaction owner remains")

p.write_text(s,encoding="utf-8")
print("EARTHLINE_17691_UNIVERSAL_CORRIDOR_INTERACTION",len(before),len(s),len(before)-len(s))

# trigger
