from pathlib import Path
out=[]
targets=[
  ("index.html",["rgba(255","rgb(255","#ff","#f9","#f8","orange","swale","corridor","earthlineRegional","earthlineVermontReportPanel16149",".el49-shell",".el49-report",".el49-toolbar"]),
  ("earthline-launch-16872.js",["rgba(255","rgb(255","#ff","#f9","#f8","orange","swale","corridor","earthlineRegional","earthlineVermontReportPanel16149",".el49-shell",".el49-report",".el49-toolbar"]),
]
for path,needles in targets:
    p=Path(path)
    if not p.exists(): continue
    s=p.read_text(encoding="utf-8")
    for needle in needles:
        start=0;hits=0
        while True:
            i=s.find(needle,start)
            if i<0 or hits>=80: break
            out.append(f"===== {path} :: {needle} @ {i} =====\n"+s[max(0,i-9000):i+18000])
            start=i+1;hits+=1
Path("visible-worm-report-owner-17440.txt").write_text("\n\n".join(out),encoding="utf-8")
print("sections",len(out))
