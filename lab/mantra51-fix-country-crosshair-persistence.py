from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")
original=s

# Ensure the country package creates an authoritative target.
# Root cause: the old outer guard checked loc.lng/loc.lat, but atomic country
# package locations may carry the authoritative center separately. That meant
# the country-center assignment never executed and moveend kept writing crosshair.
outer_old="""if(typeof setPropertyTarget16201==='function'&&Number.isFinite(Number(loc.lng))&&Number.isFinite(Number(loc.lat))){
            {
            const cc=countryPackage16845&&countryPackage16845.center;
            const targetLng=cc&&Number.isFinite(Number(cc.lng))?Number(cc.lng):Number(loc.lng);
            const targetLat=cc&&Number.isFinite(Number(cc.lat))?Number(cc.lat):Number(loc.lat);
            setPropertyTarget16201({lng:targetLng,lat:targetLat,source:'country-center'},{openPanel:false});
          }
          }"""
outer_new="""{
          const cc=countryPackage16845&&countryPackage16845.center;
          const targetLng=cc&&Number.isFinite(Number(cc.lng))?Number(cc.lng):Number(loc.lng);
          const targetLat=cc&&Number.isFinite(Number(cc.lat))?Number(cc.lat):Number(loc.lat);
          if(typeof setPropertyTarget16201==='function'&&Number.isFinite(targetLng)&&Number.isFinite(targetLat)){
            setPropertyTarget16201({lng:targetLng,lat:targetLat,source:'country-center'},{openPanel:false});
          }
        }"""
if outer_old in s:
    s=s.replace(outer_old,outer_new,1)


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


# Reassert the authoritative country target at Regional core publication, after camera/setup writers.
publish_anchor="publishDisplayedRun16151(coreSnapshot16198);"
publish_patch="""publishDisplayedRun16151(coreSnapshot16198);
    if(countryPackage16845&&countryPackage16845.center){
      try{
        const cc=countryPackage16845.center;
        if(typeof setPropertyTarget16201==='function'&&Number.isFinite(Number(cc.lng))&&Number.isFinite(Number(cc.lat))){
          setPropertyTarget16201({lng:Number(cc.lng),lat:Number(cc.lat),source:'country-center'},{openPanel:false});
        }
      }catch(_){}
    }"""
if publish_patch not in s:
    if publish_anchor not in s:
        raise SystemExit("Regional core publication anchor not found")
    s=s.replace(publish_anchor,publish_patch,1)


# Country-package handoff must run for country profiles too.
# The prior !profile16549 guard excluded resolved country-* profiles, so the
# authoritative country center code never ran for NZ/India/Mexico.
country_if_old="if(!profile16549&&loc&&String(loc.placeType||'').toLowerCase()==='country'){"
country_if_new="if(loc&&String(loc.placeType||'').toLowerCase()==='country'){"
if country_if_old in s:
    s=s.replace(country_if_old,country_if_new,1)
elif country_if_new not in s and "const countryRequest16845=" not in s:
    raise SystemExit("country handoff condition anchor not found")

country_else_old="}else if(!profile16549&&window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556&&window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556.packageKind==='country'){"
country_else_new="}else if(window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556&&window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556.packageKind==='country'){"
if country_else_old in s:
    s=s.replace(country_else_old,country_else_new,1)


# Atomic country packages are valid even when .location is omitted.
# Country profiles can carry center/regionalExtent without a location object.
# The previous guard skipped the active package + target assignment entirely.
pkg_guard_old="if(countryPackage16845&&countryPackage16845.location){\n        loc=JSON.parse(JSON.stringify(countryPackage16845.location));"
pkg_guard_new="if(countryPackage16845){\n        if(countryPackage16845.location)loc=JSON.parse(JSON.stringify(countryPackage16845.location));"
if pkg_guard_old in s:
    s=s.replace(pkg_guard_old,pkg_guard_new,1)
elif pkg_guard_new not in s:
    raise SystemExit("country package validity guard anchor not found")


# Preserve country intent even when profile resolution mutates loc/placeType.
country_decl_old="let countryPackage16845=null;\n    if(loc&&String(loc.placeType||'').toLowerCase()==='country'){"
country_decl_new="""const countryProfileText16845=String(profile16549&&(
      profile16549.profileId||profile16549.id||profile16549.code||profile16549.name||profile16549
    )||'').toLowerCase();
    const countryRequest16845=!!(loc&&String(loc.placeType||'').toLowerCase()==='country')||countryProfileText16845.startsWith('country-');
    let countryPackage16845=null;
    if(countryRequest16845){"""
if country_decl_old in s:
    s=s.replace(country_decl_old,country_decl_new,1)
elif "const countryRequest16845=" not in s:
    raise SystemExit("country request intent anchor not found")

# At publication, use the current atomic country package even if the local handoff
# path did not retain the package object.
pub_old="""if(countryPackage16845&&countryPackage16845.center){
      try{
        const cc=countryPackage16845.center;
        if(typeof setPropertyTarget16201==='function'&&Number.isFinite(Number(cc.lng))&&Number.isFinite(Number(cc.lat))){
          setPropertyTarget16201({lng:Number(cc.lng),lat:Number(cc.lat),source:'country-center'},{openPanel:false});
        }
      }catch(_){}
    }"""
pub_new="""if(countryRequest16845){
      try{
        const cp=countryPackage16845||window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845||window.EARTHLINE_LAST_ATOMIC_COUNTRY_PACKAGE_16845||null;
        const cc=cp&&cp.center;
        if(cc&&typeof setPropertyTarget16201==='function'&&Number.isFinite(Number(cc.lng))&&Number.isFinite(Number(cc.lat))){
          window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556=cp;
          window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=cp;
          setPropertyTarget16201({lng:Number(cc.lng),lat:Number(cc.lat),source:'country-center'},{openPanel:false});
        }
      }catch(_){}
    }"""
if pub_old in s:
    s=s.replace(pub_old,pub_new,1)
elif "const cp=countryPackage16845||window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845" not in s:
    raise SystemExit("country publication fallback anchor not found")


# Temporary candidate audit for the country handoff owner.
audit_anchor="""const countryRequest16845=!!(loc&&String(loc.placeType||'').toLowerCase()==='country')||countryProfileText16845.startsWith('country-');
    let countryPackage16845=null;"""
audit_repl="""const countryRequest16845=!!(loc&&String(loc.placeType||'').toLowerCase()==='country')||countryProfileText16845.startsWith('country-');
    window.EARTHLINE_COUNTRY_HANDOFF_AUDIT_16845={stage:'intent',locPlaceType:String(loc&&loc.placeType||''),profileText:countryProfileText16845,countryRequest:countryRequest16845,at:new Date().toISOString()};
    let countryPackage16845=null;"""
if audit_anchor in s:
    s=s.replace(audit_anchor,audit_repl,1)
elif "EARTHLINE_COUNTRY_HANDOFF_AUDIT_16845" not in s:
    raise SystemExit("country audit anchor not found")

resolver_anchor="countryPackage16845=await earthlineResolveAtomicCountryPackage16845(q,loc);"
resolver_repl="""countryPackage16845=await earthlineResolveAtomicCountryPackage16845(q,loc);
      try{window.EARTHLINE_COUNTRY_HANDOFF_AUDIT_16845=Object.assign({},window.EARTHLINE_COUNTRY_HANDOFF_AUDIT_16845||{},{stage:'resolved',packageResolved:!!countryPackage16845,hasCenter:!!(countryPackage16845&&countryPackage16845.center),hasLocation:!!(countryPackage16845&&countryPackage16845.location),packageProfileId:String(countryPackage16845&&countryPackage16845.profileId||''),at:new Date().toISOString()})}catch(_){}"""
if resolver_anchor in s:
    s=s.replace(resolver_anchor,resolver_repl,1)

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
