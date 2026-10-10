#!/usr/bin/env python3
"""
Earthline Elder Trees — fast public 3DEP EPT point resolver.
OFF-PRODUCTION ONLY.

Resolves GPS coordinates against the persisted compact WGS84 project-bounds index.
This is a source-selection step, not yet a proof that point returns exist at the exact
coordinate; downstream EPT crop/read remains the final measured-LiDAR check.
"""
from __future__ import annotations
import argparse, json, math, re
from pathlib import Path

INDEX=Path("data/elder-trees/generated/us-national/usgs-ept-spatial-index.json")

def area(b):
    return max(0,b[2]-b[0])*max(0,b[3]-b[1])

def contains(b,lon,lat):
    return b[0] <= lon <= b[2] and b[1] <= lat <= b[3]

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--points",required=True,help="JSON array [{name,lon,lat}]")
    ap.add_argument("--out",required=True)
    args=ap.parse_args()
    if not INDEX.exists():raise RuntimeError(f"missing index {INDEX}")
    idx=json.loads(INDEX.read_text())
    pts=json.loads(Path(args.points).read_text())
    rows=[]
    for p in pts:
        lon=float(p["lon"]);lat=float(p["lat"])
        matches=[x for x in idx if contains(x["bbox_wgs84"],lon,lat)]
        matches.sort(key=lambda x:(
          -(x.get("year_hint") or 0),
          area(x["bbox_wgs84"]),
          -(int(x.get("points") or 0))
        ))
        selected=matches[0] if matches else None
        rows.append({
          "name":p["name"],"lon":lon,"lat":lat,
          "project_match_count":len(matches),
          "status":"EPT_PROJECT_BOUNDS_MATCH" if selected else "NO_EPT_PROJECT_BOUNDS_MATCH",
          "selected":{
            "prefix":selected.get("prefix"),
            "ept_url":selected.get("ept_url"),
            "year_hint":selected.get("year_hint"),
            "points":selected.get("points"),
            "bbox_wgs84":selected.get("bbox_wgs84")
          } if selected else None,
          "scientific_limit":"Project-bounds match only. Candidate becomes LiDAR-confirmed only after a bounded EPT crop/read returns usable local point-cloud evidence."
        })
    out=Path(args.out);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(rows,indent=2))
    print(json.dumps(rows,indent=2))

if __name__=="__main__":main()
