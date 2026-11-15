#!/usr/bin/env python3
"""Build an isolated Earthline candidate without touching production index.html.
Must be run from a checkout of the exact candidate-elder-swale-aquifer-20261115 branch.
The output is not certified until syntax, map/browser, geographic and safety checks pass.
"""
from pathlib import Path
from hashlib import sha256
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "index.html"
OUTPUT = ROOT / "candidate-elder-swale-aquifer-20261115.html"
EXPECTED_GIT_BLOB = "a25fc2f7df75d63a96b095f0c8d2017d81623fb1"
PATCHES = [
    ("earthline-elder-restored-17097.js?v=mantra6-tree-20261113", "earthline-elder-restored-17097.js?v=elder-20261115-candidate"),
    ("      \"line-width\":[\"interpolate\",[\"linear\"],[\"zoom\"],12,1.25,15,1.75,16.5,2.20,18,2.65,20,3.10],\n      \"line-opacity\":1,\"line-blur\":0\n    }},beforeLegacy);", "      \"line-width\":[\"interpolate\",[\"linear\"],[\"zoom\"],12,1.65,15,2.35,16.5,3.00,18,3.55,20,4.20],\n      \"line-opacity\":1,\"line-blur\":0\n    }},beforeLegacy);"),
    ("      /* 16492: all aquifer language is the final annotation pass. Geometry stays\n         in its governed order; only text is moved above every analytical layer. */", "      /* Keep aquifer polygons contextual below existing swale display layers. */\n      const foregroundSwales = property ? [\n        \"earthline-living-swales-glow-15792\",\n        \"earthline-living-swales-earth-15792\",\n        \"earthline-living-swales-life-15792\",\n        \"earthline-property-swale-canopy-16166\",\n        \"earthline-property-swale-survey-16166\",\n        \"earthline-property-swale-ditch-16166\",\n        \"earthline-living-swales-water-15792\"\n      ] : [\n        \"earthline-ranked-swale-soil-15777\",\n        \"earthline-ranked-swale-plant-15777\",\n        \"earthline-ranked-swale-water-15777\"\n      ];\n      for(const id of foregroundSwales)\n        if(earthlineMap.getLayer(id))earthlineMap.moveLayer(id);\n      if(earthlineMap.getLayer(\"earthline-recharge-label\"))\n        earthlineMap.moveLayer(\"earthline-recharge-label\");\n      /* 16492: all aquifer language is the final annotation pass. Geometry stays\n         in its governed order; only text is moved above every analytical layer. */"),
    ("    const ordered=swales.slice().sort((a,b)=>\n      (Number(!!b.primaryFlowFirst15836)-Number(!!a.primaryFlowFirst15836)) ||", "    /* Prefer eligible corridors actually on evidenced mapped aquifer polygons.\n       Never fabricate aquifer coverage. Physical exclusions and safety remain\n       upstream and unchanged. No mapped polygons means the original order. */\n    const mappedAquifersM2026=Array.isArray(M.usgsAquifers)\n      ?M.usgsAquifers.filter(poly=>Array.isArray(poly?.pts)&&poly.pts.length>=3)\n      :[];\n    const aquiferPriorityCacheM2026=new WeakMap();\n    function mappedAquiferFractionM2026(sw){\n      if(!mappedAquifersM2026.length||!sw||!Array.isArray(sw.pts)||!sw.pts.length)return 0;\n      if(aquiferPriorityCacheM2026.has(sw))return aquiferPriorityCacheM2026.get(sw);\n      let inside=0,tested=0;\n      const step=Math.max(1,Math.floor(sw.pts.length/12));\n      for(let i=0;i<sw.pts.length;i+=step){\n        const p=sw.pts[i];if(!Array.isArray(p)||!Number.isFinite(p[0])||!Number.isFinite(p[1]))continue;\n        tested++;\n        for(const poly of mappedAquifersM2026){\n          const pts=poly.pts;let hit=false;\n          for(let j=0,k=pts.length-1;j<pts.length;k=j++){\n            const a=pts[j],b=pts[k];\n            if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/((b[1]-a[1])||1e-9)+a[0])hit=!hit;\n          }\n          if(hit){inside++;break;}\n        }\n      }\n      const fraction=tested?inside/tested:0;\n      aquiferPriorityCacheM2026.set(sw,fraction);\n      return fraction;\n    }\n    const ordered=swales.slice().sort((a,b)=>\n      (mappedAquiferFractionM2026(b)-mappedAquiferFractionM2026(a)) ||\n      (Number(!!b.primaryFlowFirst15836)-Number(!!a.primaryFlowFirst15836)) ||"),
]

def main():
    current = subprocess.check_output(["git", "hash-object", str(SOURCE)], text=True).strip()
    if current != EXPECTED_GIT_BLOB:
        raise SystemExit(f"REFUSED: wrong source blob {current}; expected {EXPECTED_GIT_BLOB}")
    source = SOURCE.read_text(encoding="utf-8")
    target = source
    for number, (old, new) in enumerate(PATCHES, 1):
        if target.count(old) != 1:
            raise SystemExit(f"REFUSED: patch {number} anchor count {target.count(old)}, expected 1")
        target = target.replace(old, new, 1)
    OUTPUT.write_text(target, encoding="utf-8")
    assert SOURCE.read_text(encoding="utf-8") == source
    print("Candidate output:", OUTPUT)
    print("Source SHA-256:", sha256(source.encode()).hexdigest())
    print("Candidate SHA-256:", sha256(target.encode()).hexdigest())
    print("Patch count:", len(PATCHES))
    print("NO PRODUCTION FILE MODIFIED. NOT CONNECTED-TEST CERTIFIED.")
if __name__ == "__main__":
    main()
