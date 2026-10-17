from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
needles=[
 "earthlineFinalizeVectorVerification16343",
 "earthlineFetchOverpass15862P",
 "vectorNoBuild15778",
 "vector-exclusion-coverage-unverified",
 "mapped roads/buildings",
 "earthlineInfraCoverageRecord15862P",
 "EARTHLINE 16516"
]
out=[]
for n in needles:
    start=0
    while True:
        i=s.find(n,start)
        if i<0: break
        out.append(f"===== {n} @ {i} =====\n"+s[max(0,i-18000):i+36000])
        start=i+1
Path("vector-exclusion-owner-17432.txt").write_text("\n\n".join(out),encoding="utf-8")
print("sections",len(out))
