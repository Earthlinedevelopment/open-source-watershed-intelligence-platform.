from pathlib import Path
import re
p=Path("index.html")
s=p.read_text(errors="strict")

start=s.index("function settlePropertyMapVisibility16260(count,texture,serial){")
end=s.index("/* EARTHLINE 16529",start)
seg=s[start:end]
patterns=[
    (r"settled\s*:\s*true\s*,\s*result\s*:\s*true\s*,\s*corridors\s*:\s*count","settled:ok,result:true,corridors:count"),
    (r"renderVerified\s*:\s*ok\s*,\s*renderPending\s*:\s*false","renderVerified:ok,renderPending:!ok"),
    (r"mapVerificationSettledAt\s*:\s*new Date\(\)\.toISOString\(\)","mapVerificationSettledAt:ok?new Date().toISOString():null"),
    (r"settledAt\s*:\s*current\.settledAt\s*\|\|\s*new Date\(\)\.toISOString\(\)","settledAt:ok?(current.settledAt||new Date().toISOString()):null"),
]
changed=0
for pat,repl in patterns:
    seg,n=re.subn(pat,repl,seg,count=1)
    changed+=n
if changed!=4:
    raise SystemExit(f"settlement replacement count {changed}, expected 4")
s=s[:start]+seg+s[end:]

ostart=s.index("const regionalOverlay16336=document.getElementById('earthlineRegionalVectorOverlay16020');")
oend=s.index("const w=applyWidth();",ostart)
oseg=s[ostart:oend]
oseg2=oseg.replace(
    "if(regionalOverlay16336){regionalOverlay16336.style.removeProperty('display');regionalOverlay16336.style.removeProperty('visibility');regionalOverlay16336.style.removeProperty('opacity');}",
    "if(regionalOverlay16336){if(active)regionalOverlay16336.style.setProperty('display','none','important');else{regionalOverlay16336.style.removeProperty('display');regionalOverlay16336.style.removeProperty('visibility');regionalOverlay16336.style.removeProperty('opacity');}}",
    1
)
oseg2=oseg2.replace(
    "if(active&&Number(safeAudit17183?.count||0)>0&&safeAudit17183?.visible!==true)return false;",
    "if(active&&Number(safeAudit17183?.count||0)>0&&safeAudit17183?.visible!==true){const regionalOverlay17183=document.getElementById('earthlineRegionalVectorOverlay16020');if(regionalOverlay17183)regionalOverlay17183.style.setProperty('display','none','important');return false;}",
    1
)
if oseg2==oseg:
    raise SystemExit("regional overlay replacements not applied")
s=s[:ostart]+oseg2+s[oend:]

p.write_text(s)
print("EARTHLINE_IOWA_PRESENTATION_REPAIR_OK")
