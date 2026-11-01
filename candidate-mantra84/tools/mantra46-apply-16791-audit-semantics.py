from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

def rep(name, old, new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected once, found {n}")
    s=s.replace(old,new,1)

marker="<!-- EARTHLINE 16789 — SAME-PARENT COUNT-NEUTRAL FINAL SPREAD."
comment="<!-- EARTHLINE 16791 — CORRECTED REGIONAL AUDIT SEMANTICS. Diagnostic lineage now distinguishes candidate corridor footprint coverage from candidate ownership, and selection compares against the maximum attainable 12x12 spread under the existing 6x6 parent-floor guard. No science, thresholds, swale geometry, water safety, capacity, ranking, containment, renderer, lifecycle or Property behavior changed. CANDIDATE / NOT ACCEPTED. -->\n"
if "EARTHLINE 16791 — CORRECTED REGIONAL AUDIT SEMANTICS" not in s:
    if s.count(marker)!=1: raise SystemExit("16789 marker not unique")
    s=s.replace(marker,comment+marker,1)

rep("coverage-decl",
    "const bestByCell16783=new Map(),candidateCountByCell16783=new Map();",
    "const bestByCell16783=new Map(),candidateCountByCell16783=new Map(),candidateCoverageCellKeys16791=new Set();")

rep("coverage-loop",
"""      for(const c16783 of candidates){
        const p16783=point16783(c16783);if(!p16783)continue;""",
"""      for(const c16783 of candidates){
        const seg16791=Array.isArray(c16783&&c16783.segment)?c16783.segment:null;
        if(seg16791&&seg16791.length){
          for(const pt16791 of seg16791){
            const g16791=llGrid(hy,pt16791);if(!g16791||!Number.isFinite(Number(g16791.x))||!Number.isFinite(Number(g16791.y)))continue;
            const cx16791=Math.max(0,Math.min(11,Math.floor(Number(g16791.x)*12/Math.max(1,hy.w))));
            const cy16791=Math.max(0,Math.min(11,Math.floor(Number(g16791.y)*12/Math.max(1,hy.h))));
            candidateCoverageCellKeys16791.add(cx16791+','+cy16791);
          }
        }
        const p16783=point16783(c16783);if(!p16783)continue;""")

rep("attainable-init",
    "      let swaps16783=0;",
    "      let swaps16783=0,attainableTargetCells16791=targetCells16783,selectionStopReason16791='target-reached';")

rep("no-donor",
    "        if(donor16783<0)break;",
"""        if(donor16783<0){
          const blockerRows16791=[];
          for(const dc16791 of chosen){
            const dp16791=point16783(dc16791);if(!dp16791)continue;
            const dd16791=cellCount16783.get(dp16791.cell)||0,pn16791=parentCount16783.get(dp16791.parent)||0;
            if(dd16791>1)blockerRows16791.push({parentCount:pn16791,sameParent:dp16791.parent===add16783.point.parent});
          }
          const parentFloorBlocked16791=blockerRows16791.length>0&&blockerRows16791.every(r16791=>r16791.parentCount<=3&&!r16791.sameParent);
          if(parentFloorBlocked16791){attainableTargetCells16791=cellCount16783.size;selectionStopReason16791='parent-floor-protected';}
          else selectionStopReason16791='no-eligible-donor';
          break;
        }""")

rep("spread-object",
    "initialCells:initialCells16783,finalCells:cellCount16783.size,targetCells:targetCells16783,candidateCellKeys:Array.from(bestByCell16783.keys()).sort(),finalCellKeys:Array.from(cellCount16783.keys()).sort(),swaps:swaps16783,",
    "initialCells:initialCells16783,finalCells:cellCount16783.size,targetCells:targetCells16783,attainableTargetCells:attainableTargetCells16791,selectionStopReason:selectionStopReason16791,candidateCellKeys:Array.from(bestByCell16783.keys()).sort(),candidateCoverageCellKeys:Array.from(candidateCoverageCellKeys16791).sort(),finalCellKeys:Array.from(cellCount16783.keys()).sort(),swaps:swaps16783,")

rep("root-sets",
"""const candidateKeys=new Set(spread&&Array.isArray(spread.candidateCellKeys)?spread.candidateCellKeys:[]);
    const selectedKeys=new Set(spread&&Array.isArray(spread.finalCellKeys)?spread.finalCellKeys:[]);""",
"""const candidateKeys=new Set(spread&&Array.isArray(spread.candidateCellKeys)?spread.candidateCellKeys:[]);
    const candidateCoverageKeys=new Set(spread&&Array.isArray(spread.candidateCoverageCellKeys)?spread.candidateCoverageCellKeys:Array.from(candidateKeys));
    const selectedKeys=new Set(spread&&Array.isArray(spread.finalCellKeys)?spread.finalCellKeys:[]);""")

rep("root-candidate-diff",
    "const opportunityNoCandidate=diff(opportunityKeys,candidateKeys);",
    "const opportunityNoCandidate=diff(opportunityKeys,candidateCoverageKeys);")

rep("root-selection-target",
    "const target=Number(spread.targetCells||Math.min(Number(spread.chosenCount||0),Number(spread.candidateCells||0)));",
    "const target=Number(spread.attainableTargetCells??spread.targetCells??Math.min(Number(spread.chosenCount||0),Number(spread.candidateCells||0)));")

rep("candidate-generation-fail-metrics",
    "{opportunityCells:opportunityKeys.size,candidateCells:candidateKeys.size,missingCandidateCells:opportunityNoCandidate.length,missingKeys:opportunityNoCandidate.slice(0,24)});",
    "{opportunityCells:opportunityKeys.size,candidateCells:candidateKeys.size,candidateCoverageCells:candidateCoverageKeys.size,missingCandidateCells:opportunityNoCandidate.length,missingKeys:opportunityNoCandidate.slice(0,24)});")

rep("candidate-generation-clear-metrics",
    "{opportunityCells:opportunityKeys.size,candidateCells:candidateKeys.size});",
    "{opportunityCells:opportunityKeys.size,candidateCells:candidateKeys.size,candidateCoverageCells:candidateCoverageKeys.size});")

rep("cell-lineage",
    "opportunityCells:opportunityKeys.size,candidateCells:candidateKeys.size,selectedCells:selectedKeys.size,publishedCells:publishedKeys.size||null,",
    "opportunityCells:opportunityKeys.size,candidateCells:candidateKeys.size,candidateCoverageCells:candidateCoverageKeys.size,selectedCells:selectedKeys.size,publishedCells:publishedKeys.size||null,")

p.write_text(s,encoding="utf-8")
print("EARTHLINE 16791 installer applied")
