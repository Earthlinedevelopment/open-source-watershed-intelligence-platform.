from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);
      const runs16539="""
new="""      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);
      if(candidate16539&&candidate16539.screenedJurisdiction16539===jurisdictionGeometry16539){
        jurisdictionScreenCache16592.set(candidate16539,candidate16539);
        return candidate16539;
      }
      const runs16539="""
if s.count(old)!=1: raise SystemExit(f"screen anchor count {s.count(old)}")
s=s.replace(old,new,1)

repls=[
("refined16702:true,coastKm16702:", "refined16702:true,screenedJurisdiction16539:swaleJurisdictionGeometry16539,coastKm16702:"),
("refined16702:true,terrainGap16730:true,", "refined16702:true,screenedJurisdiction16539:swaleJurisdictionGeometry16539,terrainGap16730:true,"),
("refined16702:true,statewideSupertile16839:true,", "refined16702:true,screenedJurisdiction16539:swaleJurisdictionGeometry16539,statewideSupertile16839:true,"),
("refined16702:true,fineOpportunity16780:true,", "refined16702:true,screenedJurisdiction16539:swaleJurisdictionGeometry16539,fineOpportunity16780:true,"),
("refined16702:true,coverageGap16731:true,tile16702:tile16731.id", "refined16702:true,screenedJurisdiction16539:swaleJurisdictionGeometry16539,coverageGap16731:true,tile16702:tile16731.id"),
("refined16702:true,coverageGap16731:true,lateGap16741:true,", "refined16702:true,screenedJurisdiction16539:swaleJurisdictionGeometry16539,coverageGap16731:true,lateGap16741:true,")
]
for old,new in repls:
    c=s.count(old)
    if c<1: raise SystemExit(f"marker not found: {old}")
    s=s.replace(old,new)

p.write_text(s,encoding="utf-8")
print("reused same-boundary jurisdiction certification for local refinement candidates 17298")
