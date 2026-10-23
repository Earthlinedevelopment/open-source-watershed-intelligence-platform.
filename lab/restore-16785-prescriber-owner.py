from pathlib import Path
import subprocess

OLD_SHA="4ec61d6ce7d08ef0265ba3d4b566115616df0376"
current=Path("index.html").read_text(encoding="utf-8")
old=subprocess.check_output(["git","show",f"{OLD_SHA}:index.html"],text=True)

def owner(src):
    marker="async function prescribeSwales15778("
    start=src.rfind(marker)
    end=src.find("\n  prescribeSwales=prescribeSwales15778;",start)
    if start<0 or end<0:
        raise SystemExit(f"prescriber owner not found: {start},{end}")
    return start,end,src[start:end]

cs,ce,cb=owner(current)
os,oe,ob=owner(old)
if len(ob)<40000:
    raise SystemExit(f"historical prescriber unexpectedly small: {len(ob)}")
next_src=current[:cs]+ob+current[ce:]
Path("index.html").write_text(next_src,encoding="utf-8")
print("RESTORED_FULL_OWNER",len(cb),"->",len(ob))

# trigger whole-owner recovery
