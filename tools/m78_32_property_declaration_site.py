from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.32 — accepted crosshair atomically rebinds the Property declaration site"
if marker in s:
    raise SystemExit(0)

anchor="    site.name=selectedCode?selectedCode+' 20-acre Project Area':'20-acre Project Area';"
if s.count(anchor)!=1:
    raise SystemExit(f"M78.32 declaration-site anchor count={s.count(anchor)}")

block=r'''    /* EARTHLINE M78.32 — accepted crosshair atomically rebinds the Property declaration site.
       The existing terminal Property owner remains the only owner. For a manual crosshair
       declaration, its accepted target is the sole center authority for site, frame,
       declaration, audit, and governed runner. Never reuse a previous Property site. */
    if(!selectedCode){
      const acceptedM7832=window.EARTHLINE_PROPERTY_TARGET_16201||null;
      const lngM7832=Number(acceptedM7832&&acceptedM7832.lng);
      const latM7832=Number(acceptedM7832&&acceptedM7832.lat);
      if(!Number.isFinite(lngM7832)||!Number.isFinite(latM7832)){
        status('PROPERTY ANALYSIS BLOCKED — accepted crosshair target is unavailable.','failed');
        return false;
      }
      const cLngM7832=Number(c&&c.lng),cLatM7832=Number(c&&c.lat);
      if(!Number.isFinite(cLngM7832)||!Number.isFinite(cLatM7832)||
         Math.abs(cLngM7832-lngM7832)>0.00008||Math.abs(cLatM7832-latM7832)>0.00008){
        status('PROPERTY ANALYSIS BLOCKED — crosshair target identity is not coherent.','failed');
        return false;
      }
      const boundaryM7832=earthlineRectangleAround(lngM7832,latM7832,20);
      if(!Array.isArray(boundaryM7832)||boundaryM7832.length<4){
        status('PROPERTY ANALYSIS BLOCKED — authoritative 20-acre frame could not be created.','failed');
        return false;
      }
      site.lng=lngM7832;
      site.lat=latM7832;
      site.acres=20;
      site.analysisBoundaryLngLat=boundaryM7832.map(p=>[Number(p[0]),Number(p[1])]);
      site.fullName='20-acre project area · '+latM7832.toFixed(5)+', '+lngM7832.toFixed(5);
      site.q=site.fullName;
      window.EARTHLINE_PROPERTY_DECLARATION_SITE_AUDIT_M7832={
        build:'EARTHLINE M78.32',
        source:'accepted-crosshair-target',
        center:{lng:lngM7832,lat:latM7832},
        boundaryPoints:site.analysisBoundaryLngLat.length,
        priorTargetAt:acceptedM7832.at||null,
        at:new Date().toISOString()
      };
    }
'''
s=s.replace(anchor,block+anchor,1)
if marker not in s:
    raise SystemExit("M78.32 marker missing after repair")
p.write_text(s,encoding="utf-8")
print("Applied M78.32 atomic Property declaration-site binding")
