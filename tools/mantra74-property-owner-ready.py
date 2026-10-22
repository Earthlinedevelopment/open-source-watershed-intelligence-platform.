from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="b.disabled=false;b.setAttribute('aria-disabled','false')"
new="const activationReady17494=b.dataset.earthlinePropertyClickOwner16546==='shared-17494';b.disabled=!activationReady17494;b.setAttribute('aria-disabled',activationReady17494?'false':'true')"
n=s.count(old)
if n!=1:
    raise SystemExit(f"expected one premature Property enable, found {n}")
s=s.replace(old,new,1)
if old in s:
    raise SystemExit("premature Property enable remains")
p.write_text(s,encoding="utf-8")
print("EARTHLINE_PROPERTY_OWNER_READY_GATE_OK")
