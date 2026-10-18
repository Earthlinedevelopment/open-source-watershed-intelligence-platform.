from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

# Publish Elder at the verified Property scientific terminal. The dynamic exact-target
# compute is already primed at accepted click in 17509; startProperty reuses that keyed
# result/promise and performs the one guarded publication.
old="""      setAudit({scientificSettled:true,scientificResult:true,corridors:count,scientificSettledAt:new Date().toISOString()});
      earthlinePropertyTrace16319("scientific terminal","mark",{corridors:count});

      /* EARTHLINE 16334 — verified science is the interactive terminal. Optional"""
new="""      setAudit({scientificSettled:true,scientificResult:true,corridors:count,scientificSettledAt:new Date().toISOString()});
      earthlinePropertyTrace16319("scientific terminal","mark",{corridors:count});
      /* EARTHLINE 17512 — Property science is verified. Publish the already-primed
         exact-target Elder result now, before optional map/texture finishing.
         startProperty remains the single Elder Property publication owner and
         retains its exact run-identity guard. */
      try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}

      /* EARTHLINE 16334 — verified science is the interactive terminal. Optional"""
if s.count(old)!=1: raise SystemExit(f"scientific terminal anchor count={s.count(old)}")
s=s.replace(old,new,1)

# Retire the two later terminal refresh publications. They are now dead-wait duplicates.
old_pending="""        try{window.EARTHLINE_ELDER_TREES_V1_17097?.refresh?.()}catch(_){} /* EARTHLINE_CANONICAL_PROPERTY_ELDER_REFRESH_17153 */
        return true;"""
new_pending="""        /* EARTHLINE 17512 — Elder already published at verified scientific terminal. */
        return true;"""
if s.count(old_pending)!=1: raise SystemExit(f"pending refresh anchor count={s.count(old_pending)}")
s=s.replace(old_pending,new_pending,1)

old_final="""      setAudit({stage:'published',stageLabel:'published',settled:true,result:true,timedOut:false,corridors:count,renderVerified,renderMode:texture.ok?'natural-texture':(safeFallback.ok?'authoritative-safe-lines':'verified-zero'),sourceEvidence:propertyEvidenceSnapshot16206(),publicationAudit:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,safeFallback,texture,stageTimings:Object.assign({},m.lastTiming||{}),elapsedSeconds:Math.round((performance.now()-started)/1000),settledAt:new Date().toISOString()});try{window.EARTHLINE_ELDER_TREES_V1_17097?.refresh?.()}catch(_){} /* EARTHLINE_CANONICAL_PROPERTY_ELDER_REFRESH_17153 */return true;"""
new_final="""      setAudit({stage:'published',stageLabel:'published',settled:true,result:true,timedOut:false,corridors:count,renderVerified,renderMode:texture.ok?'natural-texture':(safeFallback.ok?'authoritative-safe-lines':'verified-zero'),sourceEvidence:propertyEvidenceSnapshot16206(),publicationAudit:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,safeFallback,texture,stageTimings:Object.assign({},m.lastTiming||{}),elapsedSeconds:Math.round((performance.now()-started)/1000),settledAt:new Date().toISOString()});/* EARTHLINE 17512 — Elder already published at verified scientific terminal. */return true;"""
if s.count(old_final)!=1: raise SystemExit(f"final refresh anchor count={s.count(old_final)}")
s=s.replace(old_final,new_final,1)

s="<!-- EARTHLINE_ELDER_SCIENTIFIC_TERMINAL_PUBLISH_17512: exact-target compute primes on press; single Elder publication occurs at verified Property science terminal. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed Elder scientific-terminal publisher 17512")
