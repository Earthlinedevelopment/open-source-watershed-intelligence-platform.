from pathlib import Path
out=[]
for path in ["index.html","earthline-launch-16872.js","earthline-launch-16872.css"]:
    p=Path(path)
    if not p.exists(): continue
    s=p.read_text(encoding="utf-8")
    for needle in [
        "earthlineVermontReport16149","Bioswale Impact Report","downloadHtml",
        "window.print","print()","reportPanel","report-shell","iframe",
        "earthlineReport","Download","Print"
    ]:
        start=0;hits=0
        while True:
            i=s.find(needle,start)
            if i<0 or hits>=40: break
            out.append(f"===== {path} :: {needle} @ {i} =====\n"+s[max(0,i-7000):i+14000])
            start=i+1;hits+=1
Path("report-owner-17439.txt").write_text("\n\n".join(out),encoding="utf-8")
print("sections",len(out))
