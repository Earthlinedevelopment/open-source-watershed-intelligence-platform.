from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_timer="""    if(out17499!==false){
      setTimeout(()=>{try{void window.EARTHLINE_ELDER_TREES_V1_17097?.primePropertyEvidence?.()}catch(_){}},0);
    }
    Promise.resolve(out17499).then(v17499=>{"""
new_timer="""    Promise.resolve(out17499).then(v17499=>{"""
if s.count(old_timer)!=1: raise SystemExit(f"timer prime anchor {s.count(old_timer)}")
s=s.replace(old_timer,new_timer,1)

old_hook="""    /* EARTHLINE 17503 — retired duplicate early Elder start; terminalPropertyRun is sole lifecycle owner. */"""
new_hook="""    /* EARTHLINE 17508 — exact Property frame is now installed. Prime dynamic
       Elder compute here, synchronously from the authoritative terminal owner,
       before the governed terrain/swale runner yields. This is compute-only:
       terminalPropertyRun remains sole Elder lifecycle/publication owner. */
    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.primePropertyEvidence?.()}catch(_){}"""
if s.count(old_hook)!=1: raise SystemExit(f"terminal frame hook {s.count(old_hook)}")
s=s.replace(old_hook,new_hook,1)

s="<!-- EARTHLINE_ELDER_EXACT_FRAME_INLINE_PRIME_17508: compute prime starts at authoritative Property frame install, no UI timer. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed exact-frame inline Elder prime 17508")
