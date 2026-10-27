from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="""      refresh,startProperty:startProperty17166,prefetchPropertyTarget:prefetchProperty17174,summary:()=>state.lastSummary||summarize(state.active),"""
new="""      refresh,startProperty:startProperty17166,prefetchPropertyTarget:prefetchProperty17174,
      prewarmForTest17402:prewarmDynamicWorker,warmStateForTest17402:()=>({warmed:state.dynamic.warmed,warming:!!state.dynamic.warmPromise,error:state.dynamic.error}),
      summary:()=>state.lastSummary||summarize(state.active),"""
if s.count(old)!=1: raise SystemExit(f"test export anchor {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("exposed Elder warm state for test 17402")
