#!/usr/bin/env python3
"""Mantra XXX isolated, presentation-only recovery patch for October 5 rollback."""
from pathlib import Path
import hashlib
p=Path("index.html")
source=p.read_text(encoding="utf-8")
before=source
def change(old,new,label):
    global source
    n=source.count(old)
    assert n==1, f"REFUSE {label}: expected one exact source, found {n}"
    source=source.replace(old,new,1)
    print("PATCH:",label)

# Preserve all analytical geometry, hydrography, ranking and exclusion engines.
change("if(activeTier==='focus'?(pts.length<3||len<22):(pts.length<2||len<0.1))continue;",
       "if(activeTier==='focus'?(pts.length<3||len<22):(pts.length<2||len<22))continue;",
       "regional screen-space minimum 22px (presentation only)")
change("el.replaceChildren();\n    const defs=svgEl('defs');",
       "el.replaceChildren();\n    /* MXXX: use the existing renderer as sole zoom-gated corridor presentation owner. */\n    document.documentElement.dataset.earthlineCorridorScaleMxxx=activeTier16168()==='focus'?'focus':(Number(map.getZoom())<9?'overview':'detail');\n    const defs=svgEl('defs');",
       "existing-renderer zoom classification")
# MXXX: the 16168 map-only owner used to repaint focus swales on every idle, rotate,
# pitch, move and zoom in addition to 16020's coalesced publication renderer.
change("if(tier()==='focus')refreshRender()})",
       "/* MXXX: overlay rendering is already owned by the 16020 move/zoom-end scheduler. */})",
       "remove competing focus lifecycle redraw")
change("setTimeout(()=>{restoreControls();restoreGrab();refreshRender()},0);",
       "setTimeout(()=>{restoreControls();restoreGrab()},0);",
       "remove redundant immediate focus redraw")
change("setTimeout(()=>{restoreControls();restoreGrab();refreshRender()},800);",
       "setTimeout(()=>{restoreControls();restoreGrab()},800);",
       "remove redundant delayed focus redraw")
# The gauge is a 0–100 score, not measured percentage.
change("value.textContent=q==null?'—%':q+'%';",
       "value.textContent=q==null?'—':String(q);",
       "correct numeric score display")
change("'Recharge Potential '+q+' percent'",
       "'Recharge Suitability '+q+' out of 100'",
       "correct score accessibility")
change('<div class="earthline-recharge-gauge-label-16488">Recharge Potential</div>',
       '<div class="earthline-recharge-gauge-label-16488">Recharge Suitability</div>',
       "correct score caption")
change('aria-label="Recharge Potential not yet calculated"',
       'aria-label="Recharge Suitability not yet calculated"',
       "correct score placeholder")

css = """
<!-- Mantra XXX candidate: wide-area corridor visual gate. Scientific data unchanged. -->
<style id="earthline-mantra-xxx-regional-clarity">
/* Wide-area region view: keep A/B opportunity labels, flow paths, and elevation;
   show physical corridor line work only at usable site-scale zoom. */
html[data-earthline-corridor-scale-mxxx="overview"] #earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] > path {visibility:hidden!important}
/* Site-level Regional view: narrow outlines, subdued A/B/C colors, zero glow. */
html[data-earthline-corridor-scale-mxxx="detail"] #earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] > path[stroke="rgba(8,18,13,.96)"]{stroke-width:7px!important;opacity:.70!important;filter:none!important}
html[data-earthline-corridor-scale-mxxx="detail"] #earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] > path[stroke="#42ff83"]{stroke-width:4.8px!important;opacity:.90!important;filter:none!important}
html[data-earthline-corridor-scale-mxxx="detail"] #earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] > path[stroke="#ffc12f"]{stroke-width:4.3px!important;opacity:.88!important;filter:none!important}
html[data-earthline-corridor-scale-mxxx="detail"] #earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] > path[stroke="#ff8a2d"]{stroke-width:3.6px!important;opacity:.82!important;filter:none!important}
html[data-earthline-corridor-scale-mxxx="detail"] #earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] > path[stroke="#e1ffeb"],
html[data-earthline-corridor-scale-mxxx="detail"] #earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] > path[stroke="#fff2b0"],
html[data-earthline-corridor-scale-mxxx="detail"] #earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] > path[stroke="#ffe0bd"]{stroke-width:.8px!important;opacity:.7!important;filter:none!important}
</style>
"""
assert css not in source and "id=\"earthline-mantra-xxx-regional-clarity\"" not in source
source += css
assert all(x in source for x in [
    "Slow it. Sink it. Spread it.",
    "Bioswale Impact Report", "How Bioswales Work",
    "earthlineOpenVermontReport16151", "earthlineMap",
    "window.earthlineDecorateSwales16149", "earthlineRenderRegionalOverlay16020",
    "groundwater", "exclusion"])
# Unapproved front-page copy intentionally NOT published or included in this candidate.
# No changes to Mapbox search token or routing.
p.write_text(source, encoding="utf-8")
print("BASE SHA256:", hashlib.sha256(before.encode()).hexdigest())
print("OUTPUT SHA256:", hashlib.sha256(source.encode()).hexdigest())
print("CHANGED BYTES:", len(source)-len(before))
