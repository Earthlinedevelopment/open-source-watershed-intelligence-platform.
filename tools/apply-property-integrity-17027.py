from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name,old,new):
    global s
    n=s.count(old)
    print(name,"anchors",n)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

patch(
    "property-primary-spacing",
    "const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));",
    "const chosen=[],primarySpacing=focusMode?Math.max(6,Math.round(hy.w/31)):Math.max(3,Math.round(hy.w/31));"
)
patch(
    "property-capacity-base",
    "const baseRegionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));",
    "const baseRegionalCapacity16755=focusMode?52:Math.min(120,Math.max(80,coverageGroups16736.size*4));"
)
patch(
    "property-capacity-final",
    "const regionalCapacity16755=focusMode?80:baseRegionalCapacity16755+supportExtra16755;",
    "const regionalCapacity16755=focusMode?52:baseRegionalCapacity16755+supportExtra16755;"
)
patch(
    "property-spacing-floor",
    "const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));",
    "const spacing=chosen.length<20?primarySpacing:(focusMode?Math.max(4,Math.round(primarySpacing*.72)):Math.max(2,Math.round(primarySpacing*.72)));"
)

old_evidence='''    }else if(sourceTier==="open-data"&&acquisitionResult==="features-found"){
      kind="open-data";label="OPEN-DATA SCREENING · FIELD VERIFICATION REQUIRED";
      detail="Available open-data / loaded map-source road and building evidence was applied. Coverage is not authoritative and may be incomplete; field verification is required before any siting decision.";
    }else if(acquisitionResult==="unavailable"){'''
new_evidence='''    }else if(sourceTier==="open-data"&&acquisitionResult==="features-found"){
      kind="open-data";label="OPEN-DATA SCREENING · FIELD VERIFICATION REQUIRED";
      detail="Available open-data / loaded map-source road and building evidence was applied. Coverage is not authoritative and may be incomplete; field verification is required before any siting decision.";
    }else if(sourceTier==="open-data"&&acquisitionResult==="screened-clear"){
      kind="open-data";label="OPEN-DATA SCREENING · NO MAPPED EXCLUSIONS RETURNED · FIELD VERIFICATION REQUIRED";
      detail="Open-data / loaded map-source queries completed and returned no mapped road, building, parking, or water exclusions in this 20-acre frame. This is screened-clear, not authoritative-clear; field verification remains required before any siting decision.";
    }else if(acquisitionResult==="unavailable"){'''
patch("screened-clear-evidence",old_evidence,new_evidence)

old_handoff='''      const parentDisplayed16347=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const parentLive16347=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
      const parentTier16347=String(parentDisplayed16347&&(parentDisplayed16347.tier||parentDisplayed16347.mode)||'').toLowerCase();
      const displayedToken16347=String(parentDisplayed16347&&parentDisplayed16347.runToken||'');
      const liveToken16347=String(parentLive16347&&parentLive16347.runToken||'');
      const targetParentToken16347=String(chosen&&chosen.parentRunToken||'');
      const activePublishedToken16347=String(window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||'');
      const publishedState16347=String(document.documentElement.dataset.earthlineRunState||'')==='published';
      const validParent16347=parentTier16347==='regional'&&!!displayedToken16347&&displayedToken16347===liveToken16347&&displayedToken16347===targetParentToken16347&&displayedToken16347===activePublishedToken16347&&publishedState16347;
      window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347={build:'EARTHLINE 16347',selectedCode,parentTier:parentTier16347,displayedToken:displayedToken16347||null,liveToken:liveToken16347||null,targetParentToken:targetParentToken16347||null,activePublishedToken:activePublishedToken16347||null,publishedState:publishedState16347,validParent:validParent16347,at:new Date().toISOString()};'''
new_handoff='''      const parentDisplayed16347=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const parentTier16347=String(parentDisplayed16347&&(parentDisplayed16347.tier||parentDisplayed16347.mode)||'').toLowerCase();
      const displayedToken16347=String(parentDisplayed16347&&parentDisplayed16347.runToken||'');
      const targetParentToken16347=String(chosen&&chosen.parentRunToken||'');
      const publication16347=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const publicationToken16347=String(publication16347&&publication16347.runToken||'');
      const publicationGenerated16347=Number(publication16347&&publication16347.generated||0);
      const runState16347=String(document.documentElement.dataset.earthlineRunState||'').toLowerCase();
      const noNewRegionalRun16347=runState16347!=='running'&&runState16347!=='failed';
      const validParent16347=parentTier16347==='regional'&&!!displayedToken16347&&displayedToken16347===targetParentToken16347&&displayedToken16347===publicationToken16347&&publicationGenerated16347>0&&noNewRegionalRun16347;
      window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347={build:'EARTHLINE 17027',selectedCode,parentTier:parentTier16347,displayedToken:displayedToken16347||null,targetParentToken:targetParentToken16347||null,publicationToken:publicationToken16347||null,publicationGenerated:publicationGenerated16347,runState:runState16347||null,noNewRegionalRun:noNewRegionalRun16347,validParent:validParent16347,at:new Date().toISOString()};'''
patch("regional-property-publication-identity",old_handoff,new_handoff)

p.write_text(s,encoding="utf-8")

checks={
    "property_cap_52": "baseRegionalCapacity16755=focusMode?52:" in s and "regionalCapacity16755=focusMode?52:" in s,
    "property_spacing_6": "primarySpacing=focusMode?Math.max(6,Math.round(hy.w/31))" in s,
    "property_floor_4": "focusMode?Math.max(4,Math.round(primarySpacing*.72))" in s,
    "regional_spacing_preserved": ":Math.max(3,Math.round(hy.w/31))" in s and ":Math.max(2,Math.round(primarySpacing*.72))" in s,
    "screened_clear_case": 'acquisitionResult==="screened-clear"' in s and "This is screened-clear, not authoritative-clear" in s,
    "publication_identity": "publicationToken16347" in s and "EARTHLINE 17027" in s,
    "old_five_token_gate_removed": "displayedToken16347===liveToken16347&&displayedToken16347===targetParentToken16347&&displayedToken16347===activePublishedToken16347" not in s,
}
print(checks)
if not all(checks.values()):
    raise SystemExit("static assertions failed")
