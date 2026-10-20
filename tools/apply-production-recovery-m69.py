from pathlib import Path

INDEX = Path("index.html")
LAUNCH = Path("earthline-launch-16872.js")

s = INDEX.read_text(encoding="utf-8")
launch = LAUNCH.read_text(encoding="utf-8")

def replace_exact(text, old, new, label, expected=1):
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"{label}: expected {expected} occurrence(s), found {count}")
    return text.replace(old, new, expected)

# D3 / D4 — remove the unapproved Support surface and obsolete live-path copy.
s = replace_exact(
    s,
    '''<button class="fitem" data-act="support"><svg viewbox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M9.2 9.2a2.8 2.8 0 1 1 4 3.9c-.8.7-1.2 1.1-1.2 2.1"></path><circle cx="12" cy="17.6" fill="currentColor" r=".6"></circle></svg><span class="t"><b>SUPPORT</b><span>Help &amp; Documentation</span></span></button>
''',
    "",
    "D3 footer Support button",
)
s = replace_exact(
    s,
    '''function supportHTML(){
  return "<h5>About this build</h5><p>Earthline Hydrology Platform — final approved design with a real flow engine. Each property runs: seeded heightfield → priority-flood pit fill → D8 flow directions → flow accumulation → rain tributaries with direction arrows → on-contour bioswale prescriptions ranked by intercepted runoff. Fully offline; no tokens or dependencies.</p><h5>Upgrade path to live data</h5><ul><li>Mapbox/MapTiler satellite + terrain tiles (API token)</li><li>Geocoding for any-address search</li><li>USGS 3DEP / LiDAR DEM in place of generated terrain</li><li>Aquifer GIS polygons, NRCS soils, FEMA flood zones</li></ul><h5>Workflow</h5><p>Search → choose storm scenario → follow arrows and tributaries → review ranked corridors → field checklist. Nothing on screen is a construction document until field verification is complete.</p>";
}
''',
    "",
    "D4 obsolete supportHTML",
)
s = replace_exact(
    s,
    '  else if(act==="support")openModal("Support — Help & Documentation",supportHTML());\n',
    "",
    "D3 Support action branch",
)
s = replace_exact(
    s,
    'document.getElementById("brandHome").addEventListener("click",()=>handleAction("support"));\n',
    "",
    "D3 brand-to-Support binding",
)

# D1 — preserve evidence computation/audit/report data; stop publishing an unapproved status box.
d1_old = '''  function render(){
    const root=document.documentElement,tier=String(root.dataset.earthlineAnalysisTier||"").toLowerCase();
    const slot=document.getElementById("earthlineStatusSlot16188")||document.getElementById("earthlineStatusSection16188");
    let el=document.getElementById("earthlineExclusionEvidence16516");
    if(tier!=="property"){if(el)el.remove();return null;}
    const e=evidence();if(!e||!slot)return e;
    if(!el){el=document.createElement("div");el.id="earthlineExclusionEvidence16516";el.setAttribute("role","status");slot.prepend(el);}
    el.dataset.kind=e.kind;el.innerHTML='<div class="el16516-grade"></div><div class="el16516-detail"></div>';
    el.querySelector(".el16516-grade").textContent=e.label;el.querySelector(".el16516-detail").textContent=e.detail;
    window.EARTHLINE_EXCLUSION_EVIDENCE_16516=e;return e;
  }
'''
d1_new = '''  function render(){
    const e=evidence();
    const el=document.getElementById("earthlineExclusionEvidence16516");
    if(el)el.remove();
    window.EARTHLINE_EXCLUSION_EVIDENCE_16516=e;
    return e;
  }
'''
s = replace_exact(s, d1_old, d1_new, "D1 public evidence renderer")
css_start = s.find('<style id="earthline-16516-evidence-grade-css">')
css_end_marker = '</style>\n<script id="earthline-16516-evidence-grade-js">'
if css_start < 0 or s.count('<style id="earthline-16516-evidence-grade-css">') != 1:
    raise SystemExit("D1 CSS owner marker not found exactly once")
css_end = s.find(css_end_marker, css_start)
if css_end < 0:
    raise SystemExit("D1 CSS end marker not found")
s = s[:css_start] + '<script id="earthline-16516-evidence-grade-js">' + s[css_end + len(css_end_marker):]

# D2 — preserve the 17562 publication gate and 17563 exact-frame clip, but once
# current Property water has visibly published, do not erase it merely because
# a later settle/camera repaint observes a transient readiness=false.
s = replace_exact(
    s,
    '''    const active=propertyActive15824()&&viewAllowsWater15824();
    if(!active){
      svg.style.display="none";
      svg.replaceChildren();
      lastRender={''',
    '''    const active=propertyActive15824()&&viewAllowsWater15824();
    if(!active){
      const retainPublishedPropertyWaterM69=!!(
        state.mode==="property"&&
        svg.childElementCount>0&&
        lastRender&&lastRender.visible===true&&
        Number(lastRender.visiblePaths||0)>0
      );
      if(retainPublishedPropertyWaterM69){
        svg.style.setProperty("display","block","important");
        lastRender=Object.assign({},lastRender,{
          visible:true,
          reason:"retained-current-property-water-m69",
          retainedAt:Date.now()
        });
        M.directWaterRenderer15824=lastRender;
        updateStatus15824();
        return true;
      }
      svg.style.display="none";
      svg.replaceChildren();
      lastRender={''',
    "D2 transient clear owner",
)

# D5 — remove the actual unapproved crosshair movement hint owner, including its
# analysis-complete listener and ultra-high-z-index style. It is the final block.
d5_marker = "/* EARTHLINE_CROSSHAIR_MOVE_HINT_17093"
if launch.count(d5_marker) != 1:
    raise SystemExit(f"D5 owner marker count = {launch.count(d5_marker)}")
d5_start = launch.find(d5_marker)
d5_tail = launch[d5_start:]
if "Place hand cursor over bare land to move map." not in d5_tail:
    raise SystemExit("D5 expected hint text missing from owner block")
if not d5_tail.rstrip().endswith("})();"):
    raise SystemExit("D5 owner is no longer the final launch block; refusing broad removal")
launch = launch[:d5_start].rstrip() + "\n"

# Protected science / behavior anchors.
for marker in (
    "EARTHLINE_FIRST_PROPERTY_WATER_COMMIT_GATE_17562",
    "EARTHLINE_PROPERTY_WATER_FRAME_CLIP_17563",
    "function earthlineFinalizeVectorVerification16343",
    "M.propertyPublication15816",
    "authoritativeSafeSwales15815",
):
    if marker not in s:
        raise SystemExit(f"Protected marker lost: {marker}")

# User-visible regression strings must be absent from their live paths.
for forbidden in (
    "Support — Help & Documentation",
    "Upgrade path to live data",
    'data-act="support"',
):
    if forbidden in s:
        raise SystemExit(f"Forbidden live Support string remains: {forbidden}")
if "earthlineCrosshairMoveHint17093" in launch or "Place hand cursor over bare land to move map." in launch:
    raise SystemExit("D5 crosshair hint owner remains")
if "slot.prepend(el)" in s[s.find('<script id="earthline-16516-evidence-grade-js">'):s.find('</script>', s.find('<script id="earthline-16516-evidence-grade-js">'))]:
    raise SystemExit("D1 public insertion trigger remains")

INDEX.write_text(s, encoding="utf-8")
LAUNCH.write_text(launch, encoding="utf-8")
print("M69 recovery patch applied")
print("index bytes", len(s.encode("utf-8")))
print("launch bytes", len(launch.encode("utf-8")))
