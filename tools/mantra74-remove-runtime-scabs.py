from pathlib import Path
import re

p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s

def remove_script(script_id):
    global s
    pat=re.compile(r'<script\s+id=["\']'+re.escape(script_id)+r'["\'][^>]*>[\s\S]*?</script>\s*',re.I)
    s2,n=pat.subn('',s,count=1)
    if n!=1:
        raise RuntimeError(f"{script_id}: expected 1 script, found {n}")
    s=s2

remove_script("earthline-build-15828-boundary-watchdog")
remove_script("earthline-build-15829-reference-audit")

for old in [
    '      earthlineMap.on("idle",()=>{}); // 16487 neutralized settle repaint.\n',
    '    setInterval(()=>{},850); // 16487: legacy periodic renderer retained structurally but neutralized.\n'
]:
    if s.count(old)!=1:
        raise RuntimeError("legacy no-op owner occurrence mismatch: "+old.strip())
    s=s.replace(old,'',1)

# Final public rule: legacy status remains available to code/audits but never renders a floating box.
marker='</head>'
style='''<style id="earthline-stability-public-status-retire-17631">
#earthlineVermontStatus16147{display:none!important}
</style>
'''
if style not in s:
    if s.count(marker)!=1:
        raise RuntimeError("head marker mismatch")
    s=s.replace(marker,style+marker,1)

# No public watchdog failure copy may remain.
for bad in [
    "BOUNDARY CONTROLLER STOPPED",
    "BOUNDARY CONTROLLER NOT INITIALIZED",
    "RUN-PATH REFERENCE AUDIT FAILED",
    "send a screenshot of this message"
]:
    if bad in s:
        raise RuntimeError("public watchdog copy remains: "+bad)

p.write_text(s,encoding="utf-8")
print("EARTHLINE_17631_RUNTIME_SCAB_REMOVAL",len(before),len(s),len(before)-len(s))
