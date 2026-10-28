from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")
replacements=[
  ("const thr=streamThreshold(),chanThr=thr*3.2,maxS=33;",
   "const thr=streamThreshold(),chanThr=thr*3.2,maxS=4;"),
  ("const safeSlope=slopePct(x,y)<=33;",
   "const safeSlope=slopePct(x,y)<=4;"),
  ("the live terrain is classifying most cells above the 33% slope limit",
   "the live terrain is classifying most cells above the 4% slope limit"),
  ("const chanThr=Number(lg.channelThreshold||streamThreshold()*3.2),maxS=Number(lg.maxSlopePct||33);",
   "const chanThr=Number(lg.channelThreshold||streamThreshold()*3.2),maxS=Number(lg.maxSlopePct||4);")
]
for old,new in replacements:
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"expected exactly one canonical slope anchor, got {n}: {old}")
    s=s.replace(old,new,1)

required=[
  "const thr=streamThreshold(),chanThr=thr*3.2,maxS=4;",
  "const safeSlope=slopePct(x,y)<=4;",
  "above the 4% slope limit",
  "maxS=Number(lg.maxSlopePct||4);"
]
for term in required:
    if term not in s:
        raise SystemExit(f"missing restored slope rule: {term}")

for forbidden in [
  "const thr=streamThreshold(),chanThr=thr*3.2,maxS=33;",
  "const safeSlope=slopePct(x,y)<=33;",
  "above the 33% slope limit",
  "maxS=Number(lg.maxSlopePct||33);"
]:
    if forbidden in s:
        raise SystemExit(f"obsolete slope rule remains: {forbidden}")

p.write_text(s,encoding="utf-8")
print("PASS: canonical Property slope ceiling restored to <=4% only; spacing and contour budgets unchanged.")
