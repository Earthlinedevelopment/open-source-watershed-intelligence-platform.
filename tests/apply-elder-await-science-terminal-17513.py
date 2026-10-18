from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""      try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}"""
new="""      try{await Promise.resolve(window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.())}catch(_){}"""
if s.count(old)!=1: raise SystemExit(f"Elder scientific-terminal publisher anchor count={s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_ELDER_AWAIT_SCIENCE_TERMINAL_17513: verified Property science awaits the single Elder publisher before optional map/texture finishing. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed awaited Elder scientific-terminal publication 17513")
