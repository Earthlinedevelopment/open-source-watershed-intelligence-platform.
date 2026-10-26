from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.33 — explicit crosshair authority overrides stale Regional selection residue"
if marker in s:
    raise SystemExit(0)

old="""    if(!selectedCode){
      const acceptedM7832=window.EARTHLINE_PROPERTY_TARGET_16201||null;
      const lngM7832=Number(acceptedM7832&&acceptedM7832.lng);"""
new="""    const acceptedM7832=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const crosshairAuthorityM7833=/^crosshair(?:$|-)/.test(String(acceptedM7832&&acceptedM7832.source||''));
    /* EARTHLINE M78.33 — explicit crosshair authority overrides stale Regional selection residue.
       A stale selectedCode may survive a previous Regional/Property transition, but it cannot
       veto or redirect an explicit accepted crosshair Property declaration. */
    if(crosshairAuthorityM7833){
      const lngM7832=Number(acceptedM7832&&acceptedM7832.lng);"""

if s.count(old)!=1:
    raise SystemExit(f"M78.33 M78.32 authority anchor count={s.count(old)}")
s=s.replace(old,new,1)

if marker not in s:
    raise SystemExit("M78.33 marker missing after repair")
p.write_text(s,encoding="utf-8")
print("Applied M78.33 crosshair authority over stale Regional selection residue")
