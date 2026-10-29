from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
locked="const thr=streamThreshold(),chanThr=Math.max(thr*3.2,Number(M.maxAcc||0)*0.06),maxS=4;"
if locked not in s:
    raise SystemExit("locked <=4% active Property science missing")

old="    const ok=visibleLayers.length===Object.keys(SAFE_LAYERS_16221).length; /* EARTHLINE M78 — safe source + all safe layers visible owns presentation; queryRenderedFeatures may be zero before next paint. */"
new="    const ok=visibleLayers.length===Object.keys(SAFE_LAYERS_16221).length&&renderedFeatures17181>0; /* Visible means actual rendered safe geometry, not merely existing layers. */"
if s.count(old)!=1:
    raise SystemExit(f"safe visibility anchor count {s.count(old)}")
s=s.replace(old,new,1)

old2="""  function scheduleSafePropertyFallback16221(reason='scheduled'){
    /* EARTHLINE 17670 — deterministic presentation. No retry ladder. */
    return syncSafePropertyFallback16221(reason);
  }
  async function verifySafePropertyFallback16221(count){
    if(!(count>0))return {ok:true,count:0,visible:false,required:false,pending:false};
    const first=syncSafePropertyFallback16221('terminal-atomic-17670');
    return {...first,required:true,pending:false};
  }"""
new2="""  let safePropertySettleToken=0;
  function scheduleSafePropertyFallback16221(reason='scheduled'){
    const token=++safePropertySettleToken,mp=map();
    let last=null;
    const run=label=>{
      if(token!==safePropertySettleToken)return last;
      last=syncSafePropertyFallback16221(reason+':'+label);
      if(last?.ok)safePropertySettleToken++;
      return last;
    };
    run('immediate');
    if(last?.ok)return last;
    for(const delay of [80,220,520,1000])setTimeout(()=>run('delay-'+delay),delay);
    try{mp?.once?.('style.load',()=>run('style-load'));mp?.once?.('idle',()=>run('idle'))}catch(_){}
    return last||{ok:false,pending:true};
  }
  async function verifySafePropertyFallback16221(count){
    if(!(count>0))return {ok:true,count:0,visible:false,required:false,pending:false};
    const first=syncSafePropertyFallback16221('terminal-atomic');
    if(first?.ok)return {...first,required:true,pending:false};
    scheduleSafePropertyFallback16221('terminal-settle');
    return {...first,required:true,pending:true};
  }"""
if s.count(old2)!=1:
    raise SystemExit(f"safe schedule block count {s.count(old2)}")
s=s.replace(old2,new2,1)
p.write_text(s,encoding="utf-8")
print("corrected verified-safe Property publication")

# trigger isolated repair workflow
