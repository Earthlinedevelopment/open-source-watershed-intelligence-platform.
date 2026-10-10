#!/usr/bin/env python3
"""
Earthline Elder Trees — Northern Europe area smoke test.
OFF-PRODUCTION ONLY. Covers the full UN M49 Northern Europe batch.

Tests one UN M49 Northern Europe country/area per invocation:
- actual CHMv2 coverage
- sparse Elder Tree candidate generation on geographically distributed tiles
- basic structural sanity / provenance

No output is a verified Elder Tree.
"""
from __future__ import annotations
import argparse, json, statistics, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from chmv2_candidate_worker import process

COVERAGE=Path("data/elder-trees/generated/global/international-chmv2-coverage.json")
QUEUE=Path("data/elder-trees/generated/global/global-country-chmv2-tile-queue.json")
ACTUAL=Path("data/elder-trees/generated/global/chmv2-actual-tiles.json")

UN_NORTHERN_EUROPE={
  "ALA":"Åland Islands",
  "DNK":"Denmark",
  "EST":"Estonia",
  "FRO":"Faroe Islands",
  "FIN":"Finland",
  "GGY":"Guernsey",
  "ISL":"Iceland",
  "IRL":"Ireland",
  "IMN":"Isle of Man",
  "JEY":"Jersey",
  "LVA":"Latvia",
  "LTU":"Lithuania",
  "NOR":"Norway",
  "SJM":"Svalbard and Jan Mayen",
  "SWE":"Sweden",
  "GBR":"United Kingdom"
}

def load(path):
    if not path.exists():
        raise RuntimeError(f"missing persisted source: {path}")
    return json.loads(path.read_text())

def pick_evenly(items,n):
    items=sorted(set(items))
    if len(items)<=n:return items
    if n<=1:return [items[len(items)//2]]
    idx=[round(i*(len(items)-1)/(n-1)) for i in range(n)]
    out=[]
    for i in idx:
        if items[i] not in out:out.append(items[i])
    return out

def stats_from_features(features):
    hs=[float(f["properties"].get("height_m")) for f in features if f.get("properties",{}).get("height_m") is not None]
    es=[float(f["properties"].get("emergent_height_m")) for f in features if f.get("properties",{}).get("emergent_height_m") is not None]
    ss=[float(f["properties"].get("structure_score")) for f in features if f.get("properties",{}).get("structure_score") is not None]
    return {
      "count":len(features),
      "height_m":{
        "min":round(min(hs),2) if hs else None,
        "median":round(statistics.median(hs),2) if hs else None,
        "max":round(max(hs),2) if hs else None
      },
      "emergent_height_m":{
        "median":round(statistics.median(es),2) if es else None,
        "max":round(max(es),2) if es else None
      },
      "structure_score":{
        "median":round(statistics.median(ss),2) if ss else None,
        "max":round(max(ss),2) if ss else None
      }
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--iso3",required=True)
    ap.add_argument("--out",required=True)
    ap.add_argument("--max-success-tiles",type=int,default=3)
    ap.add_argument("--max-attempts",type=int,default=10)
    ap.add_argument("--max-candidates",type=int,default=12)
    args=ap.parse_args()
    iso=args.iso3.upper()
    if iso not in UN_NORTHERN_EUROPE:
        raise SystemExit(f"{iso} is not in Earthline's UN M49 Northern Europe batch")

    coverage=load(COVERAGE)
    queue=load(QUEUE)
    actual=set(load(ACTUAL))

    crow=next((x for x in coverage if x.get("iso3")==iso),None)
    qrow=next((x for x in queue if x.get("iso3")==iso),None)
    assigned=(qrow or {}).get("quadkeys") or []
    available=sorted(q for q in assigned if q in actual)

    # Distributed first pass; if it is sparse, try more distributed tiles.
    attempts=pick_evenly(available,min(args.max_attempts,len(available))) if available else []
    tile_results=[]
    all_features=[]
    successful=0

    for q in attempts:
        try:
            feats,meta=process(q,max_candidates=args.max_candidates,coarse_size=512)
            meta=dict(meta)
            meta["feature_stats"]=stats_from_features(feats)
            tile_results.append(meta)
            if meta.get("status")=="OK" and feats:
                successful+=1
                all_features.extend(feats)
                if successful>=args.max_success_tiles:
                    break
        except Exception as e:
            tile_results.append({"quadkey":q,"status":"ERROR","error":str(e)})

    # Basic hard sanity: modeled canopy heights must stay inside the worker's scientific bounds.
    heights=[float(f["properties"]["height_m"]) for f in all_features if f.get("properties",{}).get("height_m") is not None]
    bad_height=[h for h in heights if h<5 or h>80]

    if not available:
        verdict="NO_CHMV2_SOURCE"
    elif successful>0 and not bad_height:
        verdict="PASS_CANDIDATE_GENERATION"
    elif successful==0:
        verdict="SOURCE_PRESENT_NO_CANOPY_IN_SMOKE_TILES"
    else:
        verdict="FAIL_SANITY"

    result={
      "mode":"off-production",
      "region_standard":"UN M49 Northern Europe",
      "iso3":iso,
      "name":UN_NORTHERN_EUROPE[iso],
      "coverage_record":crow,
      "boundary_tile_count":len(assigned),
      "actual_chmv2_tile_count":len(available),
      "attempted_tile_count":len(tile_results),
      "successful_candidate_tile_count":successful,
      "candidate_count":len(all_features),
      "candidate_stats":stats_from_features(all_features),
      "verdict":verdict,
      "bad_height_count":len(bad_height),
      "tile_results":tile_results,
      "scientific_boundary":"All generated points are modeled Elder Tree Candidates only; no point is verified by this smoke test."
    }

    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    (out/f"{iso.lower()}-northern-europe-smoke.json").write_text(json.dumps(result,indent=2,ensure_ascii=False))
    (out/f"{iso.lower()}-northern-europe-candidates.geojson").write_text(json.dumps({
      "type":"FeatureCollection","features":all_features
    },indent=2,ensure_ascii=False))
    print(json.dumps(result,indent=2,ensure_ascii=False))

if __name__=="__main__":
    main()
