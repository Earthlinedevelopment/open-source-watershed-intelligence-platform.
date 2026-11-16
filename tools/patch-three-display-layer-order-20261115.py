#!/usr/bin/env python3
"""One display-only change, applied to the exact frozen production HTML blob."""
from pathlib import Path
import subprocess

p=Path("index.html")
expected="a25fc2f7df75d63a96b095f0c8d2017d81623fb1"
actual=subprocess.check_output(["git","hash-object",str(p)],text=True).strip()
if actual!=expected: raise SystemExit(f"REFUSED unexpected source blob: {actual}")
s=p.read_text(encoding="utf-8")
old='''      /* 16492: all aquifer language is the final annotation pass. Geometry stays
         in its governed order; only text is moved above every analytical layer. */'''
new='''      /* Show accepted swale strokes over aquifer polygons; restore recharge
         and well evidence above swales. Display order only, no science edits. */
      const swaleFrontM2026 = property ? [
        "earthline-living-swales-glow-15792",
        "earthline-living-swales-earth-15792",
        "earthline-living-swales-life-15792",
        "earthline-property-swale-canopy-16166",
        "earthline-property-swale-survey-16166",
        "earthline-property-swale-ditch-16166",
        "earthline-living-swales-water-15792"
      ] : [
        "earthline-ranked-swale-soil-15777",
        "earthline-ranked-swale-plant-15777",
        "earthline-ranked-swale-water-15777"
      ];
      for (const layerIdM2026 of swaleFrontM2026)
        if (earthlineMap.getLayer(layerIdM2026)) earthlineMap.moveLayer(layerIdM2026);
      for (const layerIdM2026 of [
        "earthline-recharge-line",
        "earthline-recharge-highlight",
        "earthline-recharge-label",
        "earthline-aquifer-wells-16398"
      ]) if (earthlineMap.getLayer(layerIdM2026)) earthlineMap.moveLayer(layerIdM2026);
      /* 16492: all aquifer language is the final annotation pass. Geometry stays
         in its governed order; only text is moved above every analytical layer. */'''
if s.count(old)!=1: raise SystemExit(f"REFUSED nonunique insertion point: {s.count(old)}")
p.write_text(s.replace(old,new,1),encoding="utf-8")
print("Display-only aquifer/swale layer ordering patched")
