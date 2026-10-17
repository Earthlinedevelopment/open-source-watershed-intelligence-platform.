from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""try{if(typeof window.earthlinePrefetchVermontAuthority16263==='function'&&typeof earthlineRectangleAround==='function'){const boundary16466=earthlineRectangleAround(Number(target.lng),Number(target.lat),20);void window.earthlinePrefetchVermontAuthority16263(boundary16466,M.searchGen);}}catch(_){}"""
new="""/* EARTHLINE 17362 — selecting/hovering a future Property target must not launch
     Vermont E911/VCGI network I/O during an active Regional run. The unchanged
     authoritative Property analysis owner in rebuildModel(true) still starts the
     same exact-boundary prefetch before DEM/hydrology, so exclusions and fail-closed
     verification are unchanged. */"""
if s.count(old)!=1: raise SystemExit(f"target Vermont prefetch anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_TARGET_PREFETCH_DEFER_17362: remove redundant Vermont authority network prefetch from target selection; Property run-time authority owner remains unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("deferred Vermont authority prefetch to Property run owner 17362")
