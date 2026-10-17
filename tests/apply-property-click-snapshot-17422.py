from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""    const mp=map(),m=model(),chosen=window.EARTHLINE_PROPERTY_TARGET_16201,c=(chosen&&Number.isFinite(Number(chosen.lng))&&Number.isFinite(Number(chosen.lat)))?{lng:Number(chosen.lng),lat:Number(chosen.lat)}:mp?.getCenter?.();
    if(!mp||!m||!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat))){status('PROPERTY ANALYSIS BLOCKED — map-crosshair coordinates are unavailable.','failed');return false}
"""
new="""    const mp=map(),m=model(),chosen=window.EARTHLINE_PROPERTY_TARGET_16201;
    const liveCenter17422=mp?.getCenter?.();
    const chosenValid17422=!!(chosen&&Number.isFinite(Number(chosen.lng))&&Number.isFinite(Number(chosen.lat)));
    const liveValid17422=!!(liveCenter17422&&Number.isFinite(Number(liveCenter17422.lng))&&Number.isFinite(Number(liveCenter17422.lat)));
    const corridorChosen17422=!!(chosenValid17422&&String(chosen.code||'').trim());
    const c=corridorChosen17422
      ?{lng:Number(chosen.lng),lat:Number(chosen.lat)}
      :(liveValid17422?{lng:Number(liveCenter17422.lng),lat:Number(liveCenter17422.lat)}:(chosenValid17422?{lng:Number(chosen.lng),lat:Number(chosen.lat)}:null));
    if(!mp||!m||!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat))){status('PROPERTY ANALYSIS BLOCKED — map-crosshair coordinates are unavailable.','failed');return false}
    if(!corridorChosen17422){
      window.EARTHLINE_PROPERTY_TARGET_16201=Object.assign({},chosen||{},{
        lng:Number(c.lng),lat:Number(c.lat),source:'crosshair',code:'',parentRunToken:'',at:new Date().toISOString()
      });
      window.EARTHLINE_PROPERTY_CLICK_SNAPSHOT_17422={lng:Number(c.lng),lat:Number(c.lat),at:new Date().toISOString()};
    }
"""
count=s.count(old)
if count!=1: raise SystemExit(f"terminal crosshair anchor count {count}")
s=s.replace(old,new,1)

old2="""function syncPropertyTargetFromMap16201(){const m=panelMap16188();if(!m||typeof m.getCenter!=='function')return false;const c=m.getCenter();"""
new2="""function syncPropertyTargetFromMap16201(){if(String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running')return true;const m=panelMap16188();if(!m||typeof m.getCenter!=='function')return false;const c=m.getCenter();"""
count2=s.count(old2)
if count2!=1: raise SystemExit(f"target sync anchor count {count2}")
s=s.replace(old2,new2,1)

s="<!-- EARTHLINE_PROPERTY_CLICK_SNAPSHOT_17422: terminal owner snapshots live crosshair; target is frozen while Property runs. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched authoritative Property crosshair snapshot/freeze 17422")
