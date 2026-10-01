from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""      if(countryPackage16845&&countryPackage16845.location){
        loc=JSON.parse(JSON.stringify(countryPackage16845.location));
        window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556=countryPackage16845;
        window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=countryPackage16845;
      }
"""
new="""      if(countryPackage16845&&countryPackage16845.location){
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
if old not in s:
    if "setPropertyTarget16201({lng:Number(loc.lng),lat:Number(loc.lat),source:'crosshair'}" in s:
        print('country crosshair sync already present')
        raise SystemExit(0)
    raise SystemExit('country package handoff anchor not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('patched country crosshair to authoritative interior center')
