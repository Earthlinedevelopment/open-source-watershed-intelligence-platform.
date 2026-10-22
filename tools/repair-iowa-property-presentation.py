from pathlib import Path
import re
p=Path("index.html")
s=p.read_text(errors="strict")

starts=[m.start() for m in re.finditer(r"function settlePropertyMapVisibility16260\(count,texture,serial\)\{",s)]
matches=[]
for st in starts:
    chunk=s[st:st+14000]
    if "presentation-unavailable" in chunk and "renderVerified:ok" in chunk:
        matches.append((st,chunk))
if len(matches)!=1:
    raise SystemExit(f"active settlement blocks {len(matches)}, expected 1")
st,chunk=matches[0]
seg=chunk
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
s=s[:st]+seg+s[st+len(chunk):]

overlay_targets=[m.start() for m in re.finditer(r"const regionalOverlay16336=document\.getElementById\('earthlineRegionalVectorOverlay16020'\);",s)]
overlay_matches=[]
for ost in overlay_targets:
    ochunk=s[ost:ost+5000]
    if "safeAudit17183" in ochunk and "return false" in ochunk:
        overlay_matches.append((ost,ochunk))
if len(overlay_matches)!=1:
    raise SystemExit(f"active overlay blocks {len(overlay_matches)}, expected 1")
ost,oseg=overlay_matches[0]
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
s=s[:ost]+oseg2+s[ost+len(oseg):]

p.write_text(s)
print("EARTHLINE_IOWA_PRESENTATION_REPAIR_OK")
