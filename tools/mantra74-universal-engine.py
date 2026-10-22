from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s

def one(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f"{label}: expected 1, found {n}")
    s=s.replace(old,new,1)

one(
"const vermontRequest=typeof window.earthlineIsVermontRequest16178==='function'&&window.earthlineIsVermontRequest16178(q,loc);",
"const vermontRequest=false; /* EARTHLINE 17690 — shared US-state boundary owner handles Vermont exactly like every other state. */",
"disable separate Vermont Regional branch"
)

one(
"if(typeof window.earthlineValidateVermontBoundary16178==='function'){\n      localGate17630=await window.earthlineValidateVermontBoundary16178(",
"const localSourceQuery17630=String(window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970?.query||'').toLowerCase();\n    if(/\\bvermont\\b|\\bvt\\b/.test(localSourceQuery17630)&&typeof window.earthlineValidateVermontBoundary16178==='function'){\n      localGate17630=await window.earthlineValidateVermontBoundary16178(",
"scope Vermont authority to Vermont source availability"
)

one(
"try{void ensureBoundary().catch(()=>{});}catch(_){ }",
"/* EARTHLINE 17690 — no unconditional Vermont boundary preload; local authority is lazy and source-driven. */",
"remove unconditional Vermont preload"
)

one(
"function install(){stamp();installPanel16188();ensureBoundary().catch(error=>{lastError=error;console.error('[Earthline 16233] Vermont boundary unavailable',error)});setTimeout(stamp,1200);",
"function install(){stamp();installPanel16188();setTimeout(stamp,1200);",
"remove Vermont startup fetch"
)

# Architecture checks
if "const vermontRequest=false;" not in s:
    raise RuntimeError("shared Vermont routing missing")
if "installPanel16188();ensureBoundary()" in s:
    raise RuntimeError("Vermont startup fetch remains")
if "try{void ensureBoundary().catch(()=>{});" in s:
    raise RuntimeError("Vermont preload remains")

p.write_text(s,encoding="utf-8")
print("EARTHLINE_17690_UNIVERSAL_ENGINE",len(before),len(s),len(before)-len(s))

# trigger
