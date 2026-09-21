from pathlib import Path
import sys
p=Path(sys.argv[1] if len(sys.argv)>1 else "index.html")
s=p.read_text(encoding="utf-8")
def rep(name,old,new):
    global s
    n=s.count(old)
    if n!=1: raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

# Regional only: preserve Property's existing 10-pixel geometry floor.
rep("regional line floor",
    "let minLinePx16632=10;",
    "let minLinePx16632=focusMode?10:4;")

# Regional only: denser deterministic contour anchors. Property retains exact prior fractions.
rep("regional sampling",
    "const fractions=coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68];",
    "const fractions=focusMode?(coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68]):(coords.length>110?[.1,.2,.3,.4,.5,.6,.7,.8,.9]:coords.length>55?[.15,.3,.45,.6,.75,.9]:[.25,.5,.75]);")

rep("spatial marker",
    "window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16783'",
    "window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16785'")

# Keep the 16783 owner name for compatibility, update only its build report.
rep("spread marker",
    "build:'EARTHLINE 16783',candidateCells:bestByCell16783.size,chosenCount:chosen.length,",
    "build:'EARTHLINE 16785',candidateCells:bestByCell16783.size,chosenCount:chosen.length,")

marker="<!-- EARTHLINE 16781 — CLUSTER-AWARE FINE-CELL REFINEMENT."
if marker in s:
    s=s.replace(marker,
      "<!-- EARTHLINE 16785 — REGIONAL CANDIDATE-GENERATION REPAIR. Evidence from the IA/AR makeSwales gate audit showed dominant false loss at the 10-pixel Regional contour-segment floor plus spatial misses from sparse contour anchors. Regional only: accept real screened contour segments down to 4 pixels and sample long contours at denser deterministic anchors. Property remains unchanged. Slope, flow/channel, jurisdiction, mapped-water, exclusions, final capacity and ranking remain governed by the existing owners. CANDIDATE / NOT ACCEPTED. -->\n"+marker,1)

p.write_text(s,encoding="utf-8")
print("16785 combined Regional candidate-generation repair applied")
