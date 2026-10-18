from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_inline="""    /* EARTHLINE 17508 — exact Property frame is now installed. Prime dynamic
       Elder compute here, synchronously from the authoritative terminal owner,
       before the governed terrain/swale runner yields. This is compute-only:
       terminalPropertyRun remains sole Elder lifecycle/publication owner. */
    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.primePropertyEvidence?.()}catch(_){}
"""
if s.count(old_inline)!=1:
    raise SystemExit(f"17508 inline prime anchor count={s.count(old_inline)}")
s=s.replace(old_inline,"    /* EARTHLINE 17509 — compute prime already started from the exact current Property target at accepted click. */\n",1)

old_click="""    let out17499;
    try{out17499=fn()}catch(_){"""
new_click="""    /* EARTHLINE 17509 — propertyBounds17166 derives the exact 20-acre box from
       EARTHLINE_PROPERTY_TARGET_16201 before any map-boundary fallback. Start the
       compute-only Elder promise now so it overlaps Property preflight. The
       terminal Property owner remains the sole Elder publication/lifecycle owner. */
    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.primePropertyEvidence?.()}catch(_){}
    let out17499;
    try{out17499=fn()}catch(_){"""
if s.count(old_click)!=1:
    raise SystemExit(f"click launch anchor count={s.count(old_click)}")
s=s.replace(old_click,new_click,1)

s="<!-- EARTHLINE_ELDER_TARGET_PRIME_17509: exact current 20-acre target compute begins on accepted press; one terminal publisher retained. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed exact-target early Elder compute prime 17509")
