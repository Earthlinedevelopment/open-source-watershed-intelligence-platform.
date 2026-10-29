from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
locked="const thr=streamThreshold(),chanThr=Math.max(thr*3.2,Number(M.maxAcc||0)*0.06),maxS=4;"
if locked not in s:
    raise SystemExit("locked <=4% active Property science missing")

old="""    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof fn!=='function')return false;
    const targetAtPressM7839=window.EARTHLINE_PROPERTY_TARGET_16201||null;"""
new="""    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof fn!=='function')return false;
    /* Bind the exact visible crosshair on the same physical Property press.
       A prior Regional corridor or previous Property target may never survive
       into a new explicit 20-acre declaration. */
    try{
      const mpFirstPress=panelMap16188?.()||(window.earthlineMap||null);
      const cFirstPress=mpFirstPress?.getCenter?.();
      const lngFirstPress=Number(cFirstPress?.lng),latFirstPress=Number(cFirstPress?.lat);
      if(Number.isFinite(lngFirstPress)&&Number.isFinite(latFirstPress)){
        window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;
        window.EARTHLINE_COUNTRY_TARGET_USER_UNLOCKED_17240=true;
        const reboundFirstPress={
          lng:lngFirstPress,lat:latFirstPress,source:'crosshair',
          code:'',score:0,parentRunToken:'',at:new Date().toISOString()
        };
        if(typeof window.earthlineSetPropertyTarget16201==='function')
          window.earthlineSetPropertyTarget16201(reboundFirstPress,{openPanel:false});
        else window.EARTHLINE_PROPERTY_TARGET_16201=reboundFirstPress;
      }
    }catch(_){}
    const targetAtPressM7839=window.EARTHLINE_PROPERTY_TARGET_16201||null;"""
if s.count(old)!=1:
    raise SystemExit(f"Property activation anchor count {s.count(old)}")
s=s.replace(old,new,1)

p.write_text(s,encoding="utf-8")
print("bound exact current crosshair to first Property press")
