#!/usr/bin/env python3
"""Candidate-only 2026-11-28: prevent our rendered overlays from becoming no-build evidence.
Preserves actual base-style roads, buildings, mapped water, frozen per-run mask and all safety gates.
Only these two older displayed-style scans are changed; fail if either source anchor differs.
"""
from pathlib import Path
import hashlib

p = Path("index.html")
s = p.read_text(encoding="utf8")
marker = """        const ownedLayer=String(l&&l.id||'');"""
assert marker in s, "Newer pre-prescription exclusion scan must already be fixed"
before = [
    """      const ids=layers.filter(l=>{
        const tag=((l.id||"")+" "+(l["source-layer"]||"")).toLowerCase();""",
    """      return (style&&style.layers||[]).filter(l=>{
        const tag=((l.id||"")+" "+(l["source-layer"]||"")).toLowerCase();""",
]
after = [
    """      const ids=layers.filter(l=>{
        // Rendered Earthline water paths and bioswales are outputs, not infrastructure.
        const ownedLayer=String(l&&l.id||'');
        const ownedSource=String(l&&l.source||'');
        if(/^(?:earthline(?:[-_]|$)|el[-_])/i.test(ownedLayer)||
           /^(?:earthline(?:[-_]|$)|el[-_])/i.test(ownedSource))return false;
        const tag=((l.id||"")+" "+(l["source-layer"]||"")).toLowerCase();""",
    """      return (style&&style.layers||[]).filter(l=>{
        // Only external mapped features may veto a scientifically generated corridor.
        const ownedLayer=String(l&&l.id||'');
        const ownedSource=String(l&&l.source||'');
        if(/^(?:earthline(?:[-_]|$)|el[-_])/i.test(ownedLayer)||
           /^(?:earthline(?:[-_]|$)|el[-_])/i.test(ownedSource))return false;
        const tag=((l.id||"")+" "+(l["source-layer"]||"")).toLowerCase();""",
]
for i,(old,new) in enumerate(zip(before,after),1):
    n=s.count(old)
    assert n == 1, f"Anchor {i} expected once; found {n}"
    s=s.replace(old,new,1)
assert s.count("const ownedLayer=String(l&&l.id||'');")>=3, "Expected three independently guarded exclusion owners"
p.write_text(s,encoding="utf8")
print("CANDIDATE_POST_RENDER_FILTER_PATCH_APPLIED",hashlib.sha256(p.read_bytes()).hexdigest())
