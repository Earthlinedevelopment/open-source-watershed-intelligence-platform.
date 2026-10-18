from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="""      try{void prewarmDynamicWorker()}catch(_){}"""
new="""      try{void prewarmDynamicWorker()}catch(_){}
      try{void prefetchProperty17174()}catch(_){} /* EARTHLINE_ELDER_CURRENT_TARGET_PREFETCH_17452 */"""
count=s.count(old)
if count<1: raise SystemExit(f"pointerdown prewarm anchor missing {count}")
# replace only the pointerdown occurrence nearest 17442 comment
pos=s.find("EARTHLINE 17442")
idx=s.find(old,pos)
if idx<0: raise SystemExit("17442 pointerdown anchor unavailable")
s=s[:idx]+s[idx:].replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("installed current-target Elder prefetch 17452")
