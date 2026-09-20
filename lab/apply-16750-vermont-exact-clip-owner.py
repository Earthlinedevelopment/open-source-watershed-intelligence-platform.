from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name, old, new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

patch("mark prepared Vermont owner",
"""      const prepared16748=earthlinePrepareJurisdiction16539(geometry16747);
      if(!prepared16748)throw new Error('official Vermont state boundary could not be prepared for corridor selection');
      selectionBoundary16539={geometry:geometry16747,prepared:prepared16748,source:'official VCGI Vermont state boundary',vermontPreselection16747:true,preparedBoundary16748:true};""",
"""      const prepared16748=earthlinePrepareJurisdiction16539(geometry16747);
      if(!prepared16748)throw new Error('official Vermont state boundary could not be prepared for corridor selection');
      prepared16748.earthlineVermontExactClip16750=true;
      prepared16748.earthlineVermontGeometry16750=geometry16747;
      selectionBoundary16539={geometry:geometry16747,prepared:prepared16748,source:'official VCGI Vermont state boundary',vermontPreselection16747:true,preparedBoundary16748:true,exactClipOwner16750:true};""")

patch("use exact Vermont clip in candidate screen",
"""      const runs16539=earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);""",
"""      const runs16539=(jurisdictionGeometry16539&&jurisdictionGeometry16539.earthlineVermontExactClip16750===true&&typeof window.earthlineClipVermontLine16178==='function')
        ?window.earthlineClipVermontLine16178(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539.earthlineVermontGeometry16750)
        :earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);""")

patch("export exact Vermont line owner",
"""  window.earthlineEnsureVermontBoundary16178=ensureBoundary;window.earthlineValidateVermontBoundary16178=validateBoundary;window.earthlineClipVermontProducts16178=clipProducts;window.earthlineIsVermontRequest16178=isVermontRequest;window.earthlinePointInVermont16178=async p=>inGeometry(p,await ensureBoundary());window.earthlineBuild16178Audit=audit;""",
"""  window.earthlineEnsureVermontBoundary16178=ensureBoundary;window.earthlineValidateVermontBoundary16178=validateBoundary;window.earthlineClipVermontProducts16178=clipProducts;window.earthlineClipVermontLine16178=(coords,g)=>clipLine(coords,g||boundaryGeometry);window.earthlineIsVermontRequest16178=isVermontRequest;window.earthlinePointInVermont16178=async p=>inGeometry(p,await ensureBoundary());window.earthlineBuild16178Audit=audit;""")

patch("Vermont preselection audit build",
"""window.EARTHLINE_VERMONT_PRESELECTION_BOUNDARY_16747={build:'EARTHLINE 16748',runToken,applied:true,prepared:true,source:'official VCGI Vermont state boundary',rule:'prepared Vermont corridor eligibility precedes ranking, spacing and capacity; final VCGI clip remains publication safety'""",
"""window.EARTHLINE_VERMONT_PRESELECTION_BOUNDARY_16747={build:'EARTHLINE 16750',runToken,applied:true,prepared:true,exactClipOwner:true,source:'official VCGI Vermont state boundary',rule:'the same exact VCGI line-clip owner screens Vermont corridors before ranking and verifies them again at final publication'""")

p.write_text(s,encoding="utf-8")
print("16750 applied")
