#!/usr/bin/env python3
"""Fail-exactly-once source-ownership repair for the final Property clearance index."""
from pathlib import Path
p = Path("index.html")
src = p.read_text(encoding="utf-8")
needle = """  function relevantStyleLayers(){
    try{
      const style=earthlineMap&&earthlineMap.getStyle&&earthlineMap.getStyle();
      return (style&&style.layers||[]).filter(l=>{
        const tag="""
replacement = """  function relevantStyleLayers(){
    try{
      const style=earthlineMap&&earthlineMap.getStyle&&earthlineMap.getStyle();
      return (style&&style.layers||[]).filter(l=>{
        /* Generated swales and modeled water are map OUTPUT, never exclusion INPUT.
           The primary map-vector exclusion pass already makes this distinction.
           Mirror that exact source-owner rule in the final 15788 clearance pass. */
        const ownedLayer=String(l&&l.id||'');
        const ownedSource=String(l&&l.source||'');
        if(/^(?:earthline(?:[-_]|$)|el[-_])/i.test(ownedLayer)||
           /^(?:earthline(?:[-_]|$)|el[-_])/i.test(ownedSource))return false;
        const tag="""
if src.count(needle) != 1:
    if replacement in src:
        print("Final exclusion index already patched; no change")
        raise SystemExit(0)
    raise SystemExit("FAIL CLOSED: Expected unique final exclusion-index code")
amended = src.replace(needle, replacement, 1)
assert amended.count("  function relevantStyleLayers(){") == 1
assert amended.count("  function exclusionIndex15788(force=false){") == 1
assert amended.count("  function earthlineFrozenPropertyClearanceAudit16255(collection){") == 1
p.write_text(amended, encoding="utf-8")
print(f"Fixed final-index output ownership: {len(src)} -> {len(amended)} characters")
