from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="""refresh,startProperty:startProperty17166,prefetchPropertyTarget:prefetchProperty17174,summary:()=>state.lastSummary||summarize(state.active),"""
new="""refresh,startProperty:startProperty17166,prefetchPropertyTarget:prefetchProperty17174,primePropertyEvidence:()=>dynamicPropertyEvidence(true),summary:()=>state.lastSummary||summarize(state.active),"""
if s.count(old)!=1: raise SystemExit(f"elder api anchor {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("exposed compute-only exact-target Elder prime 17500")
