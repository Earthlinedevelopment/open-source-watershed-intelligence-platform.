from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="stagger=setTimeout(startAlternate,1200);"
new="stagger=setTimeout(startAlternate,2500);"
n=s.count(old)
print("terrain hedge anchors",n)
if n!=1: raise SystemExit(f"expected one terrain hedge anchor, found {n}")
s=s.replace(old,new,1)
s="/* EARTHLINE_TERRAIN_HEDGE_17275 — actual tile failures still start alternate immediately; speculative duplicate delayed from 1200ms to 2500ms to avoid redundant slow-browser decode work. Same Terrarium pixels/science. */\n"+s
p.write_text(s,encoding="utf-8")
print("17275 terrain hedge applied")
