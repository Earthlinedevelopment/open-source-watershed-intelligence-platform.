from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

helper_anchor='  function earthlineFrozenPropertyClearanceAudit16255(collection){'
if s.count(helper_anchor)!=1:
    raise SystemExit(f"frozen audit anchor count {s.count(helper_anchor)}")

helper=r'''  /* EARTHLINE 17710 — shared frozen-mask pre-publication safety filter.
     Uses the exact frozen Property no-build mask already owned by the scientific run.
     A corridor is removed whole if any sub-cell sample intersects that mask or cannot
     be verified inside the frozen Property frame. The independent 16255 audit still
     runs afterward and remains the final fail-closed publication verdict. */
  function earthlineFilterFrozenNoBuildMask17710(collection){
    const input=collection&&collection.type==="FeatureCollection"&&Array.isArray(collection.features)
      ?collection:earthlineEmptyPropertyFC16176();
    const mask=M&&M.noBuildMask||null;
    const provenance=M&&M.noBuildProvenance15843||null;
    const width=Number((provenance&&provenance.grid&&provenance.grid.width)||((typeof GW!=="undefined")?GW:0));
    const height=Number((provenance&&provenance.grid&&provenance.grid.height)||((typeof GH!=="undefined")?GH:0));
    const expected=width*height;
    const cellM=Math.max(.25,Number((provenance&&provenance.cellM)||(M&&M.cellM)||1));
    const stepM=Math.max(.30,Math.min(1.0,cellM*.45));
    if(!mask||!expected||Number(mask.length)!==expected||!provenance){
      return {collection:JSON.parse(JSON.stringify(input)),stats:{build:"EARTHLINE 17710",applied:false,verified:false,reason:"frozen-mask-unavailable",input:input.features.length,output:input.features.length,removed:0,maskHits:0,outOfFrame:0,stepM,cellM}};
    }
    function distanceM(a,b){
      const lat=(Number(a[1])+Number(b[1]))*.5*Math.PI/180;
      return Math.hypot((Number(b[0])-Number(a[0]))*111320*Math.max(.05,Math.cos(lat)),(Number(b[1])-Number(a[1]))*111320);
    }
    function gridPoint(c){
      try{
        const g=typeof earthlineLngLatToGrid==="function"
          ?earthlineLngLatToGrid(Number(c[0]),Number(c[1]))
          :(typeof lngLatToGrid==="function"?lngLatToGrid(Number(c[0]),Number(c[1])):null);
        const x=Array.isArray(g)?Number(g[0]):Number(g&&g.x),y=Array.isArray(g)?Number(g[1]):Number(g&&g.y);
        return Number.isFinite(x)&&Number.isFinite(y)?[x,y]:null;
      }catch(_){return null;}
    }
    const kept=[];let removed=0,maskHits=0,outOfFrame=0,sampledPoints=0,segments=0;
    for(const feature of input.features){
      const coords=feature&&feature.geometry&&feature.geometry.type==="LineString"?feature.geometry.coordinates:[];
      let unsafe=coords.length<2;
      for(let i=1;i<coords.length&&!unsafe;i++){
        const a=coords[i-1],b=coords[i];
        if(!Array.isArray(a)||!Array.isArray(b)||a.length<2||b.length<2){unsafe=true;break;}
        segments++;
        const steps=Math.max(1,Math.ceil(distanceM(a,b)/stepM));
        for(let k=(i===1?0:1);k<=steps;k++){
          const t=k/steps,c=[Number(a[0])+(Number(b[0])-Number(a[0]))*t,Number(a[1])+(Number(b[1])-Number(a[1]))*t];
          const g=gridPoint(c);sampledPoints++;
          if(!g){outOfFrame++;unsafe=true;break;}
          const x=Math.round(g[0]),y=Math.round(g[1]);
          if(x<0||y<0||x>=width||y>=height){outOfFrame++;unsafe=true;break;}
          if(mask[y*width+x]){maskHits++;unsafe=true;break;}
        }
      }
      if(unsafe){removed++;continue;}
      kept.push(feature);
    }
    return {collection:{type:"FeatureCollection",features:kept},stats:{build:"EARTHLINE 17710",applied:true,verified:true,input:input.features.length,output:kept.length,removed,maskHits,outOfFrame,sampledPoints,segments,stepM,cellM,rule:"remove any corridor intersecting frozen no-build mask or leaving frozen Property frame"}};
  }
  window.earthlineFilterFrozenNoBuildMask17710=earthlineFilterFrozenNoBuildMask17710;

'''
s=s.replace(helper_anchor,helper+helper_anchor,1)

old_candidate='''      const candidate=(
        filtered&&filtered.collection&&
        filtered.collection.type==="FeatureCollection"&&
        Array.isArray(filtered.collection.features)
      )?filtered.collection:null;'''
new_candidate='''      let candidate=(
        filtered&&filtered.collection&&
        filtered.collection.type==="FeatureCollection"&&
        Array.isArray(filtered.collection.features)
      )?filtered.collection:null;'''
if s.count(old_candidate)!=1:
    raise SystemExit(f"candidate declaration count {s.count(old_candidate)}")
s=s.replace(old_candidate,new_candidate,1)

old_portable='''      const portableEvidence16544=!!(M&&M.vectorNoBuildCoverage&&
        M.vectorNoBuildCoverage.publicationAllowed===true&&
        M.vectorNoBuildCoverage.sourceTier!=="authoritative-local");
      window.EARTHLINE_SAFETY_LOCK_DIAG_17695=Object.assign({},window.EARTHLINE_SAFETY_LOCK_DIAG_17695||{},{
        stage:"before-frozen",candidate:!!candidate,candidateCount:Number(candidate&&candidate.features&&candidate.features.length||0),
        filterIndexAvailable,vectorVerified,finalMaskAvailable,portableEvidence16544,
        vectorCoverageNow:M&&M.vectorNoBuildCoverage?JSON.parse(JSON.stringify(M.vectorNoBuildCoverage)):null,
        auditVerified,acceptedIntersections:Number.isFinite(acceptedIntersections)?acceptedIntersections:null
      });'''
new_portable='''      const portableEvidence16544=!!(M&&M.vectorNoBuildCoverage&&
        M.vectorNoBuildCoverage.publicationAllowed===true&&
        M.vectorNoBuildCoverage.sourceTier!=="authoritative-local");
      let frozenMaskFilter17710=null;
      if(candidate&&finalMaskAvailable){
        frozenMaskFilter17710=earthlineFilterFrozenNoBuildMask17710(candidate);
        if(frozenMaskFilter17710&&frozenMaskFilter17710.stats&&frozenMaskFilter17710.stats.verified===true){
          candidate=JSON.parse(JSON.stringify(frozenMaskFilter17710.collection));
          if(typeof window.earthlineAuditCorridorClearance15806==="function"){
            audit=window.earthlineAuditCorridorClearance15806(candidate,false);
          }
        }
      }
      const auditedAfterFrozen17710=(
        audit&&audit.collection&&audit.collection.type==="FeatureCollection"&&Array.isArray(audit.collection.features)
      )?audit.collection:null;
      const auditVerifiedAfterFrozen17710=!!(audit&&audit.stats&&audit.stats.verified===true);
      const acceptedIntersectionsAfterFrozen17710=Number(audit&&audit.stats&&audit.stats.acceptedIntersections);
      window.EARTHLINE_SAFETY_LOCK_DIAG_17695=Object.assign({},window.EARTHLINE_SAFETY_LOCK_DIAG_17695||{},{
        stage:"before-frozen",candidate:!!candidate,candidateCount:Number(candidate&&candidate.features&&candidate.features.length||0),
        filterIndexAvailable,vectorVerified,finalMaskAvailable,portableEvidence16544,
        frozenMaskFilter17710:frozenMaskFilter17710?JSON.parse(JSON.stringify(frozenMaskFilter17710.stats)):null,
        vectorCoverageNow:M&&M.vectorNoBuildCoverage?JSON.parse(JSON.stringify(M.vectorNoBuildCoverage)):null,
        auditVerified:auditVerifiedAfterFrozen17710,
        acceptedIntersections:Number.isFinite(acceptedIntersectionsAfterFrozen17710)?acceptedIntersectionsAfterFrozen17710:null
      });'''
if s.count(old_portable)!=1:
    raise SystemExit(f"portable evidence block count {s.count(old_portable)}")
s=s.replace(old_portable,new_portable,1)

repls=[
('if(!audited&&!frozenClearanceVerified16255)failures.push("clearance-audit-result-invalid");',
 'if(!auditedAfterFrozen17710&&!frozenClearanceVerified16255)failures.push("clearance-audit-result-invalid");'),
('if(!auditVerified&&!frozenClearanceVerified16255)failures.push("clearance-audit-unverified");',
 'if(!auditVerifiedAfterFrozen17710&&!frozenClearanceVerified16255)failures.push("clearance-audit-unverified");'),
('if(!Number.isFinite(acceptedIntersections))failures.push("clearance-intersection-count-missing");\n        else if(acceptedIntersections!==0)failures.push("accepted-corridor-intersects-exclusion");',
 'if(!Number.isFinite(acceptedIntersectionsAfterFrozen17710))failures.push("clearance-intersection-count-missing");\n        else if(acceptedIntersectionsAfterFrozen17710!==0)failures.push("accepted-corridor-intersects-exclusion");'),
('collection=JSON.parse(JSON.stringify(frozenClearanceVerified16255?candidate:audited));',
 'collection=JSON.parse(JSON.stringify(frozenClearanceVerified16255?candidate:auditedAfterFrozen17710));')
]
for old,new in repls:
    if s.count(old)!=1:
        raise SystemExit(f"downstream anchor count {s.count(old)}: {old[:80]}")
    s=s.replace(old,new,1)

old_field='''      frozenClearance16255:(typeof frozenClearance16255!=="undefined"?frozenClearance16255:null),
      roadOverlap16397:'''
new_field='''      frozenClearance16255:(typeof frozenClearance16255!=="undefined"?frozenClearance16255:null),
      frozenMaskFilter17710:(typeof frozenMaskFilter17710!=="undefined"&&frozenMaskFilter17710?frozenMaskFilter17710.stats:null),
      roadOverlap16397:'''
if s.count(old_field)<2:
    raise SystemExit(f"expected >=2 safety/lock frozen fields, found {s.count(old_field)}")
s=s.replace(old_field,new_field,2)

old_block='''        frozenClearance16255:(typeof frozenClearance16255!=="undefined"?frozenClearance16255:null),
        error:safetyError'''
new_block='''        frozenClearance16255:(typeof frozenClearance16255!=="undefined"?frozenClearance16255:null),
        frozenMaskFilter17710:(typeof frozenMaskFilter17710!=="undefined"&&frozenMaskFilter17710?frozenMaskFilter17710.stats:null),
        error:safetyError'''
if s.count(old_block)!=1:
    raise SystemExit(f"block evidence anchor count {s.count(old_block)}")
s=s.replace(old_block,new_block,1)

p.write_text(s,encoding="utf-8")
print("EARTHLINE_17710_PATCHED")
