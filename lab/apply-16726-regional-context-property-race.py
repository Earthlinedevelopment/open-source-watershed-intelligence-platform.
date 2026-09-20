from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""        window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970=enriched16198;
        publishDisplayedRun16151(enriched16198);
        try{
          if(typeof window.earthlineReconcilePanel16188==='function')
            window.earthlineReconcilePanel16188();
        }catch(_){}
        window.EARTHLINE_REGIONAL_CONTEXT_16198={build:'EARTHLINE 16198',runToken,elapsedMs:Math.round(performance.now()-contextStarted16198),basinCount:basinCount16198,aquiferCount:aquiferCount16198,groundwaterReady:groundwaterReady16198,graceReady:graceReady16198,failures:failures16198,at:new Date().toISOString()};
        recordRun('context_enriched',runToken,window.EARTHLINE_REGIONAL_CONTEXT_16198);
        setRunStatus((focusMode?'Focus screening published. ':(isVermont?'Vermont screening published. ':'Regional screening published. '))+(failures16198.length?'Unavailable context: '+failures16198.join(', ')+'. ':'Watershed and groundwater context updated. ')+swaleNote+(!focusMode?earthlineLandValidityStatus16584():''),'published');"""

new="""        window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970=enriched16198;
        /* EARTHLINE 16726 — optional Regional context may finish after a user has
           already entered Property. It can update the cached Regional report, but it
           must never reclaim canonical display/status ownership from that Property. */
        const displayed16726=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
        const displayedTier16726=String(displayed16726&&(displayed16726.tier||displayed16726.mode)||'').toLowerCase();
        const propertyTarget16726=window.EARTHLINE_PROPERTY_TARGET_16201||null;
        const propertyPublication16726=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
        const propertyRun16726=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
        const propertyOwnsDisplay16726=(
          displayedTier16726==='property'||
          String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase()==='property'||
          (
            propertyPublication16726&&propertyPublication16726.published===true&&
            propertyRun16726&&propertyRun16726.settled===true&&propertyRun16726.result===true&&
            String(propertyTarget16726&&propertyTarget16726.parentRunToken||'')===String(runToken)
          )
        );
        if(!propertyOwnsDisplay16726){
          publishDisplayedRun16151(enriched16198);
          try{
            if(typeof window.earthlineReconcilePanel16188==='function')
              window.earthlineReconcilePanel16188();
          }catch(_){}
        }
        window.EARTHLINE_REGIONAL_CONTEXT_16198={build:'EARTHLINE 16726',runToken,elapsedMs:Math.round(performance.now()-contextStarted16198),basinCount:basinCount16198,aquiferCount:aquiferCount16198,groundwaterReady:groundwaterReady16198,graceReady:graceReady16198,failures:failures16198,displaySuppressedForProperty:propertyOwnsDisplay16726,at:new Date().toISOString()};
        recordRun(propertyOwnsDisplay16726?'context_enriched_cached_property_preserved':'context_enriched',runToken,window.EARTHLINE_REGIONAL_CONTEXT_16198);
        if(!propertyOwnsDisplay16726)setRunStatus((focusMode?'Focus screening published. ':(isVermont?'Vermont screening published. ':'Regional screening published. '))+(failures16198.length?'Unavailable context: '+failures16198.join(', ')+'. ':'Watershed and groundwater context updated. ')+swaleNote+(!focusMode?earthlineLandValidityStatus16584():''),'published');"""

n=s.count(old)
if n!=1: raise SystemExit(f"16726 anchor expected once, found {n}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("16726 applied: late Regional context cannot reclaim display/status from published Property")
