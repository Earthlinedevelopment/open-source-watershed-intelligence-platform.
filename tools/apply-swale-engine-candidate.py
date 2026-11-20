#!/usr/bin/env python3
"""Builds the swale-engine candidate index.html from the LIVE page b71c5b2 (index.html sha256 4bad128f...4322).
Usage: python3 tools/apply-swale-engine-candidate.py <path-to-b71c5b2-index.html> <output-index.html>
Five anchored insertions, each asserted to match exactly once. Nothing else in the page changes."""
import hashlib, sys, os, re
src, dst = sys.argv[1], sys.argv[2]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_SHA = '4bad128f0e1342c222cc2d25e05e0527d086280f4ca8cd24b0597ae0f37e4322'
s = open(src, encoding='utf-8').read()
got = hashlib.sha256(s.encode('utf-8')).hexdigest()
if got != BASE_SHA:
    sys.exit('BASE MISMATCH: %s != %s (start from index.html at b71c5b2)' % (got, BASE_SHA))
def sha8(p): return hashlib.sha256(open(os.path.join(root, p), 'rb').read()).hexdigest()[:8]
adapter = open(os.path.join(root, 'tools/adapter-16600.js'), encoding='utf-8').read()
lock = open(os.path.join(root, 'tools/lock-16600.js'), encoding='utf-8').read()
def once(a, b):
    global s
    n = s.count(a)
    if n != 1: sys.exit('ANCHOR COUNT %d (need 1): %s' % (n, a[:80]))
    s = s.replace(a, b)

# 1. load the engine and the bridge right after Mapbox GL (synchronous, so they exist before any Property run)
a1 = '<script crossorigin="anonymous" src="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"></script>'
once(a1, a1 + '\n<script src="earthline-property-swales.js?v=' + sha8('earthline-property-swales.js') + '"></script>'
          '\n<script src="earthline-property-swale-bridge.js?v=' + sha8('earthline-property-swale-bridge.js') + '"></script>')

# 2. connection code, placed immediately before the prescriber so it shares its scope
a2 = '  async function prescribeSwales15778(myGen=M.searchGen){'
once(a2, adapter + '\n' + a2)

# 3. the branch: Property runs use the clean engine; Regional tiles keep the existing path untouched
a3 = '    // BUILD-CHECK-15769 — deterministic performance budget.'
once(a3, '''    /* EARTHLINE 16600 — single connection point. Property: clean swale engine (R1-R13). Regional tiles: unchanged path below. */
    {
      const regionalTile16600=!!(M.loc&&(/Regional Opportunity Tile/i.test(String(M.loc.name||""))||(Array.isArray(M.loc.zones)&&M.loc.zones.includes("Regional Tile"))));
      if(!regionalTile16600)return await earthlineRunCleanSwaleEngine16600(myGen,started);
    }

''' + a3)

# 4. replace the layered Property lock for engine results (the original lock stays for anything else)
a4 = '  function earthlineLockPropertyResult15815(force=false){\n'
once(a4, lock + a4 + '''    {
      const eng16600=M&&M.propertySwaleEngine16600||null;
      if(eng16600&&eng16600.verified===true&&Number(eng16600.searchGen)===Number(M.searchGen))return earthlineCommitEngineLock16600(eng16600);
    }
''')
# 5. display: the published engine result is drawn as published. The layered display vetoes (on-screen layer queries and
#    queryRenderedFeatures regex checks) wrap earthlineSwaleGeoJSON() three deep; for a verified engine result they are bypassed,
#    for everything else (Regional, unverified runs) the existing chain is unchanged.
a5 = 'earthlineSwaleGeoJSON=function(){return filter(base()||{type:"FeatureCollection",features:[]});};'
once(a5, '''earthlineSwaleGeoJSON=function(){
      /* EARTHLINE 16600 — a verified clean-engine result is returned exactly as published (no display clipping against on-screen layers). */
      try{
        const eng16600=M&&M.propertySwaleEngine16600;
        if(eng16600&&eng16600.verified===true&&Number(eng16600.searchGen)===Number(M.searchGen)&&
           M.propertyResultLock15815&&M.propertyResultLock15815.safetyVerified===true&&
           M.authoritativeSafeSwales15815&&Array.isArray(M.authoritativeSafeSwales15815.features))return M.authoritativeSafeSwales15815;
      }catch(_){}
      return filter(base()||{type:"FeatureCollection",features:[]});
    };''')
# 6. The old dashboard installs globe-reset callbacks on map load, style.load,
#    and delayed timers (100, 500, 1400 ms). A search can move the map before
#    these callbacks fire; do not ever reset an already navigated Property map.
#    Preserve the original idle startup globe exactly once. No swale science edits.
a6 = 'function initRealGlobe16233(){const m=panelMap16188();if(!m)return false;'
b6 = '''let earthlineStartupGlobeSettled16601=false;
  function initRealGlobe16233(){
    const m=panelMap16188();
    if(!m||earthlineStartupGlobeSettled16601)return false;
    // All callbacks share one owner, even when a late search means startup is skipped.
    earthlineStartupGlobeSettled16601=true;
    let moved=false;
    try{
      const c=m.getCenter?.(),z=Number(m.getZoom?.());
      if(c&&Number.isFinite(Number(c.lng))&&Number.isFinite(Number(c.lat))){
        const lng=Number(c.lng),lat=Number(c.lat);
        const initial=Math.abs(lng+102)<2&&Math.abs(lat-20)<2;
        const alreadyGlobe=Math.abs(lng)<2&&Math.abs(lat-18)<2;
        moved=!initial&&!alreadyGlobe;
      }
      if(Number.isFinite(z)&&z>3.4)moved=true;
    }catch(_){}
    const searchActive=!!(
      (M&&Number(M.searchGen||0)>0)||
      String((document.getElementById("searchInput")||{}).value||"").trim()||
      window.EARTHLINE_PROPERTY_TARGET_16201||
      (document.documentElement.dataset.earthlineAnalysisTier==="property")||
      moved
    );
    if(searchActive)return false;'''
once(a6,b6)

# 7. Existing Status / report owner must use the SAME run-scoped acquisition
#    evidence that the candidate engine used, not the old on-screen vector query.
#    This replaces the evidence() owner; it does not append another status UI.
a7 = '''  function evidence(){
    const m=model(),c=m&&m.vectorNoBuildCoverage||null;if(!c)return null;'''
b7 = '''  function evidence(){
    const m=model(),eng=m&&m.propertySwaleEngine16600||null;
    if(eng&&Number(eng.searchGen)===Number(m.searchGen)){
      const a=eng.acquisition||{};
      const sourceTier=String(a.sourceTier||"");
      const acquisitionResult=String(a.status||"failed");
      const valid=eng.verified===true&&
        (sourceTier==="authoritative-local"||sourceTier==="open-data")&&
        (acquisitionResult==="features-found"||acquisitionResult==="screened-clear"||acquisitionResult==="clear");
      if(!valid)return Object.freeze({
        build:BUILD,sourceTier,acquisitionResult:"failed",kind:"failed",
        label:"EXCLUSION DATA QUERY FAILED · OUTPUT BLOCKED",
        detail:"The clean Property engine could not complete its required road, building and water check: "+String(eng.code||"unverified")+". No verified swales may publish.",
        exclusionVerified:false,publicationAllowed:false,sourceFeatureCount:0,processedFeatureCount:0
      });
      const authoritative=sourceTier==="authoritative-local"&&a.vermontVerified===true;
      const kind=authoritative?"authoritative":"open-data";
      const label=authoritative?"AUTHORITATIVE LOCAL DATA":
        (acquisitionResult==="screened-clear"?"OPEN-DATA SCREENING · NO MAPPED EXCLUSIONS RETURNED · FIELD VERIFICATION REQUIRED":
        "OPEN-DATA SCREENING · FIELD VERIFICATION REQUIRED");
      const detail=authoritative
        ?"Authoritative Vermont E911 / VCGI road, driveway and building evidence was applied to this Property prescription."
        :(acquisitionResult==="screened-clear"
          ?"Road, building and water sources were queried successfully, but no mapped exclusions were found. Coverage may be incomplete; field verification is required before siting."
          :"Available road, building and water geometry was applied to the clean engine's verified Property screening. Coverage may be incomplete; field verification is required before siting.");
      const counts=a.counts||{};
      const sourceFeatureCount=Object.keys(counts).reduce((sum,key)=>sum+(Number(counts[key])||0),0);
      return Object.freeze({
        build:BUILD,sourceTier,acquisitionResult,kind,label,detail,
        exclusionVerified:authoritative,publicationAllowed:true,
        sourceFeatureCount,processedFeatureCount:Number(eng.audit&&eng.audit.checked||0)
      });
    }
    const c=m&&m.vectorNoBuildCoverage||null;if(!c)return null;'''
once(a7,b7)

# 8. One startup globe camera owner. The later panel-globe initializer must
#    not move the map a second time; core Mapbox startup already uses [-102,20].
#    Keep projection and fog intact, and preserve the user-approved globe.
a8 = """try{if(typeof m.jumpTo==='function')m.jumpTo({center:[0,18],zoom:1.25,bearing:0,pitch:0})}catch(error){console.warn('[Earthline 16233] Globe camera unavailable',error)}"""
once(a8, """/* EARTHLINE 16602: core Mapbox owns the idle globe camera; no secondary jump. */""")

# 9. A blank search must NEVER substitute the built-in Poudre demo parcel.
a9 = '''  const blankRequest=!q.trim();
  // The primary action must always do useful work. With a blank field, use the
  // current/default Earthline location directly and skip an unnecessary geocoder call.
  let loc=null;
  if(blankRequest){
    loc=M.loc||GAZ[0];
    q=loc.fullName||((loc.name||"")+(loc.sub?", "+loc.sub:""));
    if(input)input.value=q;
  }'''
b9 = '''  // Empty text is not consent to analyze the demonstration parcel.
  if(!String(q||"").trim()){
    earthlineNotice("Enter a place or move the crosshair first.");
    return false;
  }
  let loc=null;'''
once(a9,b9)

# 10. Run Analysis also bypasses runSearch; prevent its own default demo run.
#     Guard before incrementing generation, setting busy, or touching terrain.
a10 = 'async function earthlineRunAnalysis(options={}){'
b10 = '''async function earthlineRunAnalysis(options={}){
  if(!String((document.getElementById("searchInput")||{}).value||"").trim()){
    earthlineNotice("Enter a place or move the crosshair first.");
    return false;
  }'''
once(a10,b10)

open(dst, 'w', encoding='utf-8').write(s)
print('wrote', dst, 'sha256', hashlib.sha256(s.encode('utf-8')).hexdigest(), 'bytes', len(s.encode('utf-8')))
