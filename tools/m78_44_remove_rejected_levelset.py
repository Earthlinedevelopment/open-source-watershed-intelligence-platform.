from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

bad_marker="/* EARTHLINE M78.30 — deterministic local DEM level-set fallback."
trace_anchor="function traceLevelContour(sx,sy,L,maxS,dropH){"

if bad_marker in s:
    a=s.index(bad_marker)
    b=s.index(trace_anchor,a)
    s=s[:a]+s[b:]

# Remove the formal kernel identity comment if it was inserted immediately before the rejected fallback.
s=s.replace("/* EARTHLINE SCIENCE KERNEL v1.0.0 — immutable runtime identity */\n","")

# Restore the original marching-contour return path and remove the M78.30 fallback call/state.
needle="const localM78=earthlineTraceLocalLevelSetM78"
if needle in s:
    n=s.index(needle)
    a=s.rfind("  const a=walk(0),b=walk(1);",0,n)
    b=s.find("  return [];\n}",n)
    if a<0 or b<0:
        raise SystemExit("M78.44 trace fallback anchors missing")
    b+=len("  return [];\n}")
    original="""  const a=walk(0),b=walk(1);
  const merged=a.slice().reverse().concat(b);
  if(merged.length<3)return [];

  return earthlineCleanPath(merged);
}"""
    s=s[:a]+original+s[b:]

# Fail if any rejected local-level-set runtime remains.
for token in [
    "earthlineTraceLocalLevelSetM78",
    "M78.30-local-level-set-fallback",
    "EARTHLINE M78.30 — deterministic local DEM level-set fallback",
    "Earthline-Science-Kernel-v1.0.0"
]:
    if token in s:
        raise SystemExit("Rejected science runtime still present: "+token)

marker="EARTHLINE M78.44 — rejected local level-set pivot removed; pre-pivot contour prescriber restored"
if marker not in s:
    anchor=trace_anchor
    if anchor not in s:
        raise SystemExit("pre-pivot traceLevelContour owner missing")
    s=s.replace(anchor,"/* "+marker+" */\n"+anchor,1)

p.write_text(s,encoding="utf-8")
print("Removed rejected M78.30 science pivot and restored pre-pivot contour prescriber")
