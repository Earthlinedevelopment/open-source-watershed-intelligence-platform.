from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

# Performance-only: local refinement windows generate terrain-derived candidate geometry
# without repeatedly clipping every provisional candidate to the full jurisdiction polygon.
# The existing authoritative full-grid makeSwales call still screens the consolidated
# supplemental candidate pool through screenJurisdictionCandidate16539 before any
# ranking/spacing/capacity/publication. No slope/flow/spacing/capacity rules change.
repls={
"makeSwales(h16702,c16702,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16702,c16702,false,null,null)",
"makeSwales(h16730,c16730,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16730,c16730,false,null,null)",
"makeSwales(sub16839,c16839,false,swaleJurisdictionGeometry16539,null)":"makeSwales(sub16839,c16839,false,null,null)",
"makeSwales(h16780,c16780,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16780,c16780,false,null,null)",
"makeSwales(h16731,c16731,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16731,c16731,false,null,null)",
"makeSwales(h16741,c16741,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16741,c16741,false,null,null)"
}
hits=0
for old,new in repls.items():
    n=s.count(old)
    print(old,n)
    if n:
        s=s.replace(old,new)
        hits+=n
if hits<5:
    raise SystemExit("expected at least five local refinement call anchors, got "+str(hits))

marker="/* EARTHLINE_CONSOLIDATED_JURISDICTION_SCREEN_17262 — local refinement candidate generation defers exact jurisdiction clipping to the existing authoritative consolidated makeSwales screen; science thresholds unchanged. */\n"
s=marker+s


# 17269 browser-performance hypothesis:
# Chromium uses scheduler.yield(); Firefox/WebKit fall back to setTimeout(0).
# Replace only that fallback with MessageChannel, preserving the same cooperative-yield semantics.
old_yield="async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();return new Promise(r=>setTimeout(r,0));}"
new_yield="""async function earthlineCooperativeYield16661(){
  if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();
  if(typeof MessageChannel==='function')return new Promise(resolve=>{
    const ch=new MessageChannel();
    ch.port1.onmessage=()=>{try{ch.port1.close();ch.port2.close()}catch(_){} resolve();};
    ch.port2.postMessage(0);
  });
  return Promise.resolve();
}"""
if old_yield not in s:
    raise SystemExit("yield anchor not found")
s=s.replace(old_yield,new_yield,1)
print("patched cooperative yield fallback")

p.write_text(s,encoding="utf-8")
print("replaced",hits)
