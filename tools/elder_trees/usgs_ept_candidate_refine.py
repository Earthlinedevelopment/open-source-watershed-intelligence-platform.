#!/usr/bin/env python3
"""
Earthline Elder Trees — USGS 3DEP measured-LiDAR candidate refinement.
OFF-PRODUCTION ONLY.

Usage:
  prepare --lon ... --lat ... --name ... --outdir ...
  summarize --manifest ... --csv ... --out ...

prepare:
- resolves the GPS point against the persisted public EPT spatial index;
- fetches exact EPT metadata;
- transforms the point into the EPT CRS;
- writes a small PDAL crop pipeline.

summarize:
- evaluates the measured point crop;
- estimates local canopy height from measured points;
- upgrades only when local measured evidence is sufficient.

Scientific boundary:
LiDAR confirms structure, not age / ancient-veteran status / mycorrhizal-hub status.
"""
from __future__ import annotations
import argparse, csv, json, math, statistics
from pathlib import Path
import requests
from pyproj import CRS, Transformer

INDEX=Path("data/elder-trees/generated/us-national/usgs-ept-spatial-index.json")
UA={"User-Agent":"Earthline-ElderTree-Research/1.8"}
METHOD="earthline-usgs-3dep-elder-refinement-v0.1"

def contains(b,lon,lat):
    return b[0] <= lon <= b[2] and b[1] <= lat <= b[3]

def area(b):
    return max(0.0,b[2]-b[0])*max(0.0,b[3]-b[1])

def resolve(lon,lat):
    idx=json.loads(INDEX.read_text())
    matches=[p for p in idx if contains(p["bbox_wgs84"],lon,lat)]
    matches.sort(key=lambda p:(-(p.get("year_hint") or 0),area(p["bbox_wgs84"]),-(int(p.get("points") or 0))))
    return matches

def ept_crs(meta):
    srs=meta.get("srs") or {}
    wkt=srs.get("wkt")
    if wkt:
        try:return CRS.from_wkt(wkt)
        except:pass
    authority=srs.get("authority")
    horizontal=srs.get("horizontal")
    if authority and horizontal not in (None,""):
        try:return CRS.from_user_input(f"{authority}:{horizontal}")
        except:pass
    if horizontal not in (None,""):
        try:return CRS.from_epsg(int(horizontal))
        except:pass
    raise RuntimeError("EPT CRS could not be resolved")

def cmd_prepare(args):
    lon=float(args.lon);lat=float(args.lat)
    outdir=Path(args.outdir);outdir.mkdir(parents=True,exist_ok=True)
    matches=resolve(lon,lat)
    if not matches:
        result={
          "name":args.name,"lon":lon,"lat":lat,"status":"NO_PUBLIC_EPT_PROJECT_BOUNDS_MATCH",
          "method_version":METHOD,
          "scientific_limit":"No measured-LiDAR upgrade attempted; modeled candidate remains modeled."
        }
        (outdir/"manifest.json").write_text(json.dumps(result,indent=2))
        print(json.dumps(result,indent=2));return 2

    selected=matches[0]
    url=selected["ept_url"]
    r=requests.get(url,headers=UA,timeout=90);r.raise_for_status()
    meta=r.json()
    crs=ept_crs(meta)
    tx=Transformer.from_crs(4326,crs,always_xy=True)
    x,y=tx.transform(lon,lat)
    radius=float(args.radius)
    bounds=f"([{x-radius},{x+radius}],[{y-radius},{y+radius}])"
    csv_path=str((outdir/"points.csv").resolve())
    pipeline={
      "pipeline":[
        {"type":"readers.ept","filename":url,"bounds":bounds},
        {"type":"writers.text","filename":csv_path,"format":"csv",
         "order":"X,Y,Z,Classification,ReturnNumber,NumberOfReturns"}
      ]
    }
    manifest={
      "name":args.name,"lon":lon,"lat":lat,"status":"EPT_PROJECT_RESOLVED",
      "method_version":METHOD,"radius_m":radius,
      "project_bounds_match_count":len(matches),
      "project_bounds_matches":[
        {
          "prefix":m.get("prefix"),"ept_url":m.get("ept_url"),"year_hint":m.get("year_hint"),
          "project_points":m.get("points"),"bbox_wgs84":m.get("bbox_wgs84")
        } for m in matches[:10]
      ],
      "selected_project":{
        "prefix":selected.get("prefix"),"ept_url":url,"year_hint":selected.get("year_hint"),
        "project_points":selected.get("points"),"bbox_wgs84":selected.get("bbox_wgs84")
      },
      "ept_srs":meta.get("srs"),"center_projected":{"x":x,"y":y},
      "pdal_pipeline":str((outdir/"pipeline.json").resolve()),
      "point_csv":csv_path,
      "scientific_limit":"Project coverage alone does not upgrade the candidate. The local measured crop must contain usable ground and canopy evidence."
    }
    (outdir/"pipeline.json").write_text(json.dumps(pipeline,indent=2))
    (outdir/"manifest.json").write_text(json.dumps(manifest,indent=2))
    print(json.dumps(manifest,indent=2));return 0

def fnum(v):
    try:return float(v)
    except:return None

def pct(vals,p):
    if not vals:return None
    s=sorted(vals)
    if len(s)==1:return s[0]
    k=(len(s)-1)*p/100.0
    a=int(math.floor(k));b=int(math.ceil(k))
    if a==b:return s[a]
    return s[a]*(b-k)+s[b]*(k-a)

def cmd_summarize(args):
    man=json.loads(Path(args.manifest).read_text())
    csvpath=Path(args.csv)
    if not csvpath.exists():
        raise RuntimeError("PDAL point CSV missing")
    rows=[]
    with csvpath.open(newline="") as fh:
        for row in csv.DictReader(fh):
            x=fnum(row.get("X"));y=fnum(row.get("Y"));z=fnum(row.get("Z"))
            cls=fnum(row.get("Classification"))
            if x is None or y is None or z is None:continue
            rows.append((x,y,z,int(cls) if cls is not None else None))
    cx=man["center_projected"]["x"];cy=man["center_projected"]["y"]
    local=[r for r in rows if math.hypot(r[0]-cx,r[1]-cy)<=20.0]
    ground=[r[2] for r in local if r[3]==2]
    usable=[r[2] for r in local if r[3] not in (7,18)]
    vegetation=[r[2] for r in local if r[3] in (1,3,4,5)]
    ground_method="classification-2"
    if len(ground)>=3:
        ground_z=pct(ground,50)
    elif len(usable)>=20:
        ground_z=pct(usable,5)
        ground_method="local-p05-fallback"
    else:
        ground_z=None
    top_source=vegetation if len(vegetation)>=5 else usable
    top_z=pct(top_source,99.5) if ground_z is not None and top_source else None
    height=(top_z-ground_z) if top_z is not None else None
    confirmed=bool(
      len(local)>=20 and
      ground_z is not None and
      height is not None and
      2.0 <= height <= 80.0
    )
    result={
      "name":man.get("name"),"lon":man.get("lon"),"lat":man.get("lat"),
      "record_class":"LIDAR_CONFIRMED_ELDER_TREE_CANDIDATE" if confirmed else "ELDER_TREE_CANDIDATE",
      "verification_status":"measured LiDAR structural candidate" if confirmed else "modeled candidate; LiDAR upgrade not confirmed",
      "method_version":METHOD,
      "source_name":"USGS 3DEP public EPT",
      "source_url":man["selected_project"]["ept_url"],
      "source_year_hint":man["selected_project"].get("year_hint"),
      "crop_radius_m":man.get("radius_m"),
      "point_count_crop":len(rows),"point_count_within_20m":len(local),
      "ground_point_count":len(ground),"vegetation_or_unclassified_count":len(top_source),
      "ground_method":ground_method if ground_z is not None else None,
      "ground_z":round(ground_z,3) if ground_z is not None else None,
      "canopy_top_z_p99_5":round(top_z,3) if top_z is not None else None,
      "measured_canopy_height_m":round(height,2) if height is not None else None,
      "lidar_structure_confirmed":confirmed,
      "evidence_limit":"Measured LiDAR confirms local canopy structure only. It does not prove tree age, ancient/veteran status, or mycorrhizal-hub status."
    }
    Path(args.out).write_text(json.dumps(result,indent=2))
    print(json.dumps(result,indent=2))
    return 0 if confirmed else 3

def main():
    ap=argparse.ArgumentParser()
    sub=ap.add_subparsers(dest="cmd",required=True)
    p=sub.add_parser("prepare")
    p.add_argument("--lon",required=True);p.add_argument("--lat",required=True)
    p.add_argument("--name",required=True);p.add_argument("--radius",type=float,default=30.0)
    p.add_argument("--outdir",required=True)
    s=sub.add_parser("summarize")
    s.add_argument("--manifest",required=True);s.add_argument("--csv",required=True);s.add_argument("--out",required=True)
    a=ap.parse_args()
    raise SystemExit(cmd_prepare(a) if a.cmd=="prepare" else cmd_summarize(a))

if __name__=="__main__":main()
