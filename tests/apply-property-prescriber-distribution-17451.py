from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_stats="""        if(subject.bandKey!=null&&other.bandKey!=null&&subject.bandKey===other.bandKey)continue;
        if(earthlineBBoxGapM15770(subject,other)>=best)continue;"""
new_stats="""        const sameTraceFragment17451=!!(
          subject.bandKey!=null&&other.bandKey!=null&&subject.bandKey===other.bandKey&&
          subject.diagnosticSeedId15843&&other.diagnosticSeedId15843&&
          String(subject.diagnosticSeedId15843)===String(other.diagnosticSeedId15843)
        );
        if(sameTraceFragment17451)continue;
        if(earthlineBBoxGapM15770(subject,other)>=best)continue;"""
if s.count(old_stats)!=1: raise SystemExit(f"spacingStats same-band anchor count {s.count(old_stats)}")
s=s.replace(old_stats,new_stats,1)

old_order="""    const ordered=swales.slice().sort((a,b)=>
      (Number(!!b.primaryFlowFirst15836)-Number(!!a.primaryFlowFirst15836)) ||
      (Number(b.prescriptionFlowScore15833||0)-Number(a.prescriptionFlowScore15833||0)) ||
      (Number(b.seedFlowCrossing15833||0)-Number(a.seedFlowCrossing15833||0)) ||
      ((b.score||0)-(a.score||0)) ||
      (Number(a.levelH||0)-Number(b.levelH||0)) ||
      (Number(a.bandKey||0)-Number(b.bandKey||0))
    );
"""
new_order="""    const ranked17451=swales.slice().sort((a,b)=>
      (Number(!!b.primaryFlowFirst15836)-Number(!!a.primaryFlowFirst15836)) ||
      (Number(b.prescriptionFlowScore15833||0)-Number(a.prescriptionFlowScore15833||0)) ||
      (Number(b.seedFlowCrossing15833||0)-Number(a.seedFlowCrossing15833||0)) ||
      ((b.score||0)-(a.score||0)) ||
      (Number(a.levelH||0)-Number(b.levelH||0)) ||
      (Number(a.bandKey||0)-Number(b.bandKey||0))
    );
    /* EARTHLINE 17451 — Property prescription distribution repair.
       Regional tiles retain the existing order. Property candidates remain the
       exact same real contour / flow-first geometries and rankings, but the final
       spacing pass sees them in deterministic 4x4 parcel-zone round-robin order.
       This prevents one high-scoring hillside patch from consuming the final
       prescription before other terrain zones with equally valid candidates are
       evaluated. No zone without a real candidate can receive a swale. */
    let ordered=ranked17451;
    const propertyZoneAudit17451={
      build:"EARTHLINE 17451",mode:isRegionalTile15769?"regional-unchanged":"property-zone-round-robin",
      candidateCounts:Array(16).fill(0),acceptedCounts:Array(16).fill(0),
      sameTraceFragmentSpacingExemptions:0,sameBandIndependentSpacingChecks:0,
      spacingRejects:0,at:new Date().toISOString()
    };
    function propertyZoneIndex17451(sw){
      const rec=candidateRecord15803.get(sw)||null;
      if(rec&&Number.isFinite(Number(rec.x))&&Number.isFinite(Number(rec.y)))
        return earthlineCoverageZoneIndex15803(Number(rec.x),Number(rec.y));
      const pts=Array.isArray(sw&&sw.pts)?sw.pts:[];
      const mid=pts.length?pts[Math.floor(pts.length/2)]:null;
      return mid&&Number.isFinite(Number(mid[0]))&&Number.isFinite(Number(mid[1]))
        ?earthlineCoverageZoneIndex15803(Number(mid[0]),Number(mid[1])):0;
    }
    if(!isRegionalTile15769&&ranked17451.length){
      const buckets17451=Array.from({length:16},()=>[]);
      const rankedIndex17451=new Map();
      ranked17451.forEach((sw17451,i17451)=>{
        rankedIndex17451.set(sw17451,i17451);
        const z17451=propertyZoneIndex17451(sw17451);
        buckets17451[z17451].push(sw17451);
        propertyZoneAudit17451.candidateCounts[z17451]++;
      });
      const activeZones17451=buckets17451.map((bucket,z)=>({
        z,bucket,best:bucket.length?rankedIndex17451.get(bucket[0]):Infinity
      })).filter(r=>r.bucket.length).sort((a,b)=>a.best-b.best||a.z-b.z);
      const spread17451=[];
      const maxDepth17451=Math.max(0,...activeZones17451.map(r=>r.bucket.length));
      for(let depth17451=0;depth17451<maxDepth17451;depth17451++){
        for(const row17451 of activeZones17451){
          const sw17451=row17451.bucket[depth17451];
          if(sw17451)spread17451.push(sw17451);
        }
      }
      ordered=spread17451;
      propertyZoneAudit17451.supportedZones=activeZones17451.map(r=>r.z);
      propertyZoneAudit17451.supportedZoneCount=activeZones17451.length;
    }
"""
if s.count(old_order)!=1: raise SystemExit(f"ordered anchor count {s.count(old_order)}")
s=s.replace(old_order,new_order,1)

old_skip="""        const ex=kept[exIndex16204];
        if(sw.bandKey===ex.bandKey)continue;
        if(Math.abs(Number(sw.levelH||0)-Number(ex.levelH||0))>verticalWindowM)continue;"""
new_skip="""        const ex=kept[exIndex16204];
        const sameBand17451=sw.bandKey!=null&&ex.bandKey!=null&&sw.bandKey===ex.bandKey;
        const sameTraceFragment17451=!!(
          sameBand17451&&sw.diagnosticSeedId15843&&ex.diagnosticSeedId15843&&
          String(sw.diagnosticSeedId15843)===String(ex.diagnosticSeedId15843)
        );
        if(sameTraceFragment17451){
          propertyZoneAudit17451.sameTraceFragmentSpacingExemptions++;
          continue;
        }
        if(sameBand17451)propertyZoneAudit17451.sameBandIndependentSpacingChecks++;
        if(Math.abs(Number(sw.levelH||0)-Number(ex.levelH||0))>verticalWindowM)continue;"""
if s.count(old_skip)!=1: raise SystemExit(f"final same-band anchor count {s.count(old_skip)}")
s=s.replace(old_skip,new_skip,1)

old_reject="""        M.swaleDiagnostics.stage.rejectFinalSpacing++;
        continue;
      }
"""
new_reject="""        M.swaleDiagnostics.stage.rejectFinalSpacing++;
        propertyZoneAudit17451.spacingRejects++;
        continue;
      }
"""
# This snippet may occur multiple times; constrain to one in final spacing section by count.
if s.count(old_reject)<1: raise SystemExit("final reject anchor missing")
# replace the last occurrence before kept.push, not blindly first.
final_pos=s.find("const kept=[],keptBBox16204=[];")
rej_pos=s.find(old_reject,final_pos)
if rej_pos<0: raise SystemExit("final reject occurrence missing")
s=s[:rej_pos]+s[rej_pos:].replace(old_reject,new_reject,1)

old_push="""      kept.push(sw);keptBBox16204.push(swBBox16204);spacingIndexAdd16456(kept.length-1,swBBox16204);
      dedupeChecked15769++;"""
new_push="""      kept.push(sw);keptBBox16204.push(swBBox16204);spacingIndexAdd16456(kept.length-1,swBBox16204);
      if(!isRegionalTile15769){
        const z17451=propertyZoneIndex17451(sw);
        propertyZoneAudit17451.acceptedCounts[z17451]++;
      }
      dedupeChecked15769++;"""
if s.count(old_push)!=1: raise SystemExit(f"kept push anchor count {s.count(old_push)}")
s=s.replace(old_push,new_push,1)

old_meta="""    M.spacingStats=spacingStats(kept);
"""
new_meta="""    M.spacingStats=spacingStats(kept);
    if(!isRegionalTile15769){
      propertyZoneAudit17451.acceptedZoneCount=propertyZoneAudit17451.acceptedCounts.filter(n=>n>0).length;
      propertyZoneAudit17451.acceptedTotal=kept.length;
      propertyZoneAudit17451.spacingTargetM=targetSpacingM15771;
      propertyZoneAudit17451.minimumSpacingM=minSpacingM15771;
      propertyZoneAudit17451.measuredSpacing=M.spacingStats;
      propertyZoneAudit17451.coverageRatio=propertyZoneAudit17451.supportedZoneCount
        ?propertyZoneAudit17451.acceptedZoneCount/propertyZoneAudit17451.supportedZoneCount:0;
      window.EARTHLINE_PROPERTY_PRESCRIPTION_DISTRIBUTION_17451=propertyZoneAudit17451;
    }
"""
if s.count(old_meta)!=1: raise SystemExit(f"spacing metadata anchor count {s.count(old_meta)}")
s=s.replace(old_meta,new_meta,1)

s="<!-- EARTHLINE_PROPERTY_PRESCRIPTION_DISTRIBUTION_17451: real-candidate parcel-zone round-robin + same-band independent spacing enforcement. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched actual 20-acre Property prescriber distribution/spacing 17451")
