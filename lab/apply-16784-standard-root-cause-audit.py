from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def once(name, old, new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

# Expose the full opportunity-cell set used by the nested fine-terrain owner.
once("fine opportunity cells",
"unresolvedAfter:unresolved16780.map(r16780=>({bx:r16780.bx,by:r16780.by,valid:r16780.valid,opportunity:r16780.opportunity,preferred:r16780.preferred})),elapsedMs:",
"opportunityCells:fineRows16780.filter(r16784=>r16784.valid>=20&&r16784.opportunity>=8&&(r16784.opportunity/Math.max(1,r16784.valid))>=.18).map(r16784=>({bx:r16784.bx,by:r16784.by,valid:r16784.valid,opportunity:r16784.opportunity,preferred:r16784.preferred})),unresolvedAfter:unresolved16780.map(r16780=>({bx:r16780.bx,by:r16780.by,valid:r16780.valid,opportunity:r16780.opportunity,preferred:r16780.preferred})),elapsedMs:")

once("fine empty opportunity cells",
"grid:'12x12',tileBudget:refinementTileBudget16782,selected:[],added:0,failedTiles:[],unresolvedAfter:[]",
"grid:'12x12',tileBudget:refinementTileBudget16782,selected:[],opportunityCells:[],added:0,failedTiles:[],unresolvedAfter:[]")

# Persist candidate/selection cell identities so later stages can be compared exactly.
once("final spread cell lineage",
"initialCells:initialCells16783,finalCells:cellCount16783.size,targetCells:targetCells16783,swaps:swaps16783,",
"initialCells:initialCells16783,finalCells:cellCount16783.size,targetCells:targetCells16783,candidateCellKeys:Array.from(bestByCell16783.keys()).sort(),finalCellKeys:Array.from(cellCount16783.keys()).sort(),swaps:swaps16783,")

audit_fn=r'''
  /* EARTHLINE 16784 — STANDARDIZED ROOT-CAUSE AUDIT.
     Diagnostic only: no science, capacity, threshold, source, renderer or lifecycle
     behavior is changed here. Every run is evaluated with the same causal ladder.
     Probability percentages are normalized diagnostic weights, not calibrated
     statistical frequencies. The first failed upstream stage owns the repair. */
  function earthlineStandardAudit16784(ctx={}){
    const tier=String(ctx.tier||document.documentElement.dataset.earthlineAnalysisTier||'regional').toLowerCase();
    const runToken=ctx.runToken||null,query=String(ctx.query||'');
    const catalog=[
      {id:'selection-dispersion',priorPct:28,testOrder:5,owner:'Regional selection owner',test:'Compare real candidate 12x12 cells to final selected 12x12 cells.',solution:'Rebalance/reserve real screened candidates count-neutrally inside the existing Regional capacity. Do not alter slope, water, aquifer, exclusion or boundary science.'},
      {id:'terrain-resolution',priorPct:20,testOrder:3,owner:'Slope / terrain owner',test:'Check whether bounded high-resolution terrain refinement was required to recover measurable <=4% opportunity.',solution:'Refine only the measured low-resolution cells from real elevation data. Never globally lower the slope rule and never fabricate corridors.'},
      {id:'lifecycle-identity',priorPct:14,testOrder:1,owner:'Run lifecycle owner',test:'Verify active run token, displayed tier/query and Property generation fingerprints belong to the same run.',solution:'Retire stale ownership and restore the canonical current run. No science change.'},
      {id:'candidate-generation',priorPct:12,testOrder:4,owner:'Existing makeSwales candidate-generation owner',test:'Compare opportunity-backed 12x12 cells to cells containing at least one real screened candidate.',solution:'Inspect contour geometry, line-length, slope and flow gates only in the failed cells. Change a gate only when the evidence proves that gate is wrong. No synthetic lines.'},
      {id:'jurisdiction-containment',priorPct:9,testOrder:6,owner:'Jurisdiction clipping / containment owner',test:'Compare pre-boundary selected corridors with after-boundary corridors and boundary before/after evidence.',solution:'Repair clipping/sampling/containment math only. Never weaken the administrative boundary.'},
      {id:'land-water-exclusions',priorPct:7,testOrder:2,owner:'Water Sidecar / Exclusions owner',test:'Verify land-validity acquisition, valid cells, unsafe flow segments and Property safety publication.',solution:'Repair land/water classification or exclusion evidence only; fail closed. Never publish on mapped water or unverified Property exclusions.'},
      {id:'publication-render',priorPct:5,testOrder:7,owner:'Publication / renderer owner',test:'Compare post-boundary generated corridors, map source features and visible overlay corridors.',solution:'Repair only the publication/source/overlay handoff. Do not touch terrain or selection science.'},
      {id:'performance-runtime',priorPct:3,testOrder:8,owner:'Existing slowest performance phase',test:'Require Regional core <=15000 ms and inspect the named slowest phase / Property timeout stage.',solution:'Optimize only the measured slowest existing phase while preserving scientific output.'},
      {id:'source-availability',priorPct:2,testOrder:9,owner:'Source registry / fallback owner',test:'Inspect aquifer, watershed and other optional-source acquisition results.',solution:'Use the governed fallback/registry or report unavailable. Never invent groundwater geometry.'}
    ];
    const rows=new Map(catalog.map(c=>[c.id,Object.assign({},c,{status:'unknown',reasons:[],metrics:{}})]));
    const set=(id,status,reason,metrics={})=>{
      const r=rows.get(id);if(!r)return;
      const order={unknown:0,clear:1,warning:2,fail:3,critical:4};
      if(order[status]>order[r.status]||r.status==='unknown')r.status=status;
      if(reason)r.reasons.push(String(reason));
      Object.assign(r.metrics,metrics||{});
    };
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null;
    const fine=window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null;
    const gap=window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null;
    const terrainGap=window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178||null;
    const land=window.EARTHLINE_LAND_VALIDITY_16584||null;
    const landGrid=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
    const flowAudit=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const context=window.EARTHLINE_REGIONAL_CONTEXT_16198||null;
    const displayed=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const prop=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const propRun=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const propTimeout=window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178||null;

    /* 1 — lifecycle / identity */
    if(tier==='property'){
      if(prop&&prop.generationMatches===false)set('lifecycle-identity','critical','Property generation fingerprint does not match the current search generation',{generationMatches:false});
      else if(prop&&prop.published===true&&String(displayed&&displayed.tier||'').toLowerCase()!=='property')set('lifecycle-identity','fail','Property published but canonical displayed tier is not Property',{displayedTier:displayed&&displayed.tier||null});
      else if(prop&&prop.published===true)set('lifecycle-identity','clear','Property publication and canonical tier agree',{published:true});
      else if(prop&&prop.published===false)set('lifecycle-identity','fail','Property publication did not commit',{reason:prop.reason||null});
    }else{
      const active=window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||document.documentElement.dataset.earthlineActiveRun||null;
      if(runToken&&pub&&pub.runToken&&String(pub.runToken)!==String(runToken))set('lifecycle-identity','critical','Regional publication token differs from requested run token',{requested:runToken,published:pub.runToken});
      else if(runToken&&active&&String(active)!==String(runToken)&&String(displayed&&displayed.tier||'').toLowerCase()!=='property')set('lifecycle-identity','fail','Active displayed run token differs from the current Regional run',{requested:runToken,active});
      else if(pub&&pub.runToken)set('lifecycle-identity','clear','Regional publication token is internally consistent',{runToken:pub.runToken});
    }

    /* 2 — land/water validity and exclusions */
    if(tier==='property'){
      if(prop&&prop.published===false&&/safety|exclusion|unverified/i.test(String(prop.reason||'')))set('land-water-exclusions','critical','Property safety/exclusion evidence blocked publication',{reason:prop.reason||null});
      else if(prop&&prop.published===true)set('land-water-exclusions','clear','Property safe publication committed',{safeCount:Number(prop.safeCount||0)});
    }else{
      if(flowAudit&&Number(flowAudit.unsafeSegments||0)>0)set('land-water-exclusions','critical','Displayed water-path segments entered invalid terrain',{unsafeSegments:Number(flowAudit.unsafeSegments||0)});
      else if(land&&land.acquisitionResult&&land.acquisitionResult!=='features-found')set('land-water-exclusions','warning','Land-validity source was unavailable for this run',{acquisitionResult:land.acquisitionResult});
      else if(flowAudit&&flowAudit.safe===true)set('land-water-exclusions','clear','Land/water safety audit reports zero unsafe segments',{unsafeSegments:0,invalidWaterCells:Number(landGrid&&landGrid.rasterizedInvalidWaterCellCount||0)});
    }

    /* Build exact 12x12 O -> C -> S -> P lineage when Regional terrain context exists. */
    const opportunityKeys=new Set((fine&&Array.isArray(fine.opportunityCells)?fine.opportunityCells:[]).map(r=>String(r.bx)+','+String(r.by)));
    const candidateKeys=new Set(spread&&Array.isArray(spread.candidateCellKeys)?spread.candidateCellKeys:[]);
    const selectedKeys=new Set(spread&&Array.isArray(spread.finalCellKeys)?spread.finalCellKeys:[]);
    const publishedKeys=new Set();
    const hy=ctx.hy||null,visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    if(hy&&visual&&visual.swales&&Array.isArray(visual.swales.features)){
      for(const f of visual.swales.features){
        const c=f&&f.geometry&&f.geometry.type==='LineString'?f.geometry.coordinates:null;
        if(!Array.isArray(c)||!c.length)continue;
        const mid=c[Math.floor((c.length-1)/2)],g=llGrid(hy,mid);
        if(!g||!Number.isFinite(Number(g.x))||!Number.isFinite(Number(g.y)))continue;
        const x=Math.max(0,Math.min(11,Math.floor(Number(g.x)*12/Math.max(1,hy.w))));
        const y=Math.max(0,Math.min(11,Math.floor(Number(g.y)*12/Math.max(1,hy.h))));
        publishedKeys.add(x+','+y);
      }
    }
    const diff=(a,b)=>Array.from(a).filter(k=>!b.has(k));
    const opportunityNoCandidate=diff(opportunityKeys,candidateKeys);
    const candidateNoSelected=diff(candidateKeys,selectedKeys);
    const selectedNoPublished=publishedKeys.size?diff(selectedKeys,publishedKeys):[];

    /* 3 — terrain resolution */
    const refinementUsed=Number(fine&&fine.selected&&fine.selected.length||0)+Number(terrainGap&&terrainGap.selectedTiles&&terrainGap.selectedTiles.length||0);
    const refinementAdded=Number(fine&&fine.added||0)+Number(terrainGap&&terrainGap.added||0);
    if(refinementUsed>0&&refinementAdded>0)set('terrain-resolution','warning','Coarse terrain required bounded high-resolution refinement to recover valid opportunity',{refinementTiles:refinementUsed,refinementAdded});
    else if(refinementUsed>0&&refinementAdded===0)set('terrain-resolution','fail','High-resolution refinement was required but recovered no candidate corridors',{refinementTiles:refinementUsed});
    else if(fine)set('terrain-resolution','clear','No unresolved terrain-resolution recovery failure is recorded',{refinementTiles:refinementUsed,refinementAdded});

    /* 4 — candidate generation */
    if(opportunityKeys.size&&opportunityNoCandidate.length){
      set('candidate-generation',opportunityNoCandidate.length>=Math.max(3,Math.ceil(opportunityKeys.size*.12))?'fail':'warning','Opportunity-backed fine cells still contain no screened candidate',{opportunityCells:opportunityKeys.size,candidateCells:candidateKeys.size,missingCandidateCells:opportunityNoCandidate.length,missingKeys:opportunityNoCandidate.slice(0,24)});
    }else if(opportunityKeys.size)set('candidate-generation','clear','Every tracked opportunity-backed fine cell has at least one screened candidate',{opportunityCells:opportunityKeys.size,candidateCells:candidateKeys.size});

    /* 5 — selection / dispersion */
    if(spread){
      const target=Number(spread.targetCells||Math.min(Number(spread.chosenCount||0),Number(spread.candidateCells||0)));
      const final=Number(spread.finalCells||0);
      if(final<target||candidateNoSelected.length>Math.max(0,Number(spread.candidateCells||0)-target))set('selection-dispersion','fail','Real candidate cells were lost during final selection beyond the authoritative capacity requirement',{candidateCells:Number(spread.candidateCells||0),selectedCells:final,targetCells:target,candidateNoSelected:candidateNoSelected.length,missingKeys:candidateNoSelected.slice(0,24)});
      else set('selection-dispersion','clear','Final selection reaches the maximum cell coverage allowed by candidate count and Regional capacity',{candidateCells:Number(spread.candidateCells||0),selectedCells:final,targetCells:target,swaps:Number(spread.swaps||0)});
    }

    /* 6 — jurisdiction containment */
    const bBefore=Number(boundary&&boundary.before&&boundary.before.swales);
    const bAfter=Number(boundary&&boundary.after&&boundary.after.swales);
    if(Number.isFinite(bBefore)&&Number.isFinite(bAfter)&&bBefore>0&&bAfter===0)set('jurisdiction-containment','critical','Boundary clipping removed every selected corridor',{before:bBefore,after:bAfter});
    else if(Number.isFinite(bBefore)&&Number.isFinite(bAfter)&&bBefore>0&&bAfter/bBefore<.65)set('jurisdiction-containment','fail','Boundary clipping removed more than 35% of selected corridors',{before:bBefore,after:bAfter,retainedRatio:Number((bAfter/bBefore).toFixed(3))});
    else if(Number.isFinite(bBefore)&&Number.isFinite(bAfter))set('jurisdiction-containment','clear','Boundary containment completed without extreme corridor attrition',{before:bBefore,after:bAfter,selectedNoPublished:selectedNoPublished.length});

    /* 7 — publication / render */
    if(pub){
      const generated=Number(pub.generated||0),visible=Number(disp&&disp.swaleLines||pub.overlaySwaleLines||0),source=Number(pub.sourceFeatures);
      if(generated!==visible)set('publication-render','critical','Generated corridor count does not equal visible overlay corridor count',{generated,visible,sourceFeatures:Number.isFinite(source)?source:null});
      else if(Number.isFinite(source)&&source!==generated)set('publication-render','fail','Map source corridor count does not equal generated corridor count',{generated,visible,sourceFeatures:source});
      else set('publication-render','clear','Generated, source and visible corridor publication counts agree',{generated,visible,sourceFeatures:Number.isFinite(source)?source:null});
    }

    /* 8 — performance */
    if(propTimeout)set('performance-runtime','critical','Property timeout audit exists',{stage:propTimeout.stage||null,error:propTimeout.error||null});
    else if(perf&&Number(perf.totalMs)>15000)set('performance-runtime','fail','Regional core exceeds the 15,000 ms ceiling',{totalMs:Number(perf.totalMs),slowestPhase:perf.slowestPhase||null,phaseTotalsMs:perf.phaseTotalsMs||null});
    else if(perf&&Number(perf.totalMs)>12000)set('performance-runtime','warning','Regional core is inside the ceiling but has less than 3 seconds of margin',{totalMs:Number(perf.totalMs),slowestPhase:perf.slowestPhase||null});
    else if(perf&&Number.isFinite(Number(perf.totalMs)))set('performance-runtime','clear','Regional core is within the performance ceiling',{totalMs:Number(perf.totalMs),slowestPhase:perf.slowestPhase||null});

    /* 9 — optional source availability */
    if(context&&Array.isArray(context.failures)&&context.failures.length)set('source-availability','warning','Optional context sources were unavailable',{failures:context.failures.slice()});
    else if(context&&context.error)set('source-availability','warning','Optional context acquisition failed',{error:context.error});
    else if(context)set('source-availability','clear','Optional context acquisition completed',{aquiferCount:Number(context.aquiferCount||0),basinCount:Number(context.basinCount||0)});

    const statusMultiplier={critical:12,fail:7,warning:2.5,unknown:1,clear:.12};
    const ranked=Array.from(rows.values()).map(r=>Object.assign(r,{rawWeight:r.priorPct*(statusMultiplier[r.status]||1)}));
    const totalWeight=ranked.reduce((a,r)=>a+r.rawWeight,0)||1;
    for(const r of ranked)r.probabilityPct=Number((r.rawWeight/totalWeight*100).toFixed(1));
    ranked.sort((a,b)=>b.probabilityPct-a.probabilityPct||a.testOrder-b.testOrder);
    const causal=Array.from(rows.values()).sort((a,b)=>a.testOrder-b.testOrder);
    const firstFailed=causal.find(r=>r.status==='critical'||r.status==='fail')||causal.find(r=>r.status==='warning')||null;
    const firstOrder=firstFailed?firstFailed.testOrder:Infinity;
    const result={
      build:'EARTHLINE 16784',
      tier,runToken,query,stage:String(ctx.stage||'core'),
      calibration:'normalized operational diagnostic weights; not statistically calibrated probabilities',
      priorRanking:catalog.slice().sort((a,b)=>b.priorPct-a.priorPct).map(c=>({id:c.id,priorPct:c.priorPct})),
      causalTestOrder:catalog.slice().sort((a,b)=>a.testOrder-b.testOrder).map(c=>({order:c.testOrder,id:c.id,test:c.test,solution:c.solution,owner:c.owner})),
      cellLineage:{
        opportunityCells:opportunityKeys.size,candidateCells:candidateKeys.size,selectedCells:selectedKeys.size,publishedCells:publishedKeys.size||null,
        opportunityNoCandidate:opportunityNoCandidate.slice(0,36),candidateNoSelected:candidateNoSelected.slice(0,36),selectedNoPublished:selectedNoPublished.slice(0,36)
      },
      rankedCauses:ranked.map((r,i)=>({rank:i+1,id:r.id,probabilityPct:r.probabilityPct,status:r.status,owner:r.owner,reasons:r.reasons,metrics:r.metrics,test:r.test,solution:r.solution,testOrder:r.testOrder})),
      firstFailedStage:firstFailed?firstFailed.id:null,
      repairOwner:firstFailed?firstFailed.owner:null,
      nextTest:firstFailed?firstFailed.test:null,
      prescribedSolution:firstFailed?firstFailed.solution:null,
      blockedLowerStages:firstFailed?causal.filter(r=>r.testOrder>firstOrder).map(r=>r.id):[],
      pass:!causal.some(r=>r.status==='critical'||r.status==='fail'),
      at:new Date().toISOString()
    };
    window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784=result;
    window.EARTHLINE_STANDARD_AUDIT_16784=result;
    return result;
  }
  window.earthlineStandardAudit16784=earthlineStandardAudit16784;

'''
once("insert standardized audit function",
"  async function runRegional(q,loc,runToken){",
audit_fn+"  async function runRegional(q,loc,runToken){")

once("regional standardized audit call",
"    recordRun('core_run_published',runToken,{query:q,boundsHash:bHash,swaleCount,waterPaths:flowLineCount,totalMs:phase16198.coreTotalMs});",
"    try{earthlineStandardAudit16784({tier:focusMode?'focus':'regional',runToken,query:q,hy,stage:'core-published'});}catch(_){ }\n    recordRun('core_run_published',runToken,{query:q,boundsHash:bHash,swaleCount,waterPaths:flowLineCount,totalMs:phase16198.coreTotalMs});")

once("context standardized audit call",
"        recordRun(propertyOwnsDisplay16726?'context_enriched_cached_property_preserved':'context_enriched',runToken,window.EARTHLINE_REGIONAL_CONTEXT_16198);",
"        try{earthlineStandardAudit16784({tier:focusMode?'focus':'regional',runToken,query:q,hy,stage:'context-complete'});}catch(_){ }\n        recordRun(propertyOwnsDisplay16726?'context_enriched_cached_property_preserved':'context_enriched',runToken,window.EARTHLINE_REGIONAL_CONTEXT_16198);")

once("property standardized audit success",
"      return {ok:true,counts,snapshot};",
"      try{earthlineStandardAudit16784({tier:'property',runToken,query:snapshot.query,stage:'property-published'});}catch(_){ }\n      return {ok:true,counts,snapshot};")

# Header marker only; no science/selection build marker changes.
once("header marker",
"<!-- EARTHLINE 16783 — FINAL PUBLISHED 12x12 SPREAD.",
"<!-- EARTHLINE 16784 — STANDARDIZED ROOT-CAUSE AUDIT. Diagnostic-only fixed causal audit ladder with O→C→S→P cell lineage, normalized operational probability ranking, first-failed-stage repair lock, and identical tests across jurisdictions. No science, thresholds, capacity, source, water safety, renderer or lifecycle behavior changed. CANDIDATE / NOT ACCEPTED. -->\n<!-- EARTHLINE 16783 — FINAL PUBLISHED 12x12 SPREAD.")

p.write_text(s,encoding="utf-8")
print("16784 standardized audit applied")
