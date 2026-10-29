from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""        if(!propertyOwnsDisplay16726&&!focusMode){const cov16792=cameraCoverage(m,b);if(!Number.isFinite(cov16792)||cov16792<.98){const ok16792=await settleRegionalCamera(m,b,runToken);if(ok16792!==true)throw new Error('regional final display camera reconciliation failed');}}"""
new="""        if(!propertyOwnsDisplay16726&&!focusMode){
          window.EARTHLINE_CONTEXT_CAMERA_POLICY_M81={
            build:'EARTHLINE M81',runToken,
            action:'preserve-current-camera',
            reason:'core camera already settled before publication; optional context does not recenter after publication',
            coverage:cameraCoverage(m,b),at:new Date().toISOString()
          };
        }"""
if old not in s:
    raise SystemExit("camera reconciliation owner not found")
if s.count(old)!=1:
    raise SystemExit(f"expected one camera reconciliation owner, found {s.count(old)}")
p.write_text(s.replace(old,new,1),encoding="utf-8")
print("patched late context camera behavior")
