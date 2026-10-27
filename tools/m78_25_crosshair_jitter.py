from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.25 — sub-meter camera jitter cannot replace the accepted crosshair target"
if marker not in s:
    old="function syncPropertyTargetFromMap16201(){const m=panelMap16188();if(!m||typeof m.getCenter!=='function')return false;const c=m.getCenter();if(!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat)))return false;const existing=window.EARTHLINE_PROPERTY_TARGET_16201;\n  if(existing&&existing.source==='country-center'&&window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845&&window.EARTHLINE_COUNTRY_TARGET_LOCK_16845!==false)return true;"
    new="""function syncPropertyTargetFromMap16201(){const m=panelMap16188();if(!m||typeof m.getCenter!=='function')return false;const c=m.getCenter();if(!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat)))return false;const existing=window.EARTHLINE_PROPERTY_TARGET_16201;
  if(existing&&existing.source==='country-center'&&window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845&&window.EARTHLINE_COUNTRY_TARGET_LOCK_16845!==false)return true;
  /* EARTHLINE M78.25 — sub-meter camera jitter cannot replace the accepted crosshair target.
     dragend writes the user's new target directly. A later moveend caused by camera framing
     may differ slightly; within 2 m preserve the already accepted crosshair science frame. */
  if(existing&&/^crosshair(?:$|-)/.test(String(existing.source||''))){
    const lat0=Number(existing.lat),lng0=Number(existing.lng),lat=Number(c.lat),lng=Number(c.lng);
    const dy=(lat-lat0)*111320,dx=(lng-lng0)*111320*Math.max(.05,Math.cos(lat0*Math.PI/180));
    if(Number.isFinite(dx)&&Number.isFinite(dy)&&Math.hypot(dx,dy)<=2)return true;
  }"""
    if s.count(old)!=1: raise SystemExit(f"M78.25 sync anchor count={s.count(old)}")
    s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
