import re, pathlib
s=pathlib.Path("index.html").read_text(errors="ignore")
terms=["function prescribeSwales15778","prescribeSwales15778","swaleDiagnostics","levelGenerator","levelStepM","targetSwaleSpacingM","forestPenalty","medianTerrainSlope","acceptedSpacingM"]
out=[]
for term in terms:
    for m in list(re.finditer(re.escape(term),s))[:8]:
        a=max(0,m.start()-2500); b=min(len(s),m.start()+9000)
        out.append("\n===== "+term+" @ "+str(m.start())+" =====\n"+s[a:b])
pathlib.Path("iowa-swale-source-audit.txt").write_text("\n".join(out))
print("matches",len(out))
