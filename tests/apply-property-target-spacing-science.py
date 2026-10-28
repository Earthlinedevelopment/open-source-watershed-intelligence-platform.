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

    const propertySafeShare15771=safeCount/Math.max(1,inParcelCount);
    if(!isRegionalTile15769&&propertySafeShare15771<0.03)targetSpacingM15771=MIN_M;
    if(M.swaleDiagnostics&&M.swaleDiagnostics.performanceBudget){
      M.swaleDiagnostics.performanceBudget.targetSpacingM=targetSpacingM15771;
      M.swaleDiagnostics.performanceBudget.propertySafeShare15771=propertySafeShare15771;
      M.swaleDiagnostics.performanceBudget.spacingPolicy15771=
        isRegionalTile15769?"regional":
        (propertySafeShare15771<0.03?"sparse-safe-terrain-15ft":"standard-safe-terrain-20ft");
    }

    let levelDomainFallback="none";'''
if s.count(anchor)!=1:
    raise SystemExit(f"expected one safe-domain completion anchor; found {s.count(anchor)}")
s=s.replace(anchor,insert)
path.write_text(s,encoding="utf-8")
print("PROPERTY_ADAPTIVE_TARGET_SPACING_SCIENCE_READY")
