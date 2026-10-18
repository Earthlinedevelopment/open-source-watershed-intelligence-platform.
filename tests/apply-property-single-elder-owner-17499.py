from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    /* EARTHLINE 17497 — launch the governed Property owner and the existing
       Elder owner immediately on the accepted physical press. Do not route core
       execution through requestAnimationFrame; background-tab throttling can delay
       rAF by many seconds. The synthesized click remains deduped above. */
    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}
    let out17497;
    try{out17497=fn()}catch(_){"""
new="""    /* EARTHLINE 17499 — Property activation launches only the governed Property
       owner. Elder computation remains solely owned by terminalPropertyRun after
       the exact new 20-acre frame is installed. */
    let out17499;
    try{out17499=fn()}catch(_){"""
if s.count(old)!=1: raise SystemExit(f"click Elder anchor {s.count(old)}")
s=s.replace(old,new,1)
s=s.replace("Promise.resolve(out17497).then(v17497=>{","Promise.resolve(out17499).then(v17499=>{",1)
s=s.replace("if(v17497===false&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17494){","if(v17499===false&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17494){",1)
s="<!-- EARTHLINE_ELDER_SINGLE_GOVERNED_OWNER_17499: click control never starts Elder; terminalPropertyRun owns exact-frame Elder start. -->\n"+s
p.write_text(s,encoding="utf-8")
print("removed click-level Elder owner 17499")
