#!/usr/bin/env python3
"""
Earthline Elder Trees — compact U.S. public 3DEP EPT spatial index.
OFF-PRODUCTION ONLY.

Input:
  data/elder-trees/generated/us-national/usgs-public-ept-projects.json

Outputs:
  - project WGS84 bounding boxes for fast point lookup
  - state/territory coverage summary based on public EPT project extents

This avoids repeatedly downloading the full WESM GeoPackage or relisting S3.
"""
from __future__ import annotations
import json, math, re, sys, tempfile, zipfile
from pathlib import Path
import requests
from pyproj import CRS, Transformer
import geopandas as gpd
from shapely.geometry import box

CATALOG=Path("data/elder-trees/generated/us-national/usgs-public-ept-projects.json")
CENSUS="https://www2.census.gov/geo/tiger/GENZ2025/shp/cb_2025_us_state_500k.zip"
UA={"User-Agent":"Earthline-ElderTree-Research/1.7"}

def ept_crs(srs):
    srs=srs or {}
    wkt=srs.get("wkt")
    if wkt:
        try:return CRS.from_wkt(wkt)
        except:pass
    auth=str(srs.get("authority") or "").upper()
    horiz=srs.get("horizontal")
    if auth and horiz not in (None,""):
        try:return CRS.from_user_input(f"{auth}:{horiz}")
        except:pass
    if horiz not in (None,""):
        try:return CRS.from_epsg(int(horiz))
        except:pass
    return None

def bounds2d(b):
    if not b:return None
    if len(b)>=6:return float(b[0]),float(b[1]),float(b[3]),float(b[4])
    if len(b)>=4:return float(b[0]),float(b[1]),float(b[2]),float(b[3])
    return None

def transform_bbox(b,crs):
    minx,miny,maxx,maxy=b
    if crs.is_geographic:
        return [minx,miny,maxx,maxy]
    t=Transformer.from_crs(crs,4326,always_xy=True)
    pts=[
      t.transform(minx,miny),t.transform(minx,maxy),
      t.transform(maxx,miny),t.transform(maxx,maxy)
    ]
    xs=[p[0] for p in pts if math.isfinite(p[0])]
    ys=[p[1] for p in pts if math.isfinite(p[1])]
    if not xs or not ys:return None
    return [min(xs),min(ys),max(xs),max(ys)]

def year_hint(prefix):
    m=re.findall(r"(?:19|20)\d{2}",str(prefix))
    return max((int(x) for x in m),default=None)

def build_index(projects):
    out=[];errors=[]
    for p in projects:
        if p.get("status")!=200:continue
        b=bounds2d(p.get("boundsConforming") or p.get("bounds"))
        crs=ept_crs(p.get("srs"))
        if not b or not crs:
            errors.append({"prefix":p.get("prefix"),"reason":"missing bounds/crs"})
            continue
        try:wb=transform_bbox(b,crs)
        except Exception as e:
            errors.append({"prefix":p.get("prefix"),"reason":str(e)})
            continue
        if not wb:continue
        # Reject nonsensical transformed extents.
        if wb[0] < -180.1 or wb[2] > 180.1 or wb[1] < -90.1 or wb[3] > 90.1:
            errors.append({"prefix":p.get("prefix"),"reason":"invalid WGS84 bounds","bounds":wb})
            continue
        out.append({
          "prefix":p.get("prefix"),"ept_url":p.get("ept_url"),
          "points":p.get("points"),"year_hint":year_hint(p.get("prefix")),
          "bbox_wgs84":wb,
          "srs":p.get("srs")
        })
    return out,errors

def state_matrix(index):
    with tempfile.TemporaryDirectory() as td:
        td=Path(td);zp=td/"states.zip"
        r=requests.get(CENSUS,headers=UA,timeout=180);r.raise_for_status();zp.write_bytes(r.content)
        with zipfile.ZipFile(zp) as z:z.extractall(td/"states")
        shp=next((td/"states").glob("*.shp"))
        states=gpd.read_file(shp).to_crs(4326)
        rows=[]
        for _,s in states.sort_values("STUSPS").iterrows():
            geom=s.geometry
            matches=[]
            for p in index:
                b=p["bbox_wgs84"]
                if geom.intersects(box(*b)):matches.append(p)
            rows.append({
              "code":s["STUSPS"],"name":s["NAME"],
              "public_ept_project_count":len(matches),
              "latest_year_hint":max((p["year_hint"] for p in matches if p["year_hint"] is not None),default=None),
              "total_ept_points":sum(int(p.get("points") or 0) for p in matches),
              "status":"PUBLIC_3DEP_EPT_PRESENT" if matches else "NO_PUBLIC_EPT_PROJECT_INTERSECTION",
              "note":"Project bbox intersection; candidate-level resolver performs point containment before refinement."
            })
        return rows

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-us-ept-index")
    out.mkdir(parents=True,exist_ok=True)
    if not CATALOG.exists():raise RuntimeError(f"missing persisted catalog: {CATALOG}")
    projects=json.loads(CATALOG.read_text())
    index,errors=build_index(projects)
    states=state_matrix(index)
    summary={
      "mode":"off-production",
      "source":"USGS public 3DEP EPT catalog",
      "catalog_project_count":len(projects),
      "indexed_project_count":len(index),
      "index_error_count":len(errors),
      "state_territory_count":len(states),
      "states_with_public_ept":sum(x["status"]=="PUBLIC_3DEP_EPT_PRESENT" for x in states),
      "rule":"Fast bbox index for candidate refinement; point containment is required before selecting a project."
    }
    (out/"usgs-ept-spatial-index.json").write_text(json.dumps(index,indent=2))
    (out/"usgs-ept-index-errors.json").write_text(json.dumps(errors,indent=2))
    (out/"us-state-public-ept-coverage.json").write_text(json.dumps(states,indent=2))
    (out/"usgs-ept-spatial-index-summary.json").write_text(json.dumps(summary,indent=2))
    print(json.dumps(summary,indent=2))
    print("STATE_MATRIX")
    for x in states:print(f'{x["code"]}\t{x["status"]}\t{x["public_ept_project_count"]}\t{x["latest_year_hint"]}')

if __name__=="__main__":main()
