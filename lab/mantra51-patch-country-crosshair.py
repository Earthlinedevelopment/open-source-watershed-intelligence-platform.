from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# 1) Country package target must be authoritative and distinguishable from a user-moved crosshair.
old1="""      if(countryPackage16845&&countryPackage16845.location){
        loc=JSON.parse(JSON.stringify(countryPackage16845.location));
        window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556=countryPackage16845;
        window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=countryPackage16845;
        try{
          if(typeof setPropertyTarget16201==='function'&&Number.isFinite(Number(loc.lng))&&Number.isFinite(Number(loc.lat))){
            setPropertyTarget16201({lng:Number(loc.lng),lat:Number(loc.lat),source:'crosshair'},{openPanel:false});
          }
        }catch(_){}
      }
"""
new1="""      if(countryPackage16845&&countryPackage16845.location){
        loc=JSON.parse(JSON.stringify(countryPackage16845.location));
        window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556=countryPackage16845;
        window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=countryPackage16845;
        try{
          if(typeof setPropertyTarget16201==='function'&&Number.isFinite(Number(loc.lng))&&Number.isFinite(Number(loc.lat))){
            setPropertyTarget16201({lng:Number(loc.lng),lat:Number(loc.lat),source:'country-center'},{openPanel:false});
          }
        }catch(_){}
      }
"""
if old1 in s:
    s=s.replace(old1,new1,1)
elif "source:'country-center'" not in s:
    raise SystemExit('country package handoff anchor not found')

# 2) Prevent generic map-center reconciliation from overwriting the authoritative country target.
old2="""  const existing=window.EARTHLINE_PROPERTY_TARGET_16201;
  if(existing&&existing.code)return true;
  return setPropertyTarget16201({lng:Number(c.lng),lat:Number(c.lat),source:'crosshair'},{openPanel:false})
"""
new2="""  const existing=window.EARTHLINE_PROPERTY_TARGET_16201;
  if(existing&&existing.code)return true;
  if(existing&&existing.source==='country-center'&&window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845)return true;
  return setPropertyTarget16201({lng:Number(c.lng),lat:Number(c.lat),source:'crosshair'},{openPanel:false})
"""
if old2 in s:
    s=s.replace(old2,new2,1)
elif "existing.source==='country-center'" not in s:
    raise SystemExit('syncPropertyTargetFromMap16201 anchor not found')

p.write_text(s,encoding='utf-8')
print('patched country crosshair persistence')
