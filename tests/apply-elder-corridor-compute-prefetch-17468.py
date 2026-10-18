from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="""      try{void prefetchProperty17174()}catch(_){} /* EARTHLINE_ELDER_CORRIDOR_PREFETCH_17195 */
      return out;"""
new="""      try{void prefetchProperty17174()}catch(_){}
      /* EARTHLINE 17468 — begin the approved Elder computation after corridor
         selection, off the click path. Same detector, same target identity,
         same published evidence; Property later reuses the exact cached result. */
      setTimeout(()=>{try{void dynamicPropertyEvidence(true)}catch(_){}},0);
      return out;"""
if old not in s: raise SystemExit("corridor prefetch anchor missing")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("installed corridor-time Elder compute prefetch 17468")
