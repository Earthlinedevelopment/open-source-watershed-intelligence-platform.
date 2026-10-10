#!/usr/bin/env python3
"""
Earthline Elder Trees — global source registry.
OFF-PRODUCTION ONLY.

Creates a country/territory queue for Elder Tree work.
Individual GPS candidate generation is enabled only where an authoritative
high-resolution source has been independently identified.

Global GEDI / 10 m canopy products are screening evidence only.
"""
from __future__ import annotations
import json, sys
from pathlib import Path
import pycountry

METHOD="earthline-elder-tree-global-registry-v0.1"

DEFAULT={
  "point_status":"CHMV2_RESEARCH_CANDIDATE_IF_TILE_AVAILABLE",
  "point_generation_allowed":True,
  "publication_allowed":False,
  "preferred_point_source":"WRI/Meta CHMv2 modeled sub-meter canopy height unless a higher-confidence national LiDAR source is available",
  "screening_sources":[
    "WRI/Meta CHMv2 for modeled individual-candidate research where tiles exist",
    "NASA GEDI L2A canopy structure for coarse structural context",
    "Open global Sentinel-2/GEDI canopy-height products for coarse structural context"
  ],
  "scientific_rule":"CHMv2 may emit ELDER_TREE_CANDIDATE research points after positional calibration, but never verified Elder Trees. Coarse GEDI/10 m products still cannot emit individual-tree GPS points."
}

OVERRIDES={
  "GB":{
    "point_status":"REGIONAL_HIGH_RES_SOURCES",
    "point_generation_allowed":True,
    "sources":[
      {
        "region":"England",
        "provider":"Environment Agency",
        "dataset":"National LIDAR Programme DSM/DTM",
        "resolution":"1 m composite",
        "access":"open",
        "role":"individual candidate generation + ATI calibration"
      }
    ],
    "verified_inventory":[
      {"region":"England","provider":"Woodland Trust","dataset":"Ancient Tree Inventory","role":"verified external GPS reference"}
    ],
    "constraint":"Point generation is authorized for England coverage already tested. Wales, Scotland and Northern Ireland require their own source audits before national UK completion."
  },
  "FR":{
    "point_status":"POINT_CAPABLE_NATIONAL_PROGRAM",
    "point_generation_allowed":True,
    "sources":[
      {
        "provider":"IGN",
        "dataset":"LiDAR HD",
        "resolution":"~10 points/m² target; classified point cloud plus DTM/DSM/height products",
        "access":"open data",
        "coverage":"France-wide program excluding Guyane; processing/publication still completing in 2026"
      }
    ]
  },
  "ES":{
    "point_status":"POINT_CAPABLE_NATIONAL_PROGRAM",
    "point_generation_allowed":True,
    "sources":[
      {
        "provider":"IGN/CNIG",
        "dataset":"PNOA-LiDAR",
        "resolution":"3rd coverage 5 points/m²; 0.5 m DSM products",
        "access":"downloadable national data",
        "coverage":"national cycles"
      }
    ]
  },
  "NL":{
    "point_status":"POINT_CAPABLE_NATIONAL",
    "point_generation_allowed":True,
    "sources":[
      {
        "provider":"AHN / PDOK",
        "dataset":"Actueel Hoogtebestand Nederland",
        "resolution":"point clouds + high-resolution raster elevation",
        "access":"open data",
        "coverage":"national"
      }
    ]
  },
  "FI":{
    "point_status":"POINT_CAPABLE_NATIONAL",
    "point_generation_allowed":True,
    "sources":[
      {
        "provider":"National Land Survey of Finland",
        "dataset":"Laser scanning data 0.5 p",
        "resolution":"0.5 points/m² open derivative; historic 2008–2019 dataset covers all Finland",
        "access":"open data CC BY 4.0",
        "coverage":"nationwide historic open dataset; newer program partial/open derivative"
      }
    ]
  },
  "NZ":{
    "point_status":"POINT_CAPABLE_COMPOSITE",
    "point_generation_allowed":True,
    "sources":[
      {
        "provider":"Land Information New Zealand",
        "dataset":"New Zealand LiDAR 1m DSM + 1m DEM",
        "resolution":"1 m",
        "access":"CC BY",
        "coverage":"national composite where LiDAR acquisitions exist"
      }
    ]
  },
  "CH":{
    "point_status":"POINT_CAPABLE_PARTIAL_CURRENT",
    "point_generation_allowed":True,
    "sources":[
      {
        "provider":"swisstopo",
        "dataset":"swissSURFACE3D / swissSURFACE3D Raster",
        "resolution":"high-resolution LiDAR-derived surface products",
        "access":"open geodata",
        "coverage":"published areas; continuing updates"
      }
    ],
    "constraint":"AOI must intersect published swissSURFACE3D coverage."
  },
  "TH":{
    "point_status":"PARTIAL_LIDAR_SOURCE_AUDIT",
    "point_generation_allowed":True,
    "publication_allowed":False,
    "preferred_point_source":"CHMv2 research candidates now; Thai LiDAR refinement after AOI source verification",
    "sources":[
      {
        "provider":"Thailand government open-data sources",
        "dataset":"regional LiDAR/DTM surveys",
        "coverage":"partial",
        "constraint":"Underlying downloadable terrain/point data and license must be verified per AOI before point generation."
      }
    ],
    "priority":"EARTHLINE_ROLLOUT"
  },
  "LA":{
    "point_status":"CHMV2_RESEARCH_CANDIDATE_IF_TILE_AVAILABLE",
    "point_generation_allowed":True,
    "publication_allowed":False,
    "priority":"EARTHLINE_ROLLOUT"
  },
  "VN":{
    "point_status":"CHMV2_RESEARCH_CANDIDATE_IF_TILE_AVAILABLE",
    "point_generation_allowed":True,
    "publication_allowed":False,
    "priority":"EARTHLINE_ROLLOUT"
  }
}

def rec(country):
    code=country.alpha_2
    base={
      "iso2":code,"iso3":country.alpha_3,"name":country.name,
      "method_version":METHOD,
      **DEFAULT
    }
    ov=OVERRIDES.get(code)
    if ov:
        base.update(ov)
    if code in ("TH","LA","VN"):
        base["priority"]="EARTHLINE_ROLLOUT"
    return base

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-global-registry")
    out.mkdir(parents=True,exist_ok=True)
    countries=sorted((rec(c) for c in pycountry.countries),key=lambda x:x["name"])
    summary={
      "mode":"off-production",
      "method_version":METHOD,
      "country_territory_count":len(countries),
      "point_generation_enabled_count":sum(bool(x["point_generation_allowed"]) for x in countries),
      "screening_only_or_audit_count":sum(not bool(x["point_generation_allowed"]) for x in countries),
      "earthline_rollout":[x for x in countries if x.get("priority")=="EARTHLINE_ROLLOUT"],
      "rules":[
        "GPS point output only when source resolution supports an individual tree.",
        "Verified external points remain distinct from Earthline remote-sensing candidates.",
        "GEDI footprints and 10 m canopy-height cells are not individual Elder Trees.",
        "Every point retains source, method, date/coverage metadata and verification status."
      ]
    }
    (out/"international-elder-tree-source-registry.json").write_text(json.dumps(countries,indent=2))
    (out/"international-elder-tree-source-summary.json").write_text(json.dumps(summary,indent=2))
    print(json.dumps(summary,indent=2))

if __name__=="__main__": main()
