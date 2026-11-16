#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

file = Path("index.html")
expected_blob = "a25fc2f7df75d63a96b095f0c8d2017d81623fb1"
actual_blob = subprocess.check_output(["git","hash-object",str(file)],text=True).strip()
if actual_blob != expected_blob:
    sys.exit(f"ABORT: wrong HTML baseline {actual_blob}")
old = """    const intLat16556=Number(chosen.properties&&chosen.properties.INTPTLAT),intLng16556=Number(chosen.properties&&chosen.properties.INTPTLON);
    const geometryCenter16556=(Number.isFinite(intLat16556)&&Number.isFinite(intLng16556))
      ?[intLng16556,intLat16556]:earthlineInteriorPoint16556(chosen.geometry,geometryBounds16556);"""
new = """    /* M89: Number(null) is 0. A generalized Census state without an INTPT field
       must never silently relocate its analytical center to the Gulf of Guinea. */
    const rawLatM89=chosen.properties&&chosen.properties.INTPTLAT;
    const rawLngM89=chosen.properties&&chosen.properties.INTPTLON;
    const intLat16556=rawLatM89==null||String(rawLatM89).trim()===''?NaN:Number(rawLatM89);
    const intLng16556=rawLngM89==null||String(rawLngM89).trim()===''?NaN:Number(rawLngM89);
    const geometryCenter16556=(Number.isFinite(intLat16556)&&Number.isFinite(intLng16556)&&
      earthlinePointInJurisdiction16539([intLng16556,intLat16556],chosen.geometry))
      ?[intLng16556,intLat16556]:earthlineInteriorPoint16556(chosen.geometry,geometryBounds16556);"""
source = file.read_text(encoding="utf-8")
if source.count(old) != 1 or "rawLatM89" in source:
    sys.exit("ABORT: source mismatch or patch already present")
patched = source.replace(old,new)
if patched.replace(new,old) != source:
    sys.exit("ABORT: non-atomic patch")
file.write_text(patched,encoding="utf-8")
print("M89_REPAIR_EXACT_ONE_HUNK",len(new)-len(old))
