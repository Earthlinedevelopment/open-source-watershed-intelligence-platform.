from pathlib import Path
import re
p=Path("index.html")
s=p.read_text(errors="strict")

pat1=r"""function settlePropertyMapVisibility16260\(count,texture,serial\)\{(?P<body>.*?)return ok;\n\s*\}"""
m1=re.search(pat1,s,re.S)
if not m1:
    raise SystemExit("settlement function not found")
body=m1.group("body")
body2=body
body2=body2.replace("settled:true,result:true,corridors:count,","settled:ok,result:true,corridors:count,",1)
body2=body2.replace("renderVerified:ok,renderPending:false,","renderVerified:ok,renderPending:!ok,",1)
body2=body2.replace("mapVerificationSettledAt:new Date().toISOString(),","mapVerificationSettledAt:ok?new Date().toISOString():null,",1)
body2=body2.replace("settledAt:current.settledAt||new Date().toISOString()","settledAt:ok?(current.settledAt||new Date().toISOString()):null",1)
if body2==body:
    raise SystemExit("settlement function replacements not applied")
s=s[:m1.start("body")]+body2+s[m1.end("body"):]

old_overlay="""const regionalOverlay16336=document.getElementById('earthlineRegionalVectorOverlay16020');
  if(regionalOverlay16336){
    regionalOverlay16336.style.removeProperty('display');
    regionalOverlay16336.style.removeProperty('visibility');
    regionalOverlay16336.style.removeProperty('opacity');
  }
  return false
}const safeAudit17183=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;if(active&&Number(safeAudit17183?.count||0)>0&&safeAudit17183?.visible!==true)return false;"""
new_overlay="""const regionalOverlay16336=document.getElementById('earthlineRegionalVectorOverlay16020');
  if(regionalOverlay16336){
    if(active)regionalOverlay16336.style.setProperty('display','none','important');
    else{
      regionalOverlay16336.style.removeProperty('display');
      regionalOverlay16336.style.removeProperty('visibility');
      regionalOverlay16336.style.removeProperty('opacity');
    }
  }
  return false
}const safeAudit17183=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;if(active&&Number(safeAudit17183?.count||0)>0&&safeAudit17183?.visible!==true){const regionalOverlay17183=document.getElementById('earthlineRegionalVectorOverlay16020');if(regionalOverlay17183)regionalOverlay17183.style.setProperty('display','none','important');return false;}"""
if s.count(old_overlay)!=1:
    raise SystemExit(f"regional overlay target count {s.count(old_overlay)}, expected 1")
s=s.replace(old_overlay,new_overlay,1)

p.write_text(s)
print("EARTHLINE_IOWA_PRESENTATION_REPAIR_OK")
