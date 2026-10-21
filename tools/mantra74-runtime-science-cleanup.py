from pathlib import Path
import re

p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s

def remove_script_id(script_id):
    global s
    pat=re.compile(r'<script\b[^>]*\bid=["\']'+re.escape(script_id)+r'["\'][^>]*>[\s\S]*?</script>\s*',re.I)
    s2,n=pat.subn('',s,count=1)
    if n!=1:
        raise RuntimeError(f"{script_id}: expected 1 script, found {n}")
    s=s2

# Remove parser-started Elder worker. Elder research is no longer in launch lifecycle.
pat=re.compile(r'<script>\s*/\*\s*EARTHLINE_ELDER_EARLY_WORKER_17520[\s\S]*?</script>\s*',re.I)
s,n=pat.subn('',s,count=1)
if n!=1:
    raise RuntimeError(f"early Elder worker: expected 1 script, found {n}")

# Remove public/developer-only runtimes that add fixed UI, intervals or audit overlays.
for script_id in [
    "earthline-build-15857-early-runtime-diagnosis",
    "earthline-build-15861b-runtime-self-diagnosis",
    "earthline-build-15821-frame-status",
    "earthline-build-15826-driveway-opportunity-audit",
]:
    remove_script_id(script_id)

# Retire the old procedural Run Analysis implementation. Later governed controllers
# rebind earthlineRunAnalysis to run15786; the legacy implementation must fail closed
# rather than ever publish generated-terrain screening swales.
start='async function earthlineRunAnalysis(options={}){'
end='document.getElementById("runBtn").addEventListener("click",earthlineRunAnalysis);'
a=s.find(start)
b=s.find(end,a)
if a<0 or b<0:
    raise RuntimeError("legacy fast Run Analysis block markers missing")
b+=len(end)
replacement='''async function earthlineRunAnalysis(options={}){
  /* EARTHLINE 17650 — legacy pre-real-data analysis path retired.
     The governed run15786 owner replaces this binding later in startup.
     Until then, fail closed: no procedural DEM, hydrology, recharge or swales. */
  try{earthlineReady("Earthline real-data analysis engine is initializing. No synthetic result was generated.");}catch(_){}
  return false;
}
'''
s=s[:a]+replacement+s[b:]

# Remove the unused explicit synthetic-swale fallback completely.
start='async function earthlineGenerateScreeningFallbackSwales(myGen=M.searchGen){'
end='/* BUILD-CHECK-15791 — terrain handoff evidence.'
a=s.find(start)
b=s.find(end,a)
if a<0 or b<0:
    raise RuntimeError("synthetic screening fallback markers missing")
s=s[:a]+'''/* EARTHLINE 17650 — synthetic screening-swale fallback retired.
   A real DEM result with zero suitable corridors remains zero; missing real terrain
   fails closed and may not be replaced by generated terrain. */

'''+s[b:]

# Hard assertions: these paths may never return to the public runtime.
for bad in [
    "EARTHLINE_ELDER_EARLY_WORKER_17520",
    "earthline-build-15857-early-runtime-diagnosis",
    "earthline-build-15861b-runtime-self-diagnosis",
    "earthline-build-15821-frame-status",
    "earthline-build-15826-driveway-opportunity-audit",
    'M.demSource="fast preliminary terrain screen"',
    "Fast preliminary analysis complete",
    "function earthlineGenerateScreeningFallbackSwales",
    "generated screening fallback (survey verification required)",
]:
    if bad in s:
        raise RuntimeError("retired runtime remains: "+bad)

# Preserve the governed real-data owner.
for required in [
    "function run15786(ev)",
    "async function runProperty15778(parent,anchor)",
    "const ok=await rebuildModel(true,gen);",
    "No fallback swales were substituted.",
]:
    if required not in s:
        raise RuntimeError("governed real-data owner missing: "+required)

p.write_text(s.rstrip()+"\n",encoding="utf-8")
print("EARTHLINE_17650_RUNTIME_AND_SYNTHETIC_CLEANUP",len(before),len(s),len(before)-len(s))

# trigger
