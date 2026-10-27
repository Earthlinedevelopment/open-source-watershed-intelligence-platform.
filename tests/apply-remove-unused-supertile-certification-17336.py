from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""const savedGen16839=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167,c16839=await makeContours(sub16839,true,levels16839),jurisdiction16850=earthlineBBoxCertifiedInterior16850(sub16839.bounds,swaleJurisdictionGeometry16539)?{earthlineCertifiedInterior16850:true}:swaleJurisdictionGeometry16539,s16839=await makeSwales(sub16839,c16839,false,null,null);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16839;"""
new="""const savedGen16839=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167,c16839=await makeContours(sub16839,true,levels16839),s16839=await makeSwales(sub16839,c16839,false,null,null);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16839;"""
if s.count(old)!=1: raise SystemExit(f"dead supertile certification anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_REMOVE_UNUSED_SUPERTILE_CERTIFICATION_17336: after consolidated provisional jurisdiction screening, remove now-unused certified-interior boundary scan before supertile makeSwales; final authoritative Regional jurisdiction screen remains unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("removed unused supertile jurisdiction certification 17336")
