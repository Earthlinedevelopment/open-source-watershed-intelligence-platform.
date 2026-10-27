from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker='M.vectorNoBuildCoverage.evidencePath17630="shared-style-zero-plus-infrastructure-fallback"'
if marker in s:
    raise SystemExit(0)

style_marker='M.vectorNoBuildCoverage.evidencePath17630="shared-style-first"'
style_pos=s.find(style_marker)
start=s.find('if(localAuthorityAvailable17630){',style_pos)
if style_pos < 0 or start < 0:
    raise SystemExit("M78.9 style fallback anchor missing")

brace=s.find('{',start)
depth=0
end=-1
for i in range(brace,len(s)):
    if s[i]=='{':
        depth+=1
    elif s[i]=='}':
        depth-=1
        if depth==0:
            end=i
            break
if end < 0:
    raise SystemExit("M78.9 local authority block close missing")

addition='''else if(bounded.length===0){
          /* EARTHLINE M78.9 — a successful loaded-style query with zero relevant
             exclusion geometry is not proof that the Property frame is clear.
             Use the existing shared infrastructure adapter before screened-clear. */
          earthlineProgress("hydrology","confirming parcel exclusions from open data…");
          const fallbackEvidenceM789=await infrastructure16550();
          if(earthlineIsStale(myGen)){
            earthlineSetVectorVerification16343(M.vectorNoBuildCoverage,"unverified","analysis-stale-after-zero-style-fallback");
            return false;
          }
          infrastructure15862P=fallbackEvidenceM789||infrastructure15862P;
          earthlineMergeInfraMasks15862P(roadMask,buildingMask,infrastructure15862P);
          count+=Number(infrastructure15862P&&infrastructure15862P.processedGeometryCount||0);
          M.vectorNoBuildCoverage.sourceFeatureCount+=Number(infrastructure15862P&&infrastructure15862P.overpass&&infrastructure15862P.overpass.rawElementCount||0);
          M.vectorNoBuildCoverage.evidencePath17630="shared-style-zero-plus-infrastructure-fallback";
        }'''

s=s[:end+1]+addition+s[end+1:]
if s.count("shared-style-zero-plus-infrastructure-fallback") != 1:
    raise SystemExit("M78.9 shared fallback marker count wrong")
p.write_text(s,encoding="utf-8")
