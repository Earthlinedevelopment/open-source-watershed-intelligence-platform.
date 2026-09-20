from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""    let selectionBoundary16539=null;
    if(jurisdictionCapability16539){
      selectionBoundary16539=await jurisdictionBoundaryPromise16539;
      if(!selectionBoundary16539||!selectionBoundary16539.geometry)throw new Error('selected administrative boundary could not be resolved; no uncontained Regional result was published');
    }
    const swaleJurisdictionGeometry16539=selectionBoundary16539&&(selectionBoundary16539.prepared||selectionBoundary16539.geometry)||null;"""

new="""    let selectionBoundary16539=null;
    /* EARTHLINE 16747 — Vermont's official VCGI boundary must constrain
       candidate eligibility before statewide ranking/spacing/capacity, exactly
       as the shared jurisdiction boundary does for every other state. The
       existing final VCGI clip remains the fail-closed publication check. */
    if(vermontRequest&&!focusMode&&typeof window.earthlineEnsureVermontBoundary16178==='function'){
      const geometry16747=await window.earthlineEnsureVermontBoundary16178();
      if(!geometry16747)throw new Error('official Vermont state boundary could not be resolved before corridor selection');
      selectionBoundary16539={geometry:geometry16747,prepared:geometry16747,source:'official VCGI Vermont state boundary',vermontPreselection16747:true};
      window.EARTHLINE_VERMONT_PRESELECTION_BOUNDARY_16747={build:'EARTHLINE 16747',runToken,applied:true,source:'official VCGI Vermont state boundary',rule:'Vermont corridor eligibility precedes ranking, spacing and capacity; final VCGI clip remains publication safety',at:new Date().toISOString()};
    }else if(jurisdictionCapability16539){
      selectionBoundary16539=await jurisdictionBoundaryPromise16539;
      if(!selectionBoundary16539||!selectionBoundary16539.geometry)throw new Error('selected administrative boundary could not be resolved; no uncontained Regional result was published');
    }
    const swaleJurisdictionGeometry16539=selectionBoundary16539&&(selectionBoundary16539.prepared||selectionBoundary16539.geometry)||null;"""

n=s.count(old)
if n!=1: raise SystemExit(f"16747 anchor expected once, found {n}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("16747 applied")
