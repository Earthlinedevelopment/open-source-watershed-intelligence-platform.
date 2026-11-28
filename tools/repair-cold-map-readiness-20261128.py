#!/usr/bin/env python3
"""Bounded Mapbox initialization wait before existing exclusion-source readiness audit."""
from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf8')
old='''async function earthlineWaitForMappedExclusionStyle15862B(myGen=M.searchGen,timeoutMs=5000){
  if(!earthlineMapActive())return {ready:false,status:"map-inactive",waitedMs:0};
  const started=performance.now();'''
new='''async function earthlineWaitForMappedExclusionStyle15862B(myGen=M.searchGen,timeoutMs=5000){
  const started=performance.now();
  /* Cold Property starts can reach the exclusion owner before Mapbox fires its
     initial load flag. Waiting for that flag is not permission to omit mapped
     evidence. Preserve the existing source checks and fail closed on timeout. */
  if(!earthlineMapActive()){
    const maxWaitMs=Math.max(500,Math.min(6000,Number(timeoutMs)||5000));
    while(!earthlineMapActive()&&performance.now()-started<maxWaitMs){
      if(typeof earthlineIsStale==="function"&&earthlineIsStale(myGen))
        return {ready:false,status:"stale-before-map-initialization",waitedMs:Math.round(performance.now()-started)};
      await new Promise(r=>setTimeout(r,100));
    }
    if(!earthlineMapActive())
      return {ready:false,status:"map-initialization-timeout",waitedMs:Math.round(performance.now()-started)};
  }'''
assert s.count(old)==1,'FAIL CLOSED: exact existing map-readiness owner changed'
out=s.replace(old,new,1)
assert out.count('async function earthlineWaitForMappedExclusionStyle15862B(')==1
assert out.count('status:"map-initialization-timeout"')==1
assert out.count('status:"style-ready"')>=0 # existing source check untouched
p.write_text(out,encoding='utf8')
print('Bounded initialization wait added without changing masks, sources, or exclusion rules.')
