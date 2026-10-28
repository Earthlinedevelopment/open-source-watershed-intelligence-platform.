from pathlib import Path
import sys
path=Path(sys.argv[1] if len(sys.argv)>1 else "index.html")
s=path.read_text(encoding="utf-8")
old='''    const targetSpacingM15771=isRegionalTile15769
      ?Math.max(24,Math.min(60,Math.max(1,M.cellM||1)*4))
      :TARGET_M;'''
new='''    let targetSpacingM15771=isRegionalTile15769
      ?Math.max(24,Math.min(60,Math.max(1,M.cellM||1)*4))
      :TARGET_M;'''
if s.count(old)!=1:
    raise SystemExit(f"expected one Property target-spacing owner; found {s.count(old)}")
s=s.replace(old,new)

anchor='''    }

    let levelDomainFallback="none";'''
insert='''    }

    let slopeSafeCount15771=0,slopeSampleCount15771=0;
    if(!isRegionalTile15769){
      for(let sy15771=2;sy15771<GH-2;sy15771++)for(let sx15771=2;sx15771<GW-2;sx15771++){
        const si15771=idx(sx15771,sy15771);
        if(!M.inP[si15771])continue;
        const sp15771=Number(slopePct(sx15771,sy15771));
        if(!Number.isFinite(sp15771))continue;
        slopeSampleCount15771++;
        if(sp15771<=maxS)slopeSafeCount15771++;
      }
    }
    const propertySlopeSafeShare15771=slopeSafeCount15771/Math.max(1,slopeSampleCount15771);
    if(!isRegionalTile15769&&propertySlopeSafeShare15771<0.03)targetSpacingM15771=MIN_M;
    if(M.swaleDiagnostics&&M.swaleDiagnostics.performanceBudget){
      M.swaleDiagnostics.performanceBudget.targetSpacingM=targetSpacingM15771;
      M.swaleDiagnostics.performanceBudget.propertySlopeSafeShare15771=propertySlopeSafeShare15771;
      M.swaleDiagnostics.performanceBudget.slopeSafeCount15771=slopeSafeCount15771;
      M.swaleDiagnostics.performanceBudget.slopeSampleCount15771=slopeSampleCount15771;
      M.swaleDiagnostics.performanceBudget.spacingPolicy15771=
        isRegionalTile15769?"regional":
        (propertySlopeSafeShare15771<0.03?"sparse-slope-safe-terrain-15ft":"standard-slope-safe-terrain-20ft");
    }

    let levelDomainFallback="none";'''
if s.count(anchor)!=1:
    raise SystemExit(f"expected one safe-domain completion anchor; found {s.count(anchor)}")
s=s.replace(anchor,insert)
path.write_text(s,encoding="utf-8")
print("PROPERTY_ADAPTIVE_SLOPE_TARGET_SPACING_READY")
