from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
needles=["earthlineSelectedSiteFromCenter","function selectedSiteFromCenter","selectedSiteFromCenter"]
out=[]
for n in needles:
    start=0
    while True:
        i=s.find(n,start)
        if i<0: break
        out.append(f"===== {n} @ {i} =====\n"+s[max(0,i-12000):i+24000])
        start=i+1
Path("selected-site-owner-17430.txt").write_text("\n\n".join(out),encoding="utf-8")
print("sections",len(out))
