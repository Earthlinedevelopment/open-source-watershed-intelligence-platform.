from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")
original=s

# Ensure the country package creates an authoritative target.
old_crosshair="setPropertyTarget16201({lng:Number(loc.lng),lat:Number(loc.lat),source:'crosshair'},{openPanel:false});"
old_country="setPropertyTarget16201({lng:Number(loc.lng),lat:Number(loc.lat),source:'country-center'},{openPanel:false});"
new_country="""{
            const cc=countryPackage16845&&countryPackage16845.center;
            const targetLng=cc&&Number.isFinite(Number(cc.lng))?Number(cc.lng):Number(loc.lng);
            const targetLat=cc&&Number.isFinite(Number(cc.lat))?Number(cc.lat):Number(loc.lat);
            setPropertyTarget16201({lng:targetLng,lat:targetLat,source:'country-center'},{openPanel:false});
          }"""

if old_crosshair in s:
    s=s.replace(old_crosshair,new_country,1)
elif old_country in s:
    s=s.replace(old_country,new_country,1)
elif "const targetLng=cc&&Number.isFinite(Number(cc.lng))" not in s:
    raise SystemExit("country target anchor not found")

# Preserve that target through generic map-center reconciliation.
guard="if(existing&&existing.source==='country-center'&&window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845)return true;"
if guard not in s:
    anchor="const existing=window.EARTHLINE_PROPERTY_TARGET_16201;"
    pos=s.find(anchor)
    if pos < 0:
        raise SystemExit("syncPropertyTarget existing-target anchor not found")
    insert_at=pos+len(anchor)
    s=s[:insert_at]+"\n  "+guard+s[insert_at:]

required=[
    "source:'country-center'",
    "const targetLng=cc&&Number.isFinite(Number(cc.lng))",
    guard,
]
for item in required:
    if item not in s:
        raise SystemExit("post-patch verification failed: "+item)

if s==original:
    print("country crosshair persistence already present")
else:
    p.write_text(s,encoding="utf-8")
    print("patched authoritative country package center + persistence")

# inspect-final-owner trigger
