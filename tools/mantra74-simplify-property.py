from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")
original=s

def must_replace(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f"{label}: expected 1 occurrence, found {n}")
    s=s.replace(old,new,1)

def replace_between(start_marker,end_marker,new_text,label):
    global s
    a=s.find(start_marker)
    b=s.find(end_marker,a+len(start_marker))
    if a<0 or b<0 or b<=a:
        raise RuntimeError(f"{label}: markers missing")
    s=s[:a]+new_text+s[b:]

# 1. Stop jurisdiction-specific exclusion prefetch before shared source availability is known.
must_replace(
'''  let vermontAuthorityPrefetch16263=null;
  try{
    if(typeof window.earthlinePrefetchVermontAuthority16263==="function")
      vermontAuthorityPrefetch16263=Promise.resolve(window.earthlinePrefetchVermontAuthority16263(M.analysisBoundaryLngLat,myGen));
  }catch(_){vermontAuthorityPrefetch16263=null;}
''',
'''  /* EARTHLINE 17630 — no jurisdiction-specific exclusion prefetch.
     Property uses one shared evidence cascade; local authority is an optional
     source capability discovered below, never a separate analysis mode. */
''',
"retire Vermont prefetch"
)

# 2. Vermont validation becomes source-capability discovery, not a different Property mode.
replace_between(
'''  if(typeof window.earthlineValidateVermontBoundary16178==='function'){''',
'''  /* EARTHLINE 16550 — portable Property latency.''',
'''  /* EARTHLINE 17630 — source availability, not jurisdiction mode.
     Every Property run uses the same terrain/hydrology/exclusion pipeline.
     A local authority may enrich exclusions when positively available, but
     its absence never changes the engine or blocks use of other valid evidence. */
  const jurisdictionBoundaryKey17630=(M.analysisBoundaryLngLat||[])
    .map(p=>Number(p[0]).toFixed(7)+","+Number(p[1]).toFixed(7)).join("|");
  let localGate17630=null;
  try{
    if(typeof window.earthlineValidateVermontBoundary16178==='function'){
      localGate17630=await window.earthlineValidateVermontBoundary16178(
        M.analysisBoundaryLngLat,{requireAll:true,context:"source-capability"}
      );
    }
  }catch(error17630){
    localGate17630={ok:false,reason:"local-authority-capability-error",message:String(error17630&&error17630.message||error17630)};
  }
  const insideVermont17630=!!(localGate17630&&localGate17630.ok===true);
  M.propertyJurisdiction16516={
    mode:"shared-evidence",
    insideVermont:insideVermont17630,
    localAuthority:insideVermont17630?"vermont-vcgi-e911":null,
    sourceTier:"pending",
    acquisitionResult:"pending",
    boundaryReason:String(localGate17630&&localGate17630.reason||"no-local-authority"),
    boundaryKey:jurisdictionBoundaryKey17630,
    at:new Date().toISOString()
  };
  window.EARTHLINE_PROPERTY_BOUNDARY_AUDIT_16178=Object.assign({},localGate17630||{},{
    blocked:false,
    portable:!insideVermont17630,
    capabilityOnly:true,
    boundaryKey:jurisdictionBoundaryKey17630,
    at:new Date().toISOString()
  });
''',
"shared source capability gate"
)

# 3. Exact local authority applicability uses capability result when it exists.
must_replace(
'''    if(M&&M.propertyJurisdiction16516&&M.propertyJurisdiction16516.insideVermont===false&&M.propertyJurisdiction16516.boundaryKey===boundaryKey16516)return false;
    const lngs=boundary.map(p=>Number(p[0])).filter(Number.isFinite);''',
'''    if(M&&M.propertyJurisdiction16516&&M.propertyJurisdiction16516.boundaryKey===boundaryKey16516){
      return M.propertyJurisdiction16516.insideVermont===true;
    }
    const lngs=boundary.map(p=>Number(p[0])).filter(Number.isFinite);''',
"authority applicability capability"
)

# 4. Local authority failure falls through to the same open-data contract.
start=s.find('    if(v.applicable===true){',s.find('function earthlineFinalizeVectorVerification16343'))
end=s.find('\n\n    const op=external.overpass||{};',start)
if start<0 or end<0:
    raise RuntimeError("finalize local-authority block missing")
s=s[:start]+'''    if(v.applicable===true&&vermontVerified){
      c.sourceTier="authoritative-local";
      if(n>0&&(styleEvidence||externalEvidence)){
        c.acquisitionResult="features-found";c.exclusionVerified=true;c.publicationAllowed=true;c.evidenceGrade="AUTHORITATIVE LOCAL DATA";
        return earthlineSetVectorVerification16343(c,"verified-with-features",null);
      }
      c.acquisitionResult="clear";c.exclusionVerified=true;c.publicationAllowed=true;c.evidenceGrade="AUTHORITATIVE LOCAL DATA";
      return earthlineSetVectorVerification16343(c,"verified-clear",null);
    }
    if(v.applicable===true&&!vermontVerified){
      /* Local authority is one optional source adapter. If it is unavailable,
         continue through the same open-data evidence contract used everywhere. */
      c.localAuthorityAvailable=true;
      c.localAuthorityStatus="unavailable-or-unverified";
    }'''+s[end:]

# 5. One shared style-first exclusion path for every Property.
vstart=s.find('    /* EARTHLINE 16550 — one exclusion owner, local loaded evidence first.',s.find('async function vectorNoBuild15778'))
vend=s.find('    M.vectorNoBuildCoverage.readinessWait=readiness;',vstart)
if vstart<0 or vend<0:
    raise RuntimeError("vector setup block missing")
vend2=vend+len('    M.vectorNoBuildCoverage.readinessWait=readiness;')
s=s[:vstart]+'''    /* EARTHLINE 17630 — one exclusion path everywhere.
       Query the already-loaded shared map evidence first. If that source cannot
       answer, use the shared infrastructure adapter. A local authoritative adapter
       may enrich the same result when available; it never creates another mode. */
    const localAuthorityAvailable17630=!!(
      M.propertyJurisdiction16516&&M.propertyJurisdiction16516.localAuthority
    );
    let infrastructurePromise15862P=null;
    const infrastructure16550=()=>{
      if(!infrastructurePromise15862P){
        infrastructurePromise15862P=Promise.resolve(earthlineCollectParcelInfrastructure15862P(myGen));
      }
      return infrastructurePromise15862P;
    };
    const stylePrefetch16459=M&&M._mappedExclusionStylePrefetch16459||null;
    const rawStyleReadiness16469=(stylePrefetch16459&&Number(stylePrefetch16459.searchGen)===Number(myGen)&&stylePrefetch16459.promise)
      ?stylePrefetch16459.promise
      :(typeof earthlineWaitForMappedExclusionStyle15862B==="function"
        ?earthlineWaitForMappedExclusionStyle15862B(myGen,5000)
        :Promise.resolve({ready:mapReady(),status:mapReady()?"fallback-ready":"fallback-not-ready",waitedMs:0}));
    const readiness=await Promise.resolve(rawStyleReadiness16469).catch(()=>({
      ready:false,status:"readiness-error",waitedMs:0
    }));
    M.vectorNoBuildCoverage.readinessWait=readiness;'''+s[vend2:]

# 6. Same source order after the style query. Optional local authority enriches; otherwise style is enough.
istart=s.find('      let infrastructure15862P=null;',s.find('async function vectorNoBuild15778'))
iend=s.find('      M.vectorNoBuildCoverage.infrastructure15862P=earthlineInfraCoverageRecord15862P(infrastructure15862P);',istart)
if istart<0 or iend<0:
    raise RuntimeError("style/infrastructure branch missing")
s=s[:istart]+'''      let infrastructure15862P=earthlineInfraResult15862P();
      if(styleQuerySuccess16516){
        infrastructure15862P.status="loaded-map-style-screening";
        infrastructure15862P.source="loaded-map-style-open-data";
        M.vectorNoBuildCoverage.evidencePath17630="shared-style-first";
        if(localAuthorityAvailable17630){
          earthlineProgress("hydrology","adding available local exclusion evidence…");
          const localEvidence17630=await infrastructure16550();
          if(earthlineIsStale(myGen)){
            earthlineSetVectorVerification16343(M.vectorNoBuildCoverage,"unverified","analysis-stale-after-local-evidence");
            return false;
          }
          if(localEvidence17630&&localEvidence17630.vermont&&localEvidence17630.vermont.ok===true){
            infrastructure15862P=localEvidence17630;
            earthlineMergeInfraMasks15862P(roadMask,buildingMask,infrastructure15862P);
            count+=Number(infrastructure15862P.processedGeometryCount||0);
            M.vectorNoBuildCoverage.sourceFeatureCount+=Number(infrastructure15862P.overpass&&infrastructure15862P.overpass.rawElementCount||0);
            M.vectorNoBuildCoverage.evidencePath17630="shared-style-plus-local-authority";
          }else{
            M.vectorNoBuildCoverage.localAuthorityFallback17630="open-data-style";
          }
        }
      }else{
        earthlineProgress("hydrology","mapping available parcel exclusions…");
        infrastructure15862P=await infrastructure16550();
        if(earthlineIsStale(myGen)){
          earthlineSetVectorVerification16343(M.vectorNoBuildCoverage,"unverified","analysis-stale-after-infrastructure-retrieval");
          return false;
        }
        earthlineMergeInfraMasks15862P(roadMask,buildingMask,infrastructure15862P);
        count+=Number(infrastructure15862P&&infrastructure15862P.processedGeometryCount||0);
        M.vectorNoBuildCoverage.sourceFeatureCount+=Number(infrastructure15862P&&infrastructure15862P.overpass&&infrastructure15862P.overpass.rawElementCount||0);
        M.vectorNoBuildCoverage.evidencePath17630="shared-infrastructure-fallback";
      }
'''+s[iend:]

for forbidden in [
    'mode:"portable-non-vermont"',
    'mode:"vermont-authoritative"',
    'const portableStyleFirst16550=',
    'verifying the declared project area is inside Vermont'
]:
    if forbidden in s:
        raise RuntimeError("legacy jurisdiction mode remains: "+forbidden)

for required in [
    'mode:"shared-evidence"',
    'evidencePath17630="shared-style-first"',
    'shared-infrastructure-fallback',
    'capabilityOnly:true'
]:
    if required not in s:
        raise RuntimeError("required shared rule missing: "+required)

p.write_text(s,encoding="utf-8")
print("EARTHLINE_17630_SHARED_PROPERTY_EVIDENCE",len(original),len(s))

# trigger shared-evidence application
