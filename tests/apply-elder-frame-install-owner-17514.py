from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_early="""    window.EARTHLINE_PROPERTY_DECLARATION_16169={build:BUILD,center:{lng:site.lng,lat:site.lat},acres:20,boundaryPoints:m.analysisBoundaryLngLat.length,selectedCode:selectedCode||null,declaredAt:new Date().toISOString(),route:'window.earthlineGovernedPropertyRun16202'};
    /* EARTHLINE 17503 — retired duplicate early Elder start; terminalPropertyRun is sole lifecycle owner. */
"""
new_early="""    window.EARTHLINE_PROPERTY_DECLARATION_16169={build:BUILD,center:{lng:site.lng,lat:site.lat},acres:20,boundaryPoints:m.analysisBoundaryLngLat.length,selectedCode:selectedCode||null,declaredAt:new Date().toISOString(),route:'window.earthlineGovernedPropertyRun16202'};
    /* EARTHLINE 17514 — the authoritative 20-acre Property frame now exists.
       Start the one Elder Property lifecycle/publication owner here so its already-
       primed exact-target computation can commit without waiting for hydrology
       presentation. Identity validation inside startProperty rejects stale targets. */
    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}
"""
if s.count(old_early)!=1: raise SystemExit(f"early owner anchor count={s.count(old_early)}")
s=s.replace(old_early,new_early,1)

old_terminal="""      /* EARTHLINE 17512 — Property science is verified. Publish the already-primed
         exact-target Elder result now, before optional map/texture finishing.
         startProperty remains the single Elder Property publication owner and
         retains its exact run-identity guard. */
      try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}

"""
new_terminal="""      /* EARTHLINE 17514 — Elder publication already started from the authoritative
         Property frame before the hydrology runner; no second lifecycle owner here. */

"""
if s.count(old_terminal)!=1: raise SystemExit(f"scientific terminal owner anchor count={s.count(old_terminal)}")
s=s.replace(old_terminal,new_terminal,1)

s="<!-- EARTHLINE_ELDER_FRAME_INSTALL_OWNER_17514: one Elder lifecycle owner starts at authoritative 20-acre frame install; stale identity remains fail-closed. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed frame-install Elder lifecycle owner 17514")
