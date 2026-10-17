from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
a=s.find("async function makeSwales(")
if a<0:a=s.find("  async function makeSwales(")
if a<0:raise SystemExit("makeSwales start missing")
b=s.find("    candidates.sort((a,b)=>b.score-a.score);",a)
if b<0:raise SystemExit("candidate sort missing")
Path("makeswales-candidate-owner-17364.txt").write_text(s[a:b+len("    candidates.sort((a,b)=>b.score-a.score);")],encoding="utf-8")
print("extracted",a,b)
