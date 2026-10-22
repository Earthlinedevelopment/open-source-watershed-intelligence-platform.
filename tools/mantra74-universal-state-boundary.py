from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s

def must_replace(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f"{label}: expected 1 occurrence, found {n}")
    s=s.replace(old,new,1)

def replace_range(start_marker,end_marker,new_middle,label):
    global s
    a=s.find(start_marker)
    b=s.find(end_marker,a+len(start_marker))
    if a<0 or b<0:
        raise RuntimeError(f"{label}: markers missing")
    s=s[:a]+new_middle+s[b:]

must_replace(
"""    const vermontRequest=typeof window.earthlineIsVermontRequest16178==='function'&&window.earthlineIsVermontRequest16178(q,loc);
    const jurisdictionCapability16539=!focusMode&&!vermontRequest?earthlineAdministrativeCapability16539(loc):null;""",
"""    /* EARTHLINE 17690 — universal jurisdiction path.
       Location selects available boundary evidence; it does not select a different engine. */
    const jurisdictionCapability16539=!focusMode?earthlineAdministrativeCapability16539(loc):null;""",
"universal jurisdiction capability"
)

replace_range(
"    let selectionBoundary16539=null;",
"    const swaleJurisdictionGeometry16539=",
"""    let selectionBoundary16539=null;
    if(jurisdictionCapability16539){
      selectionBoundary16539=await jurisdictionBoundaryPromise16539;
      if(!selectionBoundary16539||!selectionBoundary16539.geometry)
        throw new Error('selected administrative boundary could not be resolved; no uncontained Regional result was published');
    }
""",
"universal selection boundary"
)

replace_range(
"      let previewSwales16249=swales;",
"      if(previewSwales16249&&isCurrentRun(runToken)){",
"""      let previewSwales16249=swales;
      if(jurisdictionCapability16539){
        try{
          const boundary16249=selectionBoundary16539||await jurisdictionBoundaryPromise16539;
          const empty16249={type:'FeatureCollection',features:[]};
          const clipped16249=await earthlineClipRegionalProducts16539(
            {contours:empty16249,flows:empty16249,swales,query:q,runToken},
            boundary16249
          );
          previewSwales16249=clipped16249.swales;
        }catch(_){previewSwales16249=null;}
      }
""",
"universal preview clipping"
)

must_replace(
"vermontClipped:!!vermontRequest,previewMs:",
"jurisdictionClipped:!!jurisdictionCapability16539,previewMs:",
"preview audit"
)

replace_range(
"    let genericBoundaryAudit16539=null;",
"    if(focusMode){for(const f of swales.features||[]){",
"""    let genericBoundaryAudit16539=null;
    if(jurisdictionCapability16539){
      setBusy(true,'VERIFYING JURISDICTION CONTAINMENT');
      const boundary16539=selectionBoundary16539||await jurisdictionBoundaryPromise16539;
      if(!boundary16539||!boundary16539.geometry)
        throw new Error('selected administrative boundary could not be resolved; no uncontained Regional result was published');
      const bounded16539=await earthlineClipRegionalProducts16539(
        {contours,flows,swales,query:q,runToken},
        boundary16539
      );
      contours=bounded16539.contours;
      flows=bounded16539.flows;
      swales=bounded16539.swales;
      genericBoundaryAudit16539=bounded16539.audit;
      window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539=
        JSON.parse(JSON.stringify(genericBoundaryAudit16539));
    }
""",
"universal final clipping"
)

must_replace(
"""    const preBoundaryAudit16329=window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178||null;
    const preBoundaryExplainsZero16329=!!(
      (vermontRequest&&preBoundaryAudit16329&&Number(preBoundaryAudit16329.before&&preBoundaryAudit16329.before.swales||0)>0&&Number(preBoundaryAudit16329.after&&preBoundaryAudit16329.after.swales||0)===0)||
      (genericBoundaryAudit16539&&Number(genericBoundaryAudit16539.before&&genericBoundaryAudit16539.before.swales||0)>0&&Number(genericBoundaryAudit16539.after&&genericBoundaryAudit16539.after.swales||0)===0)
    );""",
"""    const preBoundaryExplainsZero16329=!!(
      genericBoundaryAudit16539&&
      Number(genericBoundaryAudit16539.before&&genericBoundaryAudit16539.before.swales||0)>0&&
      Number(genericBoundaryAudit16539.after&&genericBoundaryAudit16539.after.swales||0)===0
    );""",
"universal preflight audit"
)

must_replace(
"""    const vermontBoundaryAudit16178=window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178||null;
    const boundaryExplainsZero16178=!!(
      (vermontRequest&&vermontBoundaryAudit16178&&Number(vermontBoundaryAudit16178.before&&vermontBoundaryAudit16178.before.swales||0)>0&&Number(vermontBoundaryAudit16178.after&&vermontBoundaryAudit16178.after.swales||0)===0)||
      (genericBoundaryAudit16539&&Number(genericBoundaryAudit16539.before&&genericBoundaryAudit16539.before.swales||0)>0&&Number(genericBoundaryAudit16539.after&&genericBoundaryAudit16539.after.swales||0)===0)
    );""",
"""    const boundaryExplainsZero16178=!!(
      genericBoundaryAudit16539&&
      Number(genericBoundaryAudit16539.before&&genericBoundaryAudit16539.before.swales||0)>0&&
      Number(genericBoundaryAudit16539.after&&genericBoundaryAudit16539.after.swales||0)===0
    );""",
"universal publication audit"
)

must_replace(
"""      stateBoundary:vermontRequest?JSON.parse(JSON.stringify(window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178||null)):null,
      jurisdictionBoundary:genericBoundaryAudit16539?JSON.parse(JSON.stringify(genericBoundaryAudit16539)):null,""",
"""      stateBoundary:genericBoundaryAudit16539?JSON.parse(JSON.stringify(genericBoundaryAudit16539)):null,
      jurisdictionBoundary:genericBoundaryAudit16539?JSON.parse(JSON.stringify(genericBoundaryAudit16539)):null,""",
"report boundary audit"
)

if "vermontRequest" in s:
    raise RuntimeError("vermontRequest remains")
if "earthlineClipVermontProducts16178({contours" in s:
    raise RuntimeError("legacy Vermont Regional clip call remains")
if "const jurisdictionCapability16539=!focusMode?earthlineAdministrativeCapability16539(loc):null;" not in s:
    raise RuntimeError("shared state capability missing")
if "EARTHLINE 17690 — universal jurisdiction path" not in s:
    raise RuntimeError("universal marker missing")

p.write_text(s,encoding="utf-8")
print("EARTHLINE_17690_UNIVERSAL_STATE_BOUNDARY",len(before),len(s),len(before)-len(s))

# trigger
