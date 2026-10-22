from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s

old="""        try{
          const code16845=String(countryPackage16845.countryCode||countryPackage16845.location&&countryPackage16845.location.countryCode||'').toLowerCase();
          const name16845=String(q||countryPackage16845.location&&countryPackage16845.location.name||'').trim().toLowerCase();
          const nzDateline16845=(code16845==='nz'||code16845==='nzl'||name16845==='new zealand');
          if(earthlineMap&&typeof earthlineMap.setRenderWorldCopies==='function')earthlineMap.setRenderWorldCopies(nzDateline16845);
          window.EARTHLINE_NZ_DATELINE_NAV_16845={enabled:nzDateline16845,code:code16845,name:name16845,at:new Date().toISOString()};
        }catch(_){}"""
new="""        try{
          const geometry17692=countryPackage16845&&countryPackage16845.boundary&&countryPackage16845.boundary.geometry||null;
          const bbox17692=geometry17692?earthlineGeometryBounds16556(geometry17692):null;
          const crossesDateline17692=!!(
            Array.isArray(bbox17692)&&bbox17692.length>=4&&
            Number.isFinite(Number(bbox17692[0]))&&Number.isFinite(Number(bbox17692[2]))&&
            Math.abs(Number(bbox17692[2])-Number(bbox17692[0]))>180
          );
          if(earthlineMap&&typeof earthlineMap.setRenderWorldCopies==='function')
            earthlineMap.setRenderWorldCopies(crossesDateline17692);
          window.EARTHLINE_DATELINE_NAV_17692={
            enabled:crossesDateline17692,
            bbox:Array.isArray(bbox17692)?bbox17692.slice():null,
            rule:'world copies follow selected boundary geometry, never a jurisdiction name',
            at:new Date().toISOString()
          };
        }catch(_){}"""
if s.count(old)!=1: raise RuntimeError("NZ dateline block count "+str(s.count(old)))
s=s.replace(old,new,1)

s=s.replace(
"""    /* EARTHLINE 16911 — WRAPPED-WORLD WATER CLIP SAFETY.
       When world copies are enabled (needed for New Zealand dateline navigation),
       rendered/source vector water geometry may be duplicated/wrapped across the seam.""",
"""    /* EARTHLINE 16911 / 17692 — WRAPPED-WORLD WATER CLIP SAFETY.
       When a selected boundary crosses the antimeridian and world copies are enabled,
       rendered/source vector water geometry may be duplicated/wrapped across the seam.""",
1)

for forbidden in ["nzDateline16845","EARTHLINE_NZ_DATELINE_NAV_16845","name16845==='new zealand'","code16845==='nz'"]:
    if forbidden in s: raise RuntimeError("jurisdiction-specific dateline logic remains: "+forbidden)
if "EARTHLINE_DATELINE_NAV_17692" not in s: raise RuntimeError("generic dateline owner missing")

p.write_text(s,encoding="utf-8")
print("EARTHLINE_17692_GEOMETRY_DRIVEN_DATELINE",len(before),len(s),len(before)-len(s))
