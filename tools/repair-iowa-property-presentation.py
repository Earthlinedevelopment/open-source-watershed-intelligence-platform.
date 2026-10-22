from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")

old1="""  function settlePropertyMapVisibility16260(count,texture,serial){
    if(!(count>0)||texture?.ok)return true;
    if(serial!==runSerial)return false;
    const living=propertyLivingMapVisible16262(count);
    const safe=syncSafePropertyFallback16221('post-terminal-atomic-17670');
    const ok=!!(living.ok||safe?.ok);
    const current=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    setAudit({
      settled:true,result:true,corridors:count,
      renderVerified:ok,renderPending:false,
      renderMode:living.ok?living.mode:(safe?.ok?'authoritative-safe-lines':'presentation-unavailable'),
      mapEvidence:living.ok?living:null,safeFallback:safe||null,texture,
      currentScientificResultPreserved:true,
      mapVerificationSettledAt:new Date().toISOString(),
      settledAt:current.settledAt||new Date().toISOString()
    });"""
new1="""  function settlePropertyMapVisibility16260(count,texture,serial){
    if(!(count>0)||texture?.ok)return true;
    if(serial!==runSerial)return false;
    const living=propertyLivingMapVisible16262(count);
    const safe=syncSafePropertyFallback16221('post-terminal-atomic-17670');
    const ok=!!(living.ok||safe?.ok);
    const current=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    setAudit({
      settled:ok,result:true,corridors:count,
      renderVerified:ok,renderPending:!ok,
      renderMode:living.ok?living.mode:(safe?.ok?'authoritative-safe-lines':'presentation-unavailable'),
      mapEvidence:living.ok?living:null,safeFallback:safe||null,texture,
      currentScientificResultPreserved:true,
      mapVerificationSettledAt:ok?new Date().toISOString():null,
      settledAt:ok?(current.settledAt||new Date().toISOString()):null
    });"""
old2="""  const regionalOverlay16336=document.getElementById('earthlineRegionalVectorOverlay16020');
  if(regionalOverlay16336){
    regionalOverlay16336.style.removeProperty('display');
    regionalOverlay16336.style.removeProperty('visibility');
    regionalOverlay16336.style.removeProperty('opacity');
  }
  return false
}const safeAudit17183=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;if(active&&Number(safeAudit17183?.count||0)>0&&safeAudit17183?.visible!==true)return false;"""
new2="""  const regionalOverlay16336=document.getElementById('earthlineRegionalVectorOverlay16020');
  if(regionalOverlay16336){
    if(active)regionalOverlay16336.style.setProperty('display','none','important');
    else{
      regionalOverlay16336.style.removeProperty('display');
      regionalOverlay16336.style.removeProperty('visibility');
      regionalOverlay16336.style.removeProperty('opacity');
    }
  }
  return false
}const safeAudit17183=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;if(active&&Number(safeAudit17183?.count||0)>0&&safeAudit17183?.visible!==true){const regionalOverlay17183=document.getElementById('earthlineRegionalVectorOverlay16020');if(regionalOverlay17183)regionalOverlay17183.style.setProperty('display','none','important');return false;}"""

for old,new,label in [(old1,new1,"settlement"),(old2,new2,"regional-overlay")]:
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{label} target count {n}, expected 1")
    s=s.replace(old,new,1)

p.write_text(s)
print("EARTHLINE_IOWA_PRESENTATION_REPAIR_OK")
