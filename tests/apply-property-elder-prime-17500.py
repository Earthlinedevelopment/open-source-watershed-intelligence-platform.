from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    /* EARTHLINE 17499 — Property activation launches only the governed Property
       owner. Elder computation remains solely owned by terminalPropertyRun after
       the exact new 20-acre frame is installed. */
    let out17499;"""
new="""    /* EARTHLINE 17500 — start compute-only Elder evidence for the exact current
       target immediately on the accepted press. This does not publish or mutate
       Elder lifecycle state; terminalPropertyRun remains the sole lifecycle/
       publication owner and reuses the same keyed promise/result. */
    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.primePropertyEvidence?.()}catch(_){}
    let out17499;"""
if s.count(old)!=1: raise SystemExit(f"activation prime anchor {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_ELDER_EXACT_TARGET_COMPUTE_PRIME_17500: compute-only prime overlaps Property preflight; terminal owner remains sole publisher. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed exact-target compute-only Elder prime 17500")
