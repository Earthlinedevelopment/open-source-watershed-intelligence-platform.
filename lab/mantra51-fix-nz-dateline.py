from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
anchor="window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=countryPackage16845;"
insert="""window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=countryPackage16845;
        try{
          const code16845=String(countryPackage16845.countryCode||countryPackage16845.location&&countryPackage16845.location.countryCode||'').toLowerCase();
          const name16845=String(q||countryPackage16845.location&&countryPackage16845.location.name||'').trim().toLowerCase();
          const nzDateline16845=(code16845==='nz'||code16845==='nzl'||name16845==='new zealand');
          if(earthlineMap&&typeof earthlineMap.setRenderWorldCopies==='function')earthlineMap.setRenderWorldCopies(nzDateline16845);
          window.EARTHLINE_NZ_DATELINE_NAV_16845={enabled:nzDateline16845,code:code16845,name:name16845,at:new Date().toISOString()};
        }catch(_){}"""
if "EARTHLINE_NZ_DATELINE_NAV_16845" not in s:
    if anchor not in s: raise SystemExit("country package assignment token missing")
    s=s.replace(anchor,insert,1)

clear="window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556=null;window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=null;"
clear_new="""window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556=null;window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=null;
      try{if(earthlineMap&&typeof earthlineMap.setRenderWorldCopies==='function')earthlineMap.setRenderWorldCopies(false);}catch(_){}"""
if "EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=null;" in s and clear_new not in s:
    if clear not in s: raise SystemExit("country clear token missing")
    s=s.replace(clear,clear_new,1)

if "setRenderWorldCopies(nzDateline16845)" not in s: raise SystemExit("NZ dateline insertion missing")
p.write_text(s,encoding="utf-8")
print("patched NZ dateline navigation only")
