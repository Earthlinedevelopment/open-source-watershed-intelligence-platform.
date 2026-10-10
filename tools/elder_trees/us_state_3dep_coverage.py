#!/usr/bin/env python3
"""
Earthline Elder Trees — exact U.S. 3DEP state/territory coverage matrix.
OFF-PRODUCTION ONLY.

Uses:
- USGS WESM GeoPackage (current work-unit polygons)
- U.S. Census Bureau cartographic state/territory boundaries

Produces exact spatial intersection assignments. No tree candidates are generated here.
"""
from __future__ import annotations
import json, sys, tempfile, zipfile
from pathlib import Path
import requests
import geopandas as gpd
import pandas as pd

WESM_GPKG="https://rockyweb.usgs.gov/vdelivery/Datasets/Staged/Elevation/metadata/WESM.gpkg"
CENSUS_ZIP="https://www2.census.gov/geo/tiger/GENZ2025/shp/cb_2025_us_state_500k.zip"
UA={"User-Agent":"Earthline-ElderTree-Research/0.9"}

def dl(url,path):
    r=requests.get(url,headers=UA,timeout=300)
    r.raise_for_status()
    path.write_bytes(r.content)
    return r.url

def norm_ql(v):
    if v is None: return None
    s=str(v).strip().upper().replace("QL","").strip()
    try: return float(s)
    except: return None

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-us-coverage")
    out.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        td=Path(td)
        gpkg=td/"wesm.gpkg"; z=td/"states.zip"
        dl(WESM_GPKG,gpkg); dl(CENSUS_ZIP,z)
        with zipfile.ZipFile(z) as zz: zz.extractall(td/"states")

        layers=gpd.io.file.fiona.listlayers(gpkg)
        if not layers: raise RuntimeError("WESM geopackage has no layers")
        wesm=gpd.read_file(gpkg,layer=layers[0])
        shp=next((td/"states").glob("*.shp"))
        states=gpd.read_file(shp)

        needed=["STUSPS","NAME","GEOID"]
        if not all(x in states.columns for x in needed):
            raise RuntimeError("Census state boundary fields missing")
        if wesm.crs is None: raise RuntimeError("WESM CRS missing")
        states=states.to_crs(wesm.crs)

        # Only WESM polygons with valid geometry.
        wesm=wesm[wesm.geometry.notnull() & ~wesm.geometry.is_empty].copy()
        # spatial join can assign coastal/edge work units to multiple jurisdictions; that is expected.
        joined=gpd.sjoin(
          wesm,
          states[["STUSPS","NAME","GEOID","geometry"]],
          how="inner",
          predicate="intersects"
        )

        records=[]
        for _,row in joined.iterrows():
            records.append({
              "state_code":row["STUSPS"],
              "state_name":row["NAME"],
              "geoid":row["GEOID"],
              "workunit":row.get("workunit"),
              "workunit_id":row.get("workunit_id"),
              "project":row.get("project"),
              "project_id":row.get("project_id"),
              "ql":row.get("ql"),
              "collect_start":str(row.get("collect_start")) if row.get("collect_start") is not None else None,
              "collect_end":str(row.get("collect_end")) if row.get("collect_end") is not None else None,
              "lpc_category":row.get("lpc_category"),
              "lpc_reason":row.get("lpc_reason"),
              "lpc_link":row.get("lpc_link"),
              "metadata_link":row.get("metadata_link")
            })

        by_state=[]
        for _,s in states.sort_values("STUSPS").iterrows():
            code=s["STUSPS"]; name=s["NAME"]
            subset=[r for r in records if r["state_code"]==code]
            units={(r["workunit_id"] or r["workunit"]) for r in subset}
            projects={(r["project_id"] or r["project"]) for r in subset}
            qls=[norm_ql(r["ql"]) for r in subset]
            qls=[q for q in qls if q is not None]
            lpc=[r for r in subset if r.get("lpc_link")]
            good=[r for r in subset if (norm_ql(r.get("ql")) is not None and norm_ql(r.get("ql"))<=2 and r.get("lpc_link"))]
            by_state.append({
              "code":code,"name":name,
              "workunit_count":len(units),
              "project_count":len(projects),
              "lpc_linked_workunit_count":len({r["workunit_id"] or r["workunit"] for r in lpc}),
              "ql2_or_better_lpc_workunit_count":len({r["workunit_id"] or r["workunit"] for r in good}),
              "best_ql":min(qls) if qls else None,
              "candidate_pipeline_status":"POINT_CAPABLE_3DEP" if good else ("3DEP_PRESENT_REVIEW" if subset else "NO_WESM_INTERSECTION")
            })

        summary={
          "mode":"off-production",
          "wesm_layer":layers[0],
          "wesm_workunit_geometry_count":int(len(wesm)),
          "intersection_record_count":len(records),
          "jurisdiction_count":len(by_state),
          "point_capable_jurisdiction_count":sum(x["candidate_pipeline_status"]=="POINT_CAPABLE_3DEP" for x in by_state),
          "sources":{"wesm":WESM_GPKG,"census_states":CENSUS_ZIP},
          "rule":"POINT_CAPABLE_3DEP means at least one intersecting QL2-or-better work unit with an LPC link; it does not mean 100% statewide coverage."
        }
        (out/"us-state-3dep-coverage.json").write_text(json.dumps(by_state,indent=2,default=str))
        (out/"us-state-3dep-intersections.ndjson").write_text("\n".join(json.dumps(x,default=str) for x in records)+"\n")
        (out/"us-state-3dep-coverage-summary.json").write_text(json.dumps(summary,indent=2))
        print(json.dumps(summary,indent=2))
        print("STATE_MATRIX")
        for x in by_state:
            print(f'{x["code"]}\t{x["candidate_pipeline_status"]}\t{x["workunit_count"]}\t{x["ql2_or_better_lpc_workunit_count"]}\t{x["best_ql"]}')

if __name__=="__main__": main()
