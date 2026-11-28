#!/usr/bin/env python3
"""Candidate-only cold Mapbox readiness safety repair.

The old wait-for-exclusions function returned immediately if Mapbox had not
yet raised earthlineMapReady on the first Property run. This prematurely
disqualified its local road/water/structure sources and forced remote fallback.
Always wait the existing bounded 5 seconds for exact style source readiness;
keep every fail-closed evidence verdict unchanged.
"""
from pathlib import Path
import hashlib

p=Path("index.html")
s=p.read_text(encoding="utf8")
old='''async function earthlineWaitForMappedExclusionStyle15862B(myGen=M.searchGen,timeoutMs=5000){
  if(!earthlineMapActive())return {ready:false,status:"map-inactive",waitedMs:0};
  const started=performance.now();'''
new='''async function earthlineWaitForMappedExclusionStyle15862B(myGen=M.searchGen,timeoutMs=5000){
  // Cold map startup is a reason to WAIT, not proof that exclusions are absent.
  // The existing bounded poll still fails closed if required map sources do not load.
  const started=performance.now();'''
assert s.count(old)==1, f"Expected one exact readiness owner, got {s.count(old)}"
assert 'all-attempted-open-data-exclusion-sources-failed' in s
s=s.replace(old,new,1)
assert 'if(!readiness.ready)' in s and 'earthlineSetVectorVerification16343' in s, "Fail-closed owner missing"
p.write_text(s,encoding="utf8")
print("EARTHLINE_COLD_STYLE_WAIT_REPAIR",hashlib.sha256(p.read_bytes()).hexdigest())
