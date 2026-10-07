from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
orig=s

# 1) Property-only restore to accepted 16584 selection limits. Regional remains unchanged.
old="const baseRegionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));"
new="const baseRegionalCapacity16755=focusMode?52:Math.min(120,Math.max(80,coverageGroups16736.size*4));"
assert old in s, "capacity anchor not found"
s=s.replace(old,new,1)

old="const regionalCapacity16755=focusMode?80:baseRegionalCapacity16755+supportExtra16755;"
new="const regionalCapacity16755=focusMode?52:baseRegionalCapacity16755+supportExtra16755;"
assert old in s, "regional capacity anchor not found"
s=s.replace(old,new,1)

old="const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));"
new="const chosen=[],primarySpacing=focusMode?Math.max(6,Math.round(hy.w/31)):Math.max(3,Math.round(hy.w/31));"
assert old in s, "primary spacing anchor not found"
s=s.replace(old,new,1)

old="const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));"
new="const spacing=chosen.length<20?primarySpacing:(focusMode?Math.max(4,Math.round(primarySpacing*.72)):Math.max(2,Math.round(primarySpacing*.72)));"
assert old in s, "secondary spacing anchor not found"
s=s.replace(old,new,1)

# 2) Valid screened-clear evidence must not fall through to red blocked state.
anchor='''    }else if(sourceTier==="open-data"&&acquisitionResult==="features-found"){
      kind="open-data";label="OPEN-DATA SCREENING · FIELD VERIFICATION REQUIRED";
      detail="Available open-data / loaded map-source road and building evidence was applied. Coverage is not authoritative and may be incomplete; field verification is required before any siting decision.";
    }else if(acquisitionResult==="unavailable"){'''
replacement='''    }else if(sourceTier==="open-data"&&acquisitionResult==="features-found"){
      kind="open-data";label="OPEN-DATA SCREENING · FIELD VERIFICATION REQUIRED";
      detail="Available open-data / loaded map-source road and building evidence was applied. Coverage is not authoritative and may be incomplete; field verification is required before any siting decision.";
    }else if(sourceTier==="open-data"&&acquisitionResult==="screened-clear"){
      kind="open-data";label="OPEN-DATA SCREENING · NO MAPPED EXCLUSIONS RETURNED · FIELD VERIFICATION REQUIRED";
      detail="Available open-data / loaded map sources were queried successfully and returned no mapped exclusions in this 20-acre frame. Coverage is not authoritative and may be incomplete; field verification is required before any siting decision.";
    }else if(acquisitionResult==="unavailable"){'''
assert anchor in s, "screened-clear renderer anchor not found"
s=s.replace(anchor,replacement,1)

# 3) One authoritative Regional -> Property handoff identity:
# displayed published Regional run must match the selected corridor parent.
old="""      const parentDisplayed16347=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const parentLive16347=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
      const parentTier16347=String(parentDisplayed16347&&(parentDisplayed16347.tier||parentDisplayed16347.mode)||'').toLowerCase();
      const displayedToken16347=String(parentDisplayed16347&&parentDisplayed16347.runToken||'');
      const liveToken16347=String(parentLive16347&&parentLive16347.runToken||'');
      const targetParentToken16347=String(chosen&&chosen.parentRunToken||'');
      const activePublishedToken16347=String(window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||'');
      const publishedState16347=String(document.documentElement.dataset.earthlineRunState||'')==='published';
      const validParent16347=parentTier16347==='regional'&&!!displayedToken16347&&displayedToken16347===liveToken16347&&displayedToken16347===targetParentToken16347&&displayedToken16347===activePublishedToken16347&&publishedState16347;
      window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347={build:'EARTHLINE 16347',selectedCode,parentTier:parentTier16347,displayedToken:displayedToken16347||null,liveToken:liveToken16347||null,targetParentToken:targetParentToken16347||null,activePublishedToken:activePublishedToken16347||null,publishedState:publishedState16347,validParent:validParent16347,at:new Date().toISOString()};"""
new="""      const parentDisplayed16347=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const parentTier16347=String(parentDisplayed16347&&(parentDisplayed16347.tier||parentDisplayed16347.mode)||'').toLowerCase();
      const displayedToken16347=String(parentDisplayed16347&&parentDisplayed16347.runToken||'');
      const targetParentToken16347=String(chosen&&chosen.parentRunToken||'');
      const publishedState16347=String(document.documentElement.dataset.earthlineRunState||'')==='published';
      const validParent16347=parentTier16347==='regional'&&!!displayedToken16347&&!!targetParentToken16347&&displayedToken16347===targetParentToken16347&&publishedState16347;
      window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347={build:'EARTHLINE 17019',selectedCode,parentTier:parentTier16347,displayedToken:displayedToken16347||null,targetParentToken:targetParentToken16347||null,publishedState:publishedState16347,validParent:validParent16347,rule:'displayed published Regional run is authoritative and must match the selected corridor parent',at:new Date().toISOString()};"""
assert old in s, "handoff guard anchor not found"
s=s.replace(old,new,1)

assert s != orig
p.write_text(s,encoding="utf-8")
print("patched",len(orig),len(s))
