from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""      return await new Promise((resolve,reject)=>{
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
          if(signal&&signal.aborted){settled=true;if(stagger)clearTimeout(stagger);reject(error);return;}
          if(!alternateStarted)startAlternate();
          else if(failures>=2){settled=true;if(stagger)clearTimeout(stagger);reject(last||new Error('open terrain tile unavailable'));}
        };
        const startAlternate=()=>{
          if(settled||alternateStarted)return;
          alternateStarted=true;
          fetchImageData(alternate,signal).then(finishSuccess,finishFailure);
        };
        fetchImageData(primary,signal).then(finishSuccess,finishFailure);
        stagger=setTimeout(startAlternate,2500);
      });"""

new="""      return await new Promise((resolve,reject)=>{
        let settled=false,alternateStarted=false,failures=0,last=null,stagger=0;
        const primaryCtl17296=new AbortController(),alternateCtl17296=new AbortController();
        const parentAbort17296=()=>{
          const reason17296=signal?.reason instanceof Error?signal.reason:new Error('terrain tile aborted');
          try{primaryCtl17296.abort(reason17296)}catch(_){}
          try{alternateCtl17296.abort(reason17296)}catch(_){}
        };
        try{signal&&signal.addEventListener('abort',parentAbort17296,{once:true})}catch(_){}
        const cleanup17296=()=>{
          if(stagger)clearTimeout(stagger);
          try{signal&&signal.removeEventListener('abort',parentAbort17296)}catch(_){}
        };
        const finishSuccess=(img,source17296)=>{
          if(settled)return;
          settled=true;cleanup17296();
          if(source17296==='primary'){try{alternateCtl17296.abort(new Error('alternate terrain hedge lost race'))}catch(_){}}
          else{try{primaryCtl17296.abort(new Error('primary terrain hedge lost race'))}catch(_){}}
          resolve(rememberRegionalTerrain16297(key,img));
        };
        const finishFailure=error=>{
          if(settled)return;
          last=error;failures++;
          if(signal&&signal.aborted){settled=true;cleanup17296();reject(error);return;}
          if(!alternateStarted)startAlternate();
          else if(failures>=2){settled=true;cleanup17296();reject(last||new Error('open terrain tile unavailable'));}
        };
        const startAlternate=()=>{
          if(settled||alternateStarted)return;
          alternateStarted=true;
          fetchImageData(alternate,alternateCtl17296.signal).then(img=>finishSuccess(img,'alternate'),finishFailure);
        };
        fetchImageData(primary,primaryCtl17296.signal).then(img=>finishSuccess(img,'primary'),finishFailure);
        stagger=setTimeout(startAlternate,1100);
      });"""

n=s.count(old)
print("cancelled-hedge anchors",n)
if n!=1: raise SystemExit(f"cancelled hedge anchor {n}")
s=s.replace(old,new,1)
s="/* EARTHLINE_CANCELLED_TERRAIN_HEDGE_17296 — hedge alternate after 1.1s but abort losing fetch/decode path when either identical Terrarium source wins; terrain pixels/science unchanged. */\n"+s
p.write_text(s,encoding="utf-8")
print("17296 cancelled terrain hedge applied")
