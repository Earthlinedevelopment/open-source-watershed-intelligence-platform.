from pathlib import Path
import re
p=Path("index.html")
s=p.read_text(errors="strict")

fm=re.search(r"function settlePropertyMapVisibility16260\(count,texture,serial\)\{(?P<body>.*?)\n\s*\}",s,re.S)
if not fm:
    raise SystemExit("settlement function not found")
body=fm.group("body")
body2=body
subs=[
    (r"settled\s*:\s*true\s*,\s*result\s*:\s*true\s*,\s*corridors\s*:\s*count","settled:ok,result:true,corridors:count"),
    (r"renderVerified\s*:\s*ok\s*,\s*renderPending\s*:\s*false","renderVerified:ok,renderPending:!ok"),
    (r"mapVerificationSettledAt\s*:\s*new Date\(\)\.toISOString\(\)","mapVerificationSettledAt:ok?new Date().toISOString():null"),
    (r"settledAt\s*:\s*current\.settledAt\s*\|\|\s*new Date\(\)\.toISOString\(\)","settledAt:ok?(current.settledAt||new Date().toISOString()):null"),
]
changed=0
for pat,repl in subs:
    body2,n=re.subn(pat,repl,body2,count=1)
    changed+=n
if changed<4:
    raise SystemExit(f"settlement replacement count {changed}, expected 4")
s=s[:fm.start("body")]+body2+s[fm.end("body"):]

overlay_pat=re.compile(
    r"const regionalOverlay16336=document\.getElementById\('earthlineRegionalVectorOverlay16020'\);"
    r"if\(regionalOverlay16336\)\{"
    r"regionalOverlay16336\.style\.removeProperty\('display'\);"
    r"regionalOverlay16336\.style\.removeProperty\('visibility'\);"
    r"regionalOverlay16336\.style\.removeProperty\('opacity'\);"
    r"\}return false\}"
    r"const safeAudit17183=window\.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221\|\|null;"
    r"if\(active&&Number\(safeAudit17183\?\.count\|\|0\)>0&&safeAudit17183\?\.visible!==true\)return false;"
)
overlay_repl=(
    "const regionalOverlay16336=document.getElementById('earthlineRegionalVectorOverlay16020');"
    "if(regionalOverlay16336){if(active)regionalOverlay16336.style.setProperty('display','none','important');"
    "else{regionalOverlay16336.style.removeProperty('display');regionalOverlay16336.style.removeProperty('visibility');"
    "regionalOverlay16336.style.removeProperty('opacity');}}return false}"
    "const safeAudit17183=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;"
    "if(active&&Number(safeAudit17183?.count||0)>0&&safeAudit17183?.visible!==true){"
    "const regionalOverlay17183=document.getElementById('earthlineRegionalVectorOverlay16020');"
    "if(regionalOverlay17183)regionalOverlay17183.style.setProperty('display','none','important');return false;}"
)
s,n=overlay_pat.subn(overlay_repl,s,count=1)
if n!=1:
    raise SystemExit(f"regional overlay replacement count {n}, expected 1")

p.write_text(s)
print("EARTHLINE_IOWA_PRESENTATION_REPAIR_OK")
