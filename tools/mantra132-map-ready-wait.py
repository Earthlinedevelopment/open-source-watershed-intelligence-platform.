#!/usr/bin/env python3
"""M132: Mapbox map initialization race fix for Property exclusion evidence.
Wait briefly for real map object before existing readiness; NEVER assert verified
based on elapsed time, and never change science/mask/exclusion/source verdict.
"""
from pathlib import Path
import subprocess
p=Path("index.html")
s=p.read_text()
assert subprocess.check_output(["git","hash-object","index.html"],text=True).strip()=="26829330aed4b2042aedca5408c4583ea69a777c"
old='''async function earthlineWaitForMappedExclusionStyle15862B(myGen=M.searchGen,timeoutMs=5000){
  if(!earthlineMapActive())return {ready:false,status:"map-inactive",waitedMs:0};
  const started=performance.now();'''
new='''async function earthlineWaitForMappedExclusionStyle15862B(myGen=M.searchGen,timeoutMs=5000){
  /* M132: first-frame/GL context initialization is transient. Do not classify
     an uninitialized map as missing evidence without a bounded readiness wait.
     This does not accept any exclusion data or waive source verification. */
  const initializationStartM132=performance.now();
  while(!earthlineMapActive()&&performance.now()-initializationStartM132<Math.min(3000,timeoutMs)){
    if(typeof earthlineIsStale==="function"&&earthlineIsStale(myGen))
      return {ready:false,status:"stale-before-map-ready",waitedMs:Math.round(performance.now()-initializationStartM132)};
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  if(!earthlineMapActive())
    return {ready:false,status:"map-inactive",waitedMs:Math.round(performance.now()-initializationStartM132)};
  const started=performance.now();'''
assert s.count(old)==1,s.count(old)
s=s.replace(old,new,1)
assert 'const styleHasLayers=()=>{' in s
assert 'rejectSlopeAbove4M131' in s
assert 'reportAquiferContext123(baseData.d)' in s
p.write_text(s)
print('M132_MAP_INIT_RACE_FIXED_FAIL_CLOSED')
