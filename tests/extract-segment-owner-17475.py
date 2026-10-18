from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
needles=["earthlinePathPointUsable","function earthlineSplitUsableSegments","function earthlineMajorChannelUnsafeAt16288","function earthlineSafeCell"]
out=[]
for n in needles:
    p=0
    while True:
        i=s.find(n,p)
        if i<0:break
        out.append("===== "+n+" @ "+str(i)+" =====\n"+s[max(0,i-9000):min(len(s),i+18000)])
        p=i+len(n)
Path("segment-owner-17475.txt").write_text("\n\n".join(out),encoding="utf-8")
print("sections",len(out))
