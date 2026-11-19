  /* EARTHLINE 16600 — the clean engine's result replaces the layered Property lock.
     The engine applies R1–R13 and the bridge re-measures every swale against the exact vector geometry
     (earthlineRunCleanSwaleEngine16600), so publication does not depend on the layered display filters,
     on-screen layer queries or timers. A run that did not verify never reaches this function with
     M.propertySwaleEngine16600.verified===true, and the original lock below stays in force for it. */
  function earthlineCommitEngineLock16600(eng){
    const rawModel=Array.isArray(M&&M.swales)?JSON.parse(JSON.stringify(M.swales)):[];
    const features=[];
    for(let i=0;i<rawModel.length;i++){
      const src=eng.features&&eng.features[i];
      if(!src||!src.geometry||src.geometry.type!=="LineString")continue;
      features.push({type:"Feature",
        properties:Object.assign({},src.properties,{id:String(rawModel[i].id),stableId:String(src.properties&&src.properties.id||""),rawIndex:i,score:Number(rawModel[i].score||0),
          isSite:false,scale:"property",source:"EarthlinePropertySwales",publicationOwner:"earthlineCommitEngineLock16600"}),
        geometry:{type:"LineString",coordinates:src.geometry.coordinates.map(c=>[Number(c[0]),Number(c[1])])}});
    }
    const collection={type:"FeatureCollection",features};
    const complete=features.length===rawModel.length;
    const failures=complete?[]:["engine-feature-count-mismatch"];
    M.authoritativeSafeSwales15815=complete?collection:earthlineEmptyPropertyFC16176();
    M.authoritativeSafeSwales15806=M.authoritativeSafeSwales15815;
    M.safetyAudit15806={
      build:"EARTHLINE 16600",runScoped:true,owner:"EarthlinePropertySwales",
      rawSegments:rawModel.length,safeSegments:complete?features.length:0,
      acceptedIntersections:complete?0:null,exactAudit:eng.audit||null,
      acquisition:eng.acquisition||null,rejections:eng.rejections||null,determinismHash:eng.determinismHash||null,
      verified:complete,failures:failures.slice(),capturedAt:new Date().toISOString()
    };
    M.propertyResultLock15815={
      build:"EARTHLINE 16600",searchGen:Number(M.searchGen),rawSegments:rawModel.length,safeSegments:complete?features.length:0,
      safetyVerified:complete,failures:failures.slice(),safetyError:null,lockedAt:Date.now(),
      source:"EarthlinePropertySwales",rendererSource:"M.authoritativeSafeSwales15815",owner:"clean-swale-engine"
    };
    if(!complete){
      earthlineBlockPropertyPublication16176(failures.join("|"),{engine:eng.determinismHash||null});
      return M.authoritativeSafeSwales15815;
    }
    M.rawPropertyEngineSwales16176=rawModel;
    M.swales=earthlineSafeModelFromGeoJSON16176(collection,rawModel);
    if(typeof spacingStats==="function")M.spacingStats=spacingStats(M.swales);
    const tier=eng.acquisition&&eng.acquisition.sourceTier,status=eng.acquisition&&eng.acquisition.status;
    M.exclusionConfidence=tier==="authoritative-local"?"verified":(status==="features-found"?"open-data":(status==="screened-clear"?"screened-clear":"unverified"));
    return M.authoritativeSafeSwales15815;
  }
  window.earthlineCommitEngineLock16600=earthlineCommitEngineLock16600;

