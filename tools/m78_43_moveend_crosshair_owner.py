from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.43 — generic moveend cannot replace an accepted crosshair target"
if marker in s:
    raise SystemExit(0)

old="""  if(existing&&/^crosshair(?:$|-)/.test(String(existing.source||''))){
    const lat0=Number(existing.lat),lng0=Number(existing.lng),lat=Number(c.lat),lng=Number(c.lng);
    const dy=(lat-lat0)*111320,dx=(lng-lng0)*111320*Math.max(.05,Math.cos(lat0*Math.PI/180));
    if(Number.isFinite(dx)&&Number.isFinite(dy)&&Math.hypot(dx,dy)<=2)return true;
  }const prefetch17174=ok=>ok;"""

new="""  if(existing&&/^crosshair(?:$|-)/.test(String(existing.source||''))){
    /* EARTHLINE M78.43 — generic moveend cannot replace an accepted crosshair target.
       The existing dragend owner is the sole user-map movement writer. Search/corridor/
       country owners already set explicit targets directly. Therefore a later programmatic
       moveend (camera framing, Regional settlement, optional context) may update presentation
       but cannot rewrite the accepted Property crosshair, regardless of distance. */
    return true;
  }const prefetch17174=ok=>ok;"""

if s.count(old)!=1:
    raise SystemExit(f"M78.43 moveend crosshair anchor count={s.count(old)}")
s=s.replace(old,new,1)

if marker not in s:
    raise SystemExit("M78.43 marker missing after repair")
p.write_text(s,encoding="utf-8")
print("Applied M78.43 accepted-crosshair moveend ownership repair")
