#!/usr/bin/env python3
"""
Earthline Elder Trees — actual international CHMv2 coverage matrix.
OFF-PRODUCTION ONLY.

Joins:
- actual CHMv2 quadkeys
- country/territory quadkey queue

Produces a jurisdiction-by-jurisdiction source-availability matrix.
"""
from __future__ import annotations
import json, sys
from pathlib import Path

TILES=Path("data/elder-trees/generated/global/chmv2-actual-tiles.json")
QUEUE=Path("data/elder-trees/generated/global/global-country-chmv2-tile-queue.json")

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-global-coverage")
    out.mkdir(parents=True,exist_ok=True)
    if not TILES.exists():raise RuntimeError(f"missing {TILES}")
    if not QUEUE.exists():raise RuntimeError(f"missing {QUEUE}")
    actual=set(json.loads(TILES.read_text()))
    countries=json.loads(QUEUE.read_text())
    rows=[]
    for c in countries:
        assigned=c.get("quadkeys") or []
        live=sorted(q for q in assigned if q in actual)
        rows.append({
          "iso3":c.get("iso3"),"name":c.get("name"),
          "boundary_tile_count":len(assigned),
          "actual_chmv2_tile_count":len(live),
          "status":"CHMV2_CANDIDATE_SOURCE_PRESENT" if live else "NO_CHMV2_TILE_INTERSECTION",
          "sample_quadkeys":live[:8],
          "scientific_rule":"CHMv2 availability permits modeled ELDER_TREE_CANDIDATE research only; not verified Elder Trees."
        })
    rows.sort(key=lambda x:x["name"] or "")
    summary={
      "mode":"off-production",
      "country_boundary_feature_count":len(rows),
      "features_with_actual_chmv2":sum(x["actual_chmv2_tile_count"]>0 for x in rows),
      "features_without_actual_chmv2":sum(x["actual_chmv2_tile_count"]==0 for x in rows),
      "actual_global_tile_count":len(actual),
      "priority":{
        name:next((x for x in rows if (x.get("name") or "").lower()==name.lower()),None)
        for name in ["Thailand","Laos","Vietnam","United Kingdom","United States of America"]
      }
    }
    (out/"international-chmv2-coverage.json").write_text(json.dumps(rows,indent=2))
    (out/"international-chmv2-coverage-summary.json").write_text(json.dumps(summary,indent=2))
    print(json.dumps(summary,indent=2))

if __name__=="__main__":main()
