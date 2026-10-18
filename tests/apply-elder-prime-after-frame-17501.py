from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old=r'''    /* EARTHLINE 17500 — start compute-only Elder evidence for the exact current
       target immediately on the accepted press. This does not publish or mutate
       Elder lifecycle state; terminalPropertyRun remains the sole lifecycle/
       publication owner and reuses the same keyed promise/result. */
    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.primePropertyEvidence?.()}catch(_){}
    let out17499;
    try{out17499=fn()}catch(_){'''
new=r'''    /* EARTHLINE 17501 — governed Property declaration must install the new
       20-acre frame before Elder compute is primed. This prevents repeat searches
       from priming the previous parcel. terminalPropertyRun remains sole Elder
       lifecycle/publication owner. */
    let out17499;
    try{out17499=fn()}catch(_){'''
if s.count(old)!=1: raise SystemExit(f"17500 pre-prime anchor {s.count(old)}")
s=s.replace(old,new,1)
old2=r'''      return false;
    }
    Promise.resolve(out17499).then(v17499=>{'''
new2=r'''      return false;
    }
    if(out17499!==false){
      setTimeout(()=>{try{void window.EARTHLINE_ELDER_TREES_V1_17097?.primePropertyEvidence?.()}catch(_){}},0);
    }
    Promise.resolve(out17499).then(v17499=>{'''
if s.count(old2)<1: raise SystemExit("post-fn anchor missing")
# replace first matching after our activation block
pos=s.index("let out17499;")
i=s.index(old2,pos)
s=s[:i]+new2+s[i+len(old2):]
s="<!-- EARTHLINE_ELDER_PRIME_AFTER_PROPERTY_FRAME_17501: compute-only Elder prime follows governed frame install. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed Elder prime after Property frame 17501")
