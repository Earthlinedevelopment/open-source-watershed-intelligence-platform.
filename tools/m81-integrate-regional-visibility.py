from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_visibility="""  function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus')return true;
    if(tier==='property')return false;
    const published=window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null;
    const publishedZoom=Number(published&&published.zoom),currentZoom=Number(map?.getZoom?.());
    if(!Number.isFinite(currentZoom))return false;
    if(!Number.isFinite(publishedZoom))return false;
    return currentZoom>=publishedZoom+0.85;
  }"""
new_visibility="""  function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='property')return false;
    /* EARTHLINE M81 — Regional swale geometry is part of the default published
       screening result. Do not hide it behind an extra +0.85 zoom step. */
    return true;
  }"""
if old_visibility in s:
    s=s.replace(old_visibility,new_visibility,1)

old_camera="""        if(!propertyOwnsDisplay16726&&!focusMode){const cov16792=cameraCoverage(m,b);if(!Number.isFinite(cov16792)||cov16792<.98){const ok16792=await settleRegionalCamera(m,b,runToken);if(ok16792!==true)throw new Error('regional final display camera reconciliation failed');}}"""
new_camera="""        if(!propertyOwnsDisplay16726&&!focusMode){
          window.EARTHLINE_CONTEXT_CAMERA_POLICY_M81={
            build:'EARTHLINE M81',runToken,
            action:'preserve-current-camera',
            reason:'core camera already settled before publication; optional context does not recenter after publication',
            coverage:cameraCoverage(m,b),at:new Date().toISOString()
          };
        }"""
if old_camera in s:
    s=s.replace(old_camera,new_camera,1)
elif "EARTHLINE_CONTEXT_CAMERA_POLICY_M81" not in s:
    raise SystemExit("camera reconciliation owner not found")

p.write_text(s,encoding="utf-8")
print("applied Regional visibility + post-publication camera ownership repairs")
