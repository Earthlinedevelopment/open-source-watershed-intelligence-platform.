from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def one(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f"{label}: expected 1, found {n}")
    s=s.replace(old,new,1)

one(
"sourceRule:authoritative16516?'Vermont E911/VCGI first; exclusions fail closed; Overpass disabled':(evidence16516&&evidence16516.label?evidence16516.label:'Exclusion evidence not recorded')",
"sourceRule:(evidence16516&&evidence16516.label?evidence16516.label:(authoritative16516?'Authoritative local exclusion evidence; exclusions fail closed':'Exclusion evidence not recorded'))",
"provenance copy"
)

one(
"<button type=\"button\" class=\"region\" data-action=\"region\">Vermont</button><span class=\"sep\">›</span><span class=\"current\">Focus location</span><button type=\"button\" class=\"back\" data-action=\"region\">BACK TO VERMONT</button>",
"<button type=\"button\" class=\"region\" data-action=\"region\">Regional</button><span class=\"sep\">›</span><span class=\"current\">Focus location</span><button type=\"button\" class=\"back\" data-action=\"region\">BACK TO REGIONAL</button>",
"breadcrumb fallback"
)

one("REGIONAL RESTORE UNAVAILABLE — run Vermont screening first.","REGIONAL RESTORE UNAVAILABLE — run Regional screening first.","restore message")
one("Use Back to Vermont to restore the cached regional result.","Use Back to Regional to restore the cached regional result.","focus restore copy")
one("return to Vermont to test another location.","return to the Regional view to test another location.","focus no-result copy")

for bad in [
    "BACK TO VERMONT",
    "run Vermont screening first.",
    "Use Back to Vermont",
    "return to Vermont to test another location.",
    "sourceRule:authoritative16516?'Vermont E911/VCGI first; exclusions fail closed; Overpass disabled'"
]:
    if bad in s:
        raise RuntimeError(f"global Vermont wording remains: {bad}")

p.write_text(s,encoding="utf-8")
print("EARTHLINE_UNIVERSAL_COPY_CLEANUP_OK")
