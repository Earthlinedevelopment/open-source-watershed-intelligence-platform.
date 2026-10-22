from pathlib import Path
import re
s=Path("baseline/index.html").read_text(errors="ignore")
terms=[
"Regional Opportunity Tile","regional","swale","dedupe","spacing","coverage",
"maxFinal","maxCandidates","renderedSwales","corridorGeometryVisible",
"reserveBudget","M.swales","kept","flowFirst"
]
for term in terms:
    hits=[m.start() for m in re.finditer(re.escape(term),s,re.I)]
    print("\n###",term,"COUNT",len(hits))
    for pos in hits[-8:]:
        print("\n---",pos,"---")
        print(s[max(0,pos-2400):min(len(s),pos+6200)])
