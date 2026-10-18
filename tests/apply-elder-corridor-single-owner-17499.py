from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="""      corridorBlock(f);
      try{void prefetchProperty17174()}catch(_){}
      /* EARTHLINE 17468 — begin the approved Elder computation after corridor
         selection, off the click path. Same detector, same target identity,
         same published evidence; Property later reuses the exact cached result. */
      setTimeout(()=>{try{void dynamicPropertyEvidence(true)}catch(_){}},0);
      return out;"""
new="""      corridorBlock(f);
      /* EARTHLINE 17499 — corridor selection is presentation only for Elder.
         Do not prefetch or compute Property Elder evidence here; the governed
         terminalPropertyRun starts the exact-frame Elder owner once. */
      return out;"""
if s.count(old)!=1: raise SystemExit(f"corridor Elder anchor {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("removed corridor Elder compute/prefetch owner 17499")
