from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="""      try{void prewarmDynamicWorker()}catch(_){}
      try{void prefetchProperty17174()}catch(_){} /* EARTHLINE_ELDER_CURRENT_TARGET_PREFETCH_17452 */"""
new="""      try{void prewarmDynamicWorker()}catch(_){} /* EARTHLINE 17466 — keep Property pointer path free of target I/O */"""
if old not in s: raise SystemExit("17452 anchor missing")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("removed pre-click Elder target I/O 17466")
