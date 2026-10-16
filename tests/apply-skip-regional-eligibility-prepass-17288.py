from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);
    if(!focusMode||preferredEligibleCount16539<36){"""
new="""    const preferredEligibleCount16539=focusMode?await jurisdictionEligibleCount16539(candidates):candidates.length;
    if(!focusMode||preferredEligibleCount16539<36){"""
if s.count(old)!=1: raise SystemExit(f"eligibility prepass anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_SKIP_REDUNDANT_REGIONAL_ELIGIBILITY_PREPASS_17288: Regional relaxed pass is unconditional, so defer its one exact jurisdiction screen to the existing final screening loop; focus-mode behavior unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched redundant Regional eligibility prepass 17288")
