from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""      selectionBoundary16539={geometry:geometry16747,prepared:geometry16747,source:'official VCGI Vermont state boundary',vermontPreselection16747:true};"""
new="""      const prepared16748=earthlinePrepareJurisdiction16539(geometry16747);
      if(!prepared16748)throw new Error('official Vermont state boundary could not be prepared for corridor selection');
      selectionBoundary16539={geometry:geometry16747,prepared:prepared16748,source:'official VCGI Vermont state boundary',vermontPreselection16747:true,preparedBoundary16748:true};"""
n=s.count(old)
if n!=1: raise SystemExit(f"16748 anchor expected once, found {n}")
s=s.replace(old,new,1)
s=s.replace(
"""window.EARTHLINE_VERMONT_PRESELECTION_BOUNDARY_16747={build:'EARTHLINE 16747',runToken,applied:true,source:'official VCGI Vermont state boundary',rule:'Vermont corridor eligibility precedes ranking, spacing and capacity; final VCGI clip remains publication safety'""",
"""window.EARTHLINE_VERMONT_PRESELECTION_BOUNDARY_16747={build:'EARTHLINE 16748',runToken,applied:true,prepared:true,source:'official VCGI Vermont state boundary',rule:'prepared Vermont corridor eligibility precedes ranking, spacing and capacity; final VCGI clip remains publication safety'"""
)
p.write_text(s,encoding="utf-8")
print("16748 applied")
