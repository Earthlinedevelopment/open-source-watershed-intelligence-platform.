from pathlib import Path
import re

p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s

SCRIPT_IDS=[
  "earthline-build-15816-authoritative-publication",
  "earthline-build-15822-automated-viewport-test",
  "earthline-build-15823-water-path-restoration",
  "earthline-build-15825-tributary-interception-audit",
  "earthline-build-15830-center-target",
  "earthline-build-15844-canonical-property-baseline",
  "earthline-build-15845-target-hydrologic-causality",
  "earthline-build-15854-audit-stabilization-restored",
  "earthline-build-15857-final-stamp",
  "earthline-build-15858-why-not-crosshair",
  "earthline-build-15861c-stamp-and-crosshair",
  "earthline-build-15872-authority-audit",
  "earthline-build-15873-reload-audit",
  "earthline-build-15860-rc1-geometry-restoration",
  "earthline-build-15861-explainability-decision-record",
  "earthline-build-15872-stamp-and-crosshair",
  "earthline-build-15872-final-runtime-identity",
  "earthline-build-15882-display-proof-controller",
]

def remove_script_id(script_id):
    global s
    pat=re.compile(r'<script\b[^>]*\bid=["\']'+re.escape(script_id)+r'["\'][^>]*>[\s\S]*?</script>\s*',re.I)
    s2,n=pat.subn('',s,count=1)
    if n!=1:
        raise RuntimeError(f"{script_id}: expected 1 script, found {n}")
    s=s2

for script_id in SCRIPT_IDS:
    remove_script_id(script_id)

# Remove dead styles belonging only to retired duplicate/developer targets.
STYLE_IDS=[
  "earthline-build-15830-center-target-css",
  "earthline-build-15858-why-not-crosshair-css",
  "earthline-build-15861c-crosshair-restoration",
  "earthline-build-15861g-crosshair-restoration",
]
for style_id in STYLE_IDS:
    pat=re.compile(r'<style\b[^>]*\bid=["\']'+re.escape(style_id)+r'["\'][^>]*>[\s\S]*?</style>\s*',re.I)
    s,n=pat.subn('',s,count=1)
    if n!=1:
        raise RuntimeError(f"{style_id}: expected 1 style, found {n}")

# The current governed owners that MUST remain.
required=[
  'id="earthline-build-15824-direct-water-overlay"',
  'id="earthline-build-15827-visible-analysis-boundary"',
  'function run15786(ev)',
  'async function runProperty15778(parent,anchor)',
  'function earthlineRecoveryPreflight15870()',
  'window.earthlineApplyRendererOwnership15805=',
  'window.earthlineSyncLivingSwales15792=syncLivingSwales15792;',
]
for item in required:
    if item not in s:
        raise RuntimeError("governed owner missing: "+item)

# No retired recovery/acceptance controller may remain.
for item in SCRIPT_IDS:
    if item in s:
        raise RuntimeError("retired acceptance harness remains: "+item)
for item in [
  "MAX_ATTEMPTS=8",
  "BACKOFF_MS=[0,120,300,650,1200,2100,3200,4500]",
  "earthlineRestoreSwales15882",
  "earthlineRunEssexAcceptance15847",
  "earthlineRunViewportTest15822",
  "earthlineAuthorityAudit15872",
  "earthlineReloadAudit15873",
]:
    if item in s:
        raise RuntimeError("retired acceptance/recovery behavior remains: "+item)

p.write_text(s.rstrip()+"\n",encoding="utf-8")
print("EARTHLINE_17660_ACCEPTANCE_HARNESS_REMOVAL",len(before),len(s),len(before)-len(s))

# trigger
