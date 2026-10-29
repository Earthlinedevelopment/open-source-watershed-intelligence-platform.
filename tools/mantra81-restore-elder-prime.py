from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="    /* M76 elder prime retired */"
new="    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.primePropertyEvidence?.()}catch(_){} /* EARTHLINE M81 — accepted current crosshair primes exact-frame Elder compute in parallel with Property science */"
if old not in s:
    raise SystemExit("elder prime insertion point not found")
if s.count(old)!=1:
    raise SystemExit(f"expected one insertion point, found {s.count(old)}")
p.write_text(s.replace(old,new,1),encoding="utf-8")
print("patched accepted-crosshair Elder overlap")
