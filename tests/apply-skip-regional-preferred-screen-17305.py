from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);
    if(!focusMode||preferredEligibleCount16539<36){"""
new="""const preferredEligibleCount16539=focusMode?await jurisdictionEligibleCount16539(candidates):null;
    if(!focusMode||preferredEligibleCount16539<36){"""
n=s.count(old)
if n!=1: raise SystemExit(f"preferred Regional screen anchor count {n}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_REGIONAL_REDUNDANT_PREFERRED_SCREEN_17305: Regional already always enters relaxed generation; skip unused pre-screen. Focus/Property semantics unchanged. Final authoritative jurisdiction screen remains unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("removed redundant Regional preferred jurisdiction pre-screen 17305")
