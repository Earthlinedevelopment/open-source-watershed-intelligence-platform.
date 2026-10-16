from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

start=s.find("  async function fetchTerrainTile(z,x,y,signal){")
end=s.find("  async function loadDEM(",start)
if start<0 or end<0: raise SystemExit("terrain tile owner anchors missing")

new=r'''  const EARTHLINE_TERRAIN_FETCH_MAX_17341=8;
  let earthlineTerrainFetchActive17341=0;
  const earthlineTerrainFetchQueue17341=[];
  function earthlinePumpTerrainFetch17341(){
    while(earthlineTerrainFetchActive17341<EARTHLINE_TERRAIN_FETCH_MAX_17341&&earthlineTerrainFetchQueue17341.length){
      const job=earthlineTerrainFetchQueue17341.shift();
      earthlineTerrainFetchActive17341++;
      Promise.resolve().then(job.run).then(job.resolve,job.reject).finally(()=>{
        earthlineTerrainFetchActive17341--;
        earthlinePumpTerrainFetch17341();
      });
    }
  }
  function earthlineScheduleTerrainFetch17341(run){
    return new Promise((resolve,reject)=>{
      earthlineTerrainFetchQueue17341.push({run,resolve,reject});
      earthlinePumpTerrainFetch17341();
    });
  }
  function earthlineAwaitTerrainShared17341(promise,signal){
    if(!signal)return promise;
    if(signal.aborted)return Promise.reject(signal.reason instanceof Error?signal.reason:new Error("terrain request aborted"));
    return new Promise((resolve,reject)=>{
      let done=false;
      const cleanup=()=>{try{signal.removeEventListener("abort",onAbort)}catch(_){}};
      const finish=(ok,value)=>{if(done)return;done=true;cleanup();ok?resolve(value):reject(value);};
      const onAbort=()=>finish(false,signal.reason instanceof Error?signal.reason:new Error("terrain request aborted"));
      try{signal.addEventListener("abort",onAbort,{once:true})}catch(_){}
      promise.then(v=>finish(true,v),e=>finish(false,e));
    });
  }
  async function fetchTerrainTile(z,x,y,signal){
    const key=String(z)+'/'+String(x)+'/'+String(y);
    if(EARTHLINE_REGIONAL_TERRAIN_CACHE_16297.has(key)){
      const cached=EARTHLINE_REGIONAL_TERRAIN_CACHE_16297.get(key);
      rememberRegionalTerrain16297(key,cached);
      return cached;
    }
    if(EARTHLINE_REGIONAL_TERRAIN_INFLIGHT_16297.has(key)){
      return earthlineAwaitTerrainShared17341(EARTHLINE_REGIONAL_TERRAIN_INFLIGHT_16297.get(key),signal);
    }
    const shared=earthlineScheduleTerrainFetch17341(async()=>{
      const primary=TERRARIUM.replace('{z}',z).replace('{x}',x).replace('{y}',y);
      const alternate=TERRARIUM_ALT.replace('{z}',z).replace('{x}',x).replace('{y}',y);
      const sharedCtl=new AbortController();
      const sharedTimer=setTimeout(()=>sharedCtl.abort(new Error('open terrain tile timed out')),9000);
      try{
        return await new Promise((resolve,reject)=>{
          let settled=false,alternateStarted=false,failures=0,last=null,stagger=0;
          const finishSuccess=img=>{
            if(settled)return;
            settled=true;
            if(stagger)clearTimeout(stagger);
            resolve(rememberRegionalTerrain16297(key,img));
          };
          const finishFailure=error=>{
            if(settled)return;
            last=error;failures++;
            if(sharedCtl.signal.aborted){settled=true;if(stagger)clearTimeout(stagger);reject(error);return;}
            if(!alternateStarted)startAlternate();
            else if(failures>=2){settled=true;if(stagger)clearTimeout(stagger);reject(last||new Error('open terrain tile unavailable'));}
          };
          const startAlternate=()=>{
            if(settled||alternateStarted)return;
            alternateStarted=true;
            fetchImageData(alternate,sharedCtl.signal).then(finishSuccess,finishFailure);
          };
          fetchImageData(primary,sharedCtl.signal).then(finishSuccess,finishFailure);
          stagger=setTimeout(startAlternate,2200);
        });
      }finally{
        clearTimeout(sharedTimer);
      }
    }).finally(()=>EARTHLINE_REGIONAL_TERRAIN_INFLIGHT_16297.delete(key));
    EARTHLINE_REGIONAL_TERRAIN_INFLIGHT_16297.set(key,shared);
    return earthlineAwaitTerrainShared17341(shared,signal);
  }
'''
s=s[:start]+new+s[end:]
s="<!-- EARTHLINE_SHARED_TERRAIN_SCHEDULER_17341: one bounded shared tile owner, per-caller abort deadlines, delayed alternate hedge; no source/science changes. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed shared terrain scheduler 17341")
