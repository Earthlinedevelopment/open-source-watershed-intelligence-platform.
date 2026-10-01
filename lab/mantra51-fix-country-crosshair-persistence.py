from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")
original=s

old_country="setPropertyTarget16201({lng:Number(loc.lng),lat:Number(loc.lat),source:'crosshair'},{openPanel:false});"
new_country="setPropertyTarget16201({lng:Number(loc.lng),lat:Number(loc.lat),source:'country-center'},{openPanel:false});"
if old_country in s:
    s=s.replace(old_country,new_country,1)
elif new_country not in s:
    raise SystemExit("country target anchor not found")

guard="if(existing&&existing.source==='country-center'&&window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845)return true;"
if guard not in s:
    anchor="const existing=window.EARTHLINE_PROPERTY_TARGET_16201;"
    pos=s.find(anchor)
    if pos < 0:
        raise SystemExit("syncPropertyTarget existing-target anchor not found")
    insert_at=pos+len(anchor)
    s=s[:insert_at]+"\n  "+guard+s[insert_at:]

if s==original:
    print("country crosshair persistence already present")
else:
    p.write_text(s,encoding="utf-8")
    print("patched country crosshair persistence")

for required in (new_country,guard):
    if required not in s:
        raise SystemExit("post-patch verification failed: "+required)

# trigger 2026-10-01 authoritative country-center persistence

# inspect trigger 2026-10-01T04:50
