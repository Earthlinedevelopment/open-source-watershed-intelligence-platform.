from pathlib import Path

p=Path("index.html")
s=p.read_text(errors="strict")

def replace_one(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{label}: expected 1 target, found {n}")
    s=s.replace(old,new,1)
    print("PATCH",label,"OK")

# A. Regional: recover low-relief gaps from the statewide DEM already in memory.
replace_one(
"""const gaps16839=rows16839.filter(r16839=>r16839.valid>=4&&r16839.opp>=3&&(r16839.opp/Math.max(1,r16839.valid))>=.45&&r16839.swales===0),groups16839=new Map();""",
"""const gaps16839=rows16839.filter(r16839=>r16839.valid>=4&&r16839.opp>=2&&((r16839.opp/Math.max(1,r16839.valid))>=.18||r16839.pref>=2)&&r16839.swales===0),groups16839=new Map();""",
"statewide-low-relief-gap-recovery"
)

# B. Property: same contour band is not an exemption from the minimum spacing rule.
replace_one(
"""        if(sw.bandKey===ex.bandKey)continue;
""",
"""        /* EARTHLINE 17710 — same-band corridors still obey the same physical minimum-spacing rule. */
""",
"same-band-spacing"
)

# C. Planting/trees: use current lifecycle owner, never a startup-captured Regional object.
script_start=s.find('<script id="earthline-build-15806-safety-vetted-natural-swales">')
script_end=s.find('</script>',script_start)
if script_start<0 or script_end<0:
    raise SystemExit("planting script not found")
seg=s[script_start:script_end]

old="""  const state=window.earthlineRegional15778||{};
  let plantingVisible=true;"""
new="""  const state=window.earthlineRegional15778||{};
  const currentState15806=()=>window.earthlineRegional15778||window.earthlineRegional15761||state||{};
  let plantingVisible=true;"""
if seg.count(old)!=1: raise SystemExit(f"planting getter target {seg.count(old)}")
seg=seg.replace(old,new,1)

old="""        M&&M.analysisReady&&state.mode==="property"&&!state.active&&
        typeof window.earthlineApplyRendererOwnership15805==="function" """
new="""        M&&M.analysisReady&&currentState15806().mode==="property"&&!currentState15806().active&&
        typeof window.earthlineApplyRendererOwnership15805==="function" """
if seg.count(old)!=1: raise SystemExit(f"planting owner target {seg.count(old)}")
seg=seg.replace(old,new,1)

old="""    setPlantingVisible15806(plantingVisible&&data.features.length>0);
    M.naturalSwalePlanting15806={features:data.features.length,visible:plantingVisible,source:PLANT_SOURCE};"""
new="""    const liveState15806=currentState15806();
    const propertyOwnsPlanting15806=!!(M&&M.analysisReady&&liveState15806.mode==="property"&&!liveState15806.active);
    setPlantingVisible15806(propertyOwnsPlanting15806&&data.features.length>0);
    M.naturalSwalePlanting15806={features:data.features.length,visible:plantingVisible,source:PLANT_SOURCE};"""
if seg.count(old)!=1: raise SystemExit(f"planting sync target {seg.count(old)}")
seg=seg.replace(old,new,1)

old="""          const propertyOwnsPlanting=state.mode==="property"&&!state.active&&!!(M&&M.analysisReady&&M.layers&&M.layers.swales&&M.layers.swales.on);
          setPlantingVisible15806(propertyOwnsPlanting);"""
new="""          const liveState15806=currentState15806();
          const propertyOwnsPlanting=liveState15806.mode==="property"&&!liveState15806.active&&!!(M&&M.analysisReady&&M.layers&&M.layers.swales&&M.layers.swales.on);
          setPlantingVisible15806(propertyOwnsPlanting);"""
if seg.count(old)!=1: raise SystemExit(f"planting style target {seg.count(old)}")
seg=seg.replace(old,new,1)

s=s[:script_start]+seg+s[script_end:]
p.write_text(s)
print("EARTHLINE_M75_LIVE_ENGINE_CORE_PATCH_OK")
