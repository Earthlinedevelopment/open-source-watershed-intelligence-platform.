  /* ============================================================================
     EARTHLINE 16600 — clean Property swale engine: the single connection point.
     Property runs call EarthlinePropertySwales.run() (earthline-property-swales.js) with
     the page's elevation grid, the exclusions decoded directly from Mapbox Streets
     vector tiles at fixed zoom 15 (never read from what is on screen), manual no-build
     polygons and, in Vermont, the authoritative E911 driveway and VCGI building geometry.
     Rules R1–R13 are applied inside the engine; the exact-geometry audit in
     earthline-property-swale-bridge.js then re-measures every proposed swale against the
     vector geometry. Regional tiles never reach this code (see the branch in prescribeSwales15778).
     Failure to obtain a complete exclusion check halts the run (fail closed); it is never
     treated as "nothing mapped". No new on-screen wording is introduced by this block. */
  async function earthlineFetchStreetsTile16600(z,x,y){
    const url="https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/"+z+"/"+x+"/"+y+".vector.pbf?access_token="+encodeURIComponent(MAPBOX_TOKEN);
    let lastError=null;
    for(let attempt=0;attempt<2;attempt++){
      const ctl=typeof AbortController==="function"?new AbortController():null;
      const timer=ctl?setTimeout(()=>ctl.abort(),12000):0;
      try{
        const res=await fetch(url,ctl?{signal:ctl.signal}:undefined);
        if(!res.ok)throw new Error("HTTP "+res.status);
        let buf=await res.arrayBuffer();
        const head=new Uint8Array(buf,0,Math.min(2,buf.byteLength));
        if(head.length===2&&head[0]===0x1f&&head[1]===0x8b&&typeof DecompressionStream==="function"){
          const ds=new DecompressionStream("gzip");
          buf=await new Response(new Blob([buf]).stream().pipeThrough(ds)).arrayBuffer();
        }
        return buf;
      }catch(error){lastError=error;}
      finally{if(timer)clearTimeout(timer);}
    }
    throw lastError||new Error("tile request failed");
  }

  /* Vermont authority geometry and manual no-build polygons, as the bridge's extra exclusion geometry (lng/lat). */
  function earthlineEngineExtras16600(frame){
    const lines=[],polys=[];
    const source=M&&M.vermontAuthoritySource15873||null;
    const ok=c=>Array.isArray(c)&&Number.isFinite(Number(c[0]))&&Number.isFinite(Number(c[1]));
    const lineParts=g=>!g?[]:g.type==="LineString"?[g.coordinates||[]]:g.type==="MultiLineString"?(g.coordinates||[]):[];
    const polyParts=g=>!g?[]:g.type==="Polygon"?[g.coordinates||[]]:g.type==="MultiPolygon"?(g.coordinates||[]):[];
    const BUILT_SETBACK_M=3.05;
    if(source){
      /* same clearances as earthlineAuthoritySourceFeatures15874: driveway 5.5 m, building 6 m */
      for(const f of (source.driveways&&Array.isArray(source.driveways.features)?source.driveways.features:[])){
        for(const part of lineParts(f&&f.geometry)){const c=part.filter(ok).map(p=>[Number(p[0]),Number(p[1])]);
          if(c.length>=2)lines.push({kind:"built",cls:"e911-driveway",halfWidthM:5.5-BUILT_SETBACK_M,requiredM:5.5,coords:c});}
      }
      for(const f of (source.buildings&&Array.isArray(source.buildings.features)?source.buildings.features:[])){
        for(const rings of polyParts(f&&f.geometry)){const rr=(rings||[]).map(r=>(r||[]).filter(ok).map(p=>[Number(p[0]),Number(p[1])])).filter(r=>r.length>=4);
          if(rr.length)polys.push({kind:"built",cls:"vcgi-building",requiredM:6,rasterBufferM:6-BUILT_SETBACK_M,rings:rr});}
      }
    }
    for(const poly of (M&&M.manualNoBuild||[])){
      if(!poly||poly.length<3)continue;
      const ring=poly.map(p=>frame.toLngLat(Number(p[0]),Number(p[1])));ring.push(ring[0].slice());
      polys.push({kind:"built",cls:"manual-no-build",requiredM:0.01,rings:[ring]});
    }
    return {lines,polys,vermontFeatureCount:lines.length+polys.filter(p=>p.cls==="vcgi-building").length,manualCount:polys.filter(p=>p.cls==="manual-no-build").length};
  }

  async function earthlineRunCleanSwaleEngine16600(myGen,started){
    const E=window.EarthlinePropertySwales,B=window.EarthlineSwaleBridge;
    const finishNoBuildRun=()=>{if(M.prescriptionNoBuildRun15843)M.prescriptionNoBuildRun15843.active=false;};
    const fail=(code,detail)=>{
      M.propertySwaleEngine16600={build:"EARTHLINE 16600",searchGen:Number(myGen),verified:false,code,detail:detail||null,at:new Date().toISOString()};
      M.swales=[];M.spacingStats=null;M.coverageDiagnostic15803=null;finishNoBuildRun();
      earthlineHaltPrescription15870(code,{stage:"clean-swale-engine",detail:detail||null});
    };
    if(!E||!B||typeof E.run!=="function"||typeof B.acquireExclusions!=="function")fail("clean-swale-engine-unavailable",{engine:!!E,bridge:!!B});
    M.propertySwaleEngine16600=null;M.propertySwaleEngineContext16600=null;
    const lng0=Number(M.centerLng||0),lat0=Number(M.centerLat||0),cellM=Number(M.cellM||0);
    if(!(cellM>0)||!M.h||M.h.length!==N||!M.inP||M.inP.length!==N||!M.acc||M.acc.length!==N)fail("clean-swale-engine-inputs-unavailable",{cellM,h:M.h&&M.h.length,inP:M.inP&&M.inP.length,acc:M.acc&&M.acc.length});
    const frame=B.makeFrame(lng0,lat0,GW,GH,cellM);
    const inside=new Uint8Array(N);let insideCells=0;
    for(let i=0;i<N;i++)if(M.inP[i]){inside[i]=1;insideCells++;}
    if(!insideCells)fail("clean-swale-engine-boundary-empty",{});
    /* elevation: the page grid as it is. Non-finite cells inside the property make elevation unavailable. */
    const elev=new Float32Array(N);let finiteSum=0,finiteN=0,nonFinite=0,nonFiniteInside=0;
    for(let i=0;i<N;i++){const v=Number(M.h[i]);if(Number.isFinite(v)){elev[i]=v;finiteSum+=v;finiteN++;}else{elev[i]=NaN;nonFinite++;if(inside[i])nonFiniteInside++;}}
    if(nonFiniteInside||!finiteN)fail("clean-swale-engine-elevation-unavailable",{nonFinite,nonFiniteInside});
    if(nonFinite){const fill=finiteSum/finiteN;for(let i=0;i<N;i++)if(!Number.isFinite(elev[i]))elev[i]=fill;}
    /* the page's own channel definition (the protected-channel threshold of the no-build mask) and its filled-terrain flow accumulation,
       so R8 agrees with the water paths the page draws; ponded depressions are added as channel cells */
    const thr=Number(streamThreshold());
    const channelThresholdCells=Math.max(3,thr*3.0);
    const channelMask=new Uint8Array(N);if(M.pond)for(let i=0;i<N;i++)if(M.pond[i])channelMask[i]=1;
    /* intact closed forest ranks last, never removed */
    let landcover=null;
    try{if(typeof _canopyData!=="undefined"&&_canopyData){landcover=new Uint8Array(N);for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(canopyAt(x,y)>0.40)landcover[idx(x,y)]=1;}}catch(_){landcover=null;}
    earthlineRecordTerrainHandoff15791("clean-engine-inputs",myGen);
    const t0=performance.now();
    const extras=earthlineEngineExtras16600(frame);
    const vermont=!!M.vermontAuthoritySource15873; /* loaded only for Vermont properties */
    const vermontVerified=!!(vermont&&M.vermontAuthoritySource15873.queryVerified===true);
    const acq=await B.acquireExclusions({frame,insideMask:inside,fetchTile:earthlineFetchStreetsTile16600,zoom:15,marginM:60,extra:{lines:extras.lines,polys:extras.polys},
      sourceTier:vermontVerified?"authoritative-local":"open-data"});
    if(earthlineIsStale(myGen))return false;
    if(!acq.ok)fail("clean-engine-exclusion-check-failed",{reason:acq.reason,tiles:acq.tiles});
    await earthlineTaskYield16464();
    if(earthlineIsStale(myGen))return false;
    const params={channelThresholdCells,thr,maxAcc:Number(M.maxAcc||0),cellM,grid:[GW,GH],pondCells:Number(M.pondCells||0)};
    const runEngine=(over)=>E.run(Object.assign({
      grid:{w:GW,h:GH,cellM,bbox:frame.engineBBox,elev},inside,
      exclusions:{status:acq.status,sourceTier:acq.sourceTier,built:acq.built,water:acq.water},
      soilGroup:null,elevationSource:"Mapbox terrain-RGB sampled to the page grid (not bare-earth)",
      landcover:landcover||undefined,flowAccumulation:M.acc,channelThresholdCells,channelMask
    },over||{}));
    const out=runEngine();
    if(earthlineIsStale(myGen))return false;
    if(!out||!out.status||out.status.acquisition==="failed")fail("clean-engine-exclusion-check-failed",{reason:"engine-refused",message:out&&out.message||null});
    const audit=B.auditSwales(out.swales,acq.geometry,M.analysisBoundaryLngLat,frame);
    const corridors=B.toCorridors(audit.kept,frame);
    corridors.sort((a,b)=>(a.levelH-b.levelH)||(a.stableId<b.stableId?-1:a.stableId>b.stableId?1:0));
    /* the page's existing exact Vermont source-geometry audit runs unchanged on the final corridors */
    if(typeof window.earthlineFilterAuthorityCorridors15874==="function")window.earthlineFilterAuthorityCorridors15874(corridors);
    corridors.forEach((s,i)=>{s.id="B"+(i+1);});
    const publishedIds=new Set(corridors.map(s=>s.stableId));
    const features=audit.kept.filter(f=>publishedIds.has(f.properties.id));
    const byStable=new Map(features.map(f=>[f.properties.id,f]));
    const orderedFeatures=corridors.map(s=>byStable.get(s.stableId));
    M.swales=corridors;
    M.spacingStats=spacingStats(corridors);
    if(!M.swaleDiagnostics)M.swaleDiagnostics=earthlineCollectSwaleDiagnostics();
    Object.assign(M.swaleDiagnostics,{engine:"earthline-property-swales",generated:corridors.length,candidateCount:out.evidence.candidates});
    M.swaleDiagnostics.stage=Object.assign(M.swaleDiagnostics.stage||{},{candidates:out.evidence.passedRules,afterDedupe:corridors.length,final:corridors.length});
    M.swaleMeta={
      method:"earthline-property-swales-"+E.VERSION+"-R1-R13",soil:false,targetSpacingM:TARGET_M,acceptedSpacingM:[MIN_M,MAX_M],levelStepM:E.LIMITS.contourStepM,
      medianTerrainSlope:null,spacingMethod:"median nearest-neighbor centerline ground distance, excluding fragments of the same contour band",
      measuredMedianSpacingM:M.spacingStats&&M.spacingStats.medianM,measuredMinSpacingM:M.spacingStats&&M.spacingStats.minM,measuredMaxSpacingM:M.spacingStats&&M.spacingStats.maxM,
      spacingPopulationCount:M.spacingStats&&(M.spacingStats.populationCount||corridors.length),spacingSampleCount:M.spacingStats&&M.spacingStats.sampleCount||0,spacingSampled:!!(M.spacingStats&&M.spacingStats.sampled),
      scaleMode:"property-engineering",constructionReady:true,timeBudgetReached:false,count:corridors.length,levelsChecked:0,candidatesGenerated:out.evidence.candidates,
      regionalTile:false,prescriptionMs:Math.round(performance.now()-started)
    };
    M.coverageDiagnostic15803=null; /* the old engine's coverage statistics do not describe this engine; see candidate notes */
    const rej=out.rejections||{};
    const slopeSide=(rej.R2||0)+(rej.R3||0)+(rej.R12||0),excludeSide=(rej.R6||0)+(rej.R7||0)+(rej.R8||0)+(rej.R9||0);
    const cov16600=out.evidence.coverage||{},slopeShare16600=cov16600.insideCells?(Number(cov16600.slopeOver4Total||0)/cov16600.insideCells):0;
    M.prescriptionZeroReason15870=corridors.length?null:((slopeShare16600>=0.5||slopeSide>=excludeSide)?"no-suitable-slope-corridors":"all-candidates-excluded");
    if(corridors.length)M.prescriptionHalt15870=null;
    /* Final publication counts are the audit/lock product, not the pre-audit proposal.
       Preserve raw engine count for diagnostics, but never claim raw proposals were drawn. */
    const finalMessage16601=String(out.message||"").replace(/\b\d+\s+proposed swale alignments\b/,
      String(corridors.length)+" proposed swale alignments");
    M.propertySwaleEngine16600={
      build:"EARTHLINE 16600",searchGen:Number(myGen),verified:true,
      engineVersion:E.VERSION,bridgeVersion:B.VERSION,determinismHash:out.determinismHash,message:finalMessage16601,
      acquisition:{status:acq.status,sourceTier:acq.sourceTier,counts:acq.counts,tiles:acq.tiles,zoom:acq.zoom,vermontApplicable:vermont,vermontVerified,
        extraVermontFeatures:extras.vermontFeatureCount,manualNoBuild:extras.manualCount,source:"mapbox-streets-v8 vector tiles (direct fetch, fixed zoom 15)"},
      rejections:rej,coverage:out.evidence.coverage,evidence:out.evidence,params,
      audit:{checked:audit.checked,rejected:audit.rejected,minClearanceM:audit.minClearanceM,counts:audit.counts},
      rawEngineSwales:out.swales.length,engineSwales:corridors.length,publishedSwales:corridors.length,
      features:orderedFeatures,
      timing:{acquireAndRunMs:Math.round(performance.now()-t0),totalMs:Math.round(performance.now()-started)},
      at:new Date().toISOString()
    };
    M.propertySwaleEngineContext16600={frame,inside,elev,acq,landcover,channelMask,params,runEngine};
    finishNoBuildRun();
    console.log("[Earthline] 16600 clean swale engine",{swales:corridors.length,acquisition:acq.status,hash:out.determinismHash,ms:M.propertySwaleEngine16600.timing});
    return corridors;
  }
  window.earthlineRunCleanSwaleEngine16600=earthlineRunCleanSwaleEngine16600;
  /* Test-only measurement hook: re-runs the engine on the SAME grid and exclusions with a different channel definition. Publishes nothing. */
  window.__EARTHLINE_SWALE_ENGINE_HOOK_16600={
    sensitivity(multipliers){
      const c=M&&M.propertySwaleEngineContext16600;if(!c)return null;const rows=[];
      for(const mult of (multipliers||[0.78,1,3,5])){
        const cells=Math.max(3,Number(c.params.thr)*mult),out=c.runEngine({channelThresholdCells:cells});
        rows.push({thresholdMultiplier:mult,channelThresholdCells:+cells.toFixed(2),swales:out.swales.length,rejections:out.rejections,coverage:out.evidence.coverage,hash:out.determinismHash});
      }
      return rows;
    },
    result(){return M&&M.propertySwaleEngine16600||null;}
  };
