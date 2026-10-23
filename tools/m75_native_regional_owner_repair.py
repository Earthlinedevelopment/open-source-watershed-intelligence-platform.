from pathlib import Path
import sys

p=Path(sys.argv[1] if len(sys.argv)>1 else "index.html")
s=p.read_text(errors="strict")

old="""    setGroup(active.water,flowOn);setGroup(active.swales,swaleOn);
    setGroup(active.recharge,rechargeOn);setGroup(active.contours,contourOn);setGroup(active.aquifer,aquiferOn);"""
new="""    setGroup(active.water,flowOn);
    if(property){
      setGroup(active.swales,swaleOn);
    }else{
      /* EARTHLINE 17702 — the Regional registry owns native corridor visibility.
         Initial statewide Regional keeps ranked labels but suppresses corridor
         geometry until a material zoom-in. This matches the SVG 17434 owner. */
      const regionalZoom17702=Number(earthlineMap&&earthlineMap.getZoom&&earthlineMap.getZoom());
      const regionalCorridorOn17702=swaleOn&&Number.isFinite(regionalZoom17702)&&regionalZoom17702>=9;
      for(const id17702 of [
        "earthline-ranked-swale-soil-15777",
        "earthline-ranked-swale-plant-15777",
        "earthline-ranked-swale-water-15777"
      ])visible(id17702,regionalCorridorOn17702);
      visible("earthline-ranked-swale-label-15775",swaleOn);
    }
    setGroup(active.recharge,rechargeOn);setGroup(active.contours,contourOn);setGroup(active.aquifer,aquiferOn);"""
n=s.count(old)
if n!=1:
    raise SystemExit(f"native regional owner target count={n}, expected=1")
s=s.replace(old,new,1)
p.write_text(s)
print("EARTHLINE_M75_NATIVE_REGIONAL_OWNER_REPAIR_OK")
