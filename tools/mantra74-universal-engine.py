from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def replace_all(old,new,label,minimum=1):
    global s
    n=s.count(old)
    if n < minimum:
        raise RuntimeError(f"{label}: expected at least {minimum}, found {n}")
    s=s.replace(old,new)
    print(label,n)

# User-facing navigation must be geography-neutral. Historical comments may change too;
# authoritative Vermont source names remain untouched.
replace_all("BACK TO VERMONT","BACK TO REGIONAL","back label")
replace_all("Back to Vermont","Back to Regional","back sentence")
replace_all("run Vermont screening first.","run Regional screening first.","restore message")
replace_all("return to Vermont to test another location.","return to the Regional view to test another location.","focus no-result copy")

# Neutral fallback label in the legacy breadcrumb; live reconciliation may overwrite it.
replace_all(
    '<button type="button" class="region" data-action="region">Vermont</button>',
    '<button type="button" class="region" data-action="region">Regional</button>',
    "breadcrumb fallback"
)

# Provenance must describe the evidence actually returned, not infer Vermont from
# the generic authoritative-local tier.
old="sourceRule:authoritative16516?'Vermont E911/VCGI first; exclusions fail closed; Overpass disabled':(evidence16516&&evidence16516.label?evidence16516.label:'Exclusion evidence not recorded')"
new="sourceRule:(evidence16516&&evidence16516.label?evidence16516.label:(authoritative16516?'Authoritative local exclusion evidence; exclusions fail closed':'Exclusion evidence not recorded'))"
if s.count(old)!=1:
    raise RuntimeError(f"provenance rule: expected 1, found {s.count(old)}")
s=s.replace(old,new,1)

for bad in [
    "BACK TO VERMONT",
    "Back to Vermont",
    "run Vermont screening first.",
    "return to Vermont to test another location.",
    old
]:
    if bad in s:
        raise RuntimeError(f"global Vermont wording remains: {bad}")

p.write_text(s,encoding="utf-8")
print("EARTHLINE_UNIVERSAL_COPY_CLEANUP_OK")
