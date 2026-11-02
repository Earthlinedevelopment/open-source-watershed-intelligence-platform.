from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

marker="<!-- EARTHLINE 16789 — SAME-PARENT COUNT-NEUTRAL FINAL SPREAD."
comment="<!-- EARTHLINE 16790 — CANDIDATE FOOTPRINT AUDIT OWNERSHIP. Diagnostic-only: candidate-generation coverage is measured by every 12x12 cell crossed by each real screened corridor footprint, while final-spread selection ownership remains the existing candidate anchor cell. This separates generation evidence from selection ownership and removes false no-candidate verdicts without changing terrain, slope, water safety, jurisdiction containment, ranking, capacity, renderer, or Property behavior. CANDIDATE / NOT ACCEPTED. -->\n"
if "EARTHLINE 16790 — CANDIDATE FOOTPRINT AUDIT OWNERSHIP" not in s:
    n=s.count(marker)
    if n!=1: raise SystemExit(f"16789 marker expected once, found {n}")
    s=s.replace(marker,comment+marker,1)

repls=[
("const bestByCell16783=new Map(),candidateCountByCell16783=new Map();",
 "const bestByCell16783=new Map(),candidateCountByCell16783=new Map(),candidateCoverageCellKeys16790=new Set();"),
("""      for(const c16783 of candidates){
        const p16783=point16783(c16783);if(!p16783)continue;""",
"""      for(const c16783 of candidates){
        const seg16790=Array.isArray(c16783&&c16783.segment)?c16783.segment:null;
        if(seg16790&&seg16790.length){
          for(const pt16790 of seg16790){
            const g16790=llGrid(hy,pt16790);if(!g16790||!Number.isFinite(Number(g16790.x))||!Number.isFinite(Number(g16790.y)))continue;
            const cx16790=Math.max(0,Math.min(11,Math.floor(Number(g16790.x)*12/Math.max(1,hy.w))));
            const cy16790=Math.max(0,Math.min(11,Math.floor(Number(g16790.y)*12/Math.max(1,hy.h))));
            candidateCoverageCellKeys16790.add(cx16790+','+cy16790);
          }
        }
        const p16783=point16783(c16783);if(!p16783)continue;"""),
("initialCells:initialCells16783,finalCells:cellCount16783.size,targetCells:targetCells16783,candidateCellKeys:Array.from(bestByCell16783.keys()).sort(),finalCellKeys:Array.from(cellCount16783.keys()).sort(),swaps:swaps16783,",
 "initialCells:initialCells16783,finalCells:cellCount16783.size,targetCells:targetCells16783,candidateCellKeys:Array.from(bestByCell16783.keys()).sort(),candidateCoverageCellKeys:Array.from(candidateCoverageCellKeys16790).sort(),finalCellKeys:Array.from(cellCount16783.keys()).sort(),swaps:swaps16783,"),
("""const candidateKeys=new Set(spread&&Array.isArray(spread.candidateCellKeys)?spread.candidateCellKeys:[]);
    const selectedKeys=new Set(spread&&Array.isArray(spread.finalCellKeys)?spread.finalCellKeys:[]);""",
"""const candidateKeys=new Set(spread&&Array.isArray(spread.candidateCellKeys)?spread.candidateCellKeys:[]);
    const candidateCoverageKeys=new Set(spread&&Array.isArray(spread.candidateCoverageCellKeys)?spread.candidateCoverageCellKeys:Array.from(candidateKeys));
    const selectedKeys=new Set(spread&&Array.isArray(spread.finalCellKeys)?spread.finalCellKeys:[]);"""),
("const opportunityNoCandidate=diff(opportunityKeys,candidateKeys);",
 "const opportunityNoCandidate=diff(opportunityKeys,candidateCoverageKeys);")
]
for old,new in repls:
    n=s.count(old)
    if n!=1: raise SystemExit(f"expected one occurrence, found {n}: {old[:100]!r}")
    s=s.replace(old,new,1)

p.write_text(s,encoding="utf-8")
print("EARTHLINE 16790 audit correction applied")
