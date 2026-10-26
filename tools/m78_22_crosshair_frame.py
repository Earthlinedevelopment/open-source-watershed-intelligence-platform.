from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.22 — canonical five-decimal crosshair owns the Property analysis frame"
if marker not in s:
    old="window.EARTHLINE_PROPERTY_TARGET_16201={lng:Number(target.lng),lat:Number(target.lat),source:String(target.source||'crosshair'),code:target.code?String(target.code):'',score:Number(target.score||0),parentRunToken:parentRunToken16347||'',at:new Date().toISOString()};"
    new="""/* EARTHLINE M78.22 — canonical five-decimal crosshair owns the Property analysis frame.
       The UI exposes five decimals; sub-display camera drift must not move the DEM grid
       or change the bioswale prescription for the same displayed crosshair. */
    const sourceM7822=String(target.source||'crosshair');
    const crosshairM7822=/^crosshair(?:$|-)/.test(sourceM7822);
    const lngM7822=crosshairM7822?Number(Number(target.lng).toFixed(5)):Number(target.lng);
    const latM7822=crosshairM7822?Number(Number(target.lat).toFixed(5)):Number(target.lat);
    window.EARTHLINE_PROPERTY_TARGET_16201={lng:lngM7822,lat:latM7822,source:sourceM7822,code:target.code?String(target.code):'',score:Number(target.score||0),parentRunToken:parentRunToken16347||'',at:new Date().toISOString()};"""
    if s.count(old)!=1: raise SystemExit(f"M78.22 target assignment count={s.count(old)}")
    s=s.replace(old,new,1)
    old_pref="const boundary16466=earthlineRectangleAround(Number(target.lng),Number(target.lat),20);"
    new_pref="const boundary16466=earthlineRectangleAround(Number(window.EARTHLINE_PROPERTY_TARGET_16201.lng),Number(window.EARTHLINE_PROPERTY_TARGET_16201.lat),20);"
    if s.count(old_pref)!=1: raise SystemExit(f"M78.22 prefetch anchor count={s.count(old_pref)}")
    s=s.replace(old_pref,new_pref,1)
p.write_text(s,encoding="utf-8")
