from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}"""
new="""    try{await Promise.resolve(window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.())}catch(_){}"""
if s.count(old)!=1: raise SystemExit(f"frame-install Elder owner anchor count={s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_ELDER_BEFORE_HYDROLOGY_17515: exact-frame Elder publisher completes before heavy Property hydrology begins. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed Elder-before-hydrology ordering 17515")
