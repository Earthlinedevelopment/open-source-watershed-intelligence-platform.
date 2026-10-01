from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""        window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556=countryPackage16845;
        window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=countryPackage16845;
        try{
          const cc=countryPackage16845.center;"""
new="""        window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556=countryPackage16845;
        window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=countryPackage16845;
        try{
          const code16845=String(countryPackage16845.countryCode||countryPackage16845.location&&countryPackage16845.location.countryCode||'').toLowerCase();
          const name16845=String(q||countryPackage16845.location&&countryPackage16845.location.name||'').trim().toLowerCase();
          const nzDateline16845=(code16845==='nz'||code16845==='nzl'||name16845==='new zealand');
          if(earthlineMap&&typeof earthlineMap.setRenderWorldCopies==='function')earthlineMap.setRenderWorldCopies(nzDateline16845);
          window.EARTHLINE_NZ_DATELINE_NAV_16845={enabled:nzDateline16845,code:code16845,name:name16845,at:new Date().toISOString()};
        }catch(_){}
        try{
          const cc=countryPackage16845.center;"""
if old not in s:
    raise SystemExit("country package activation anchor missing")
s=s.replace(old,new,1)
old2="""    }else if(window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556&&window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556.packageKind==='country'){
      window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556=null;window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=null;
    }"""
new2="""    }else if(window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556&&window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556.packageKind==='country'){
      window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556=null;window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=null;
      try{if(earthlineMap&&typeof earthlineMap.setRenderWorldCopies==='function')earthlineMap.setRenderWorldCopies(false);}catch(_){}
    }"""
if old2 not in s:
    raise SystemExit("country clear anchor missing")
s=s.replace(old2,new2,1)
p.write_text(s,encoding="utf-8")
print("patched NZ dateline navigation only")

# trigger apply workflow
