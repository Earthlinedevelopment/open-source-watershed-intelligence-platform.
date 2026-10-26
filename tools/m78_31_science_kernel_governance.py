from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="version:'M78.30-local-level-set-fallback',attempts:0,recoveries:0"
new="version:'Earthline-Science-Kernel-v1.0.0',owner:'authoritative-property-science-kernel',validationPolicy:'independent-fail-closed-publication-gate',attempts:0,recoveries:0"

if old in s:
    s=s.replace(old,new,1)
elif "Earthline-Science-Kernel-v1.0.0" not in s:
    raise SystemExit("Science Kernel v1 migration anchor missing")

marker="EARTHLINE SCIENCE KERNEL v1.0.0 — immutable runtime identity"
if marker not in s:
    anchor="/* EARTHLINE M78.30 — deterministic local DEM level-set fallback."
    if anchor not in s:
        raise SystemExit("Science Kernel solver anchor missing")
    s=s.replace(anchor,"/* "+marker+" */\n"+anchor,1)

if "Earthline-Science-Kernel-v1.0.0" not in s or marker not in s:
    raise SystemExit("Science Kernel v1 migration verification failed")

p.write_text(s,encoding="utf-8")
print("Migrated live runtime to Earthline Science Kernel v1.0.0")
