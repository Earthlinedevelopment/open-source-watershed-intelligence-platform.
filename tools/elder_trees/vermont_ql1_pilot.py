#!/usr/bin/env python3
"""
Earthline Elder Trees — Vermont QL1 LiDAR pilot v0.1
OFF-PRODUCTION ONLY. Uses only the public champion-tree map filter.

Validation:
- Only Vermont map records matching the exact public-map filter:
  (public_access = 'yes') AND (Champion = 'yes')
- Those points are validation controls for large exceptional trees, NOT verified Elder Trees.

Detection:
- Vermont statewide 2023 QL1 0.35 m nDSM COG (height above ground, metres).
- Generates remote-sensing ELDER_TREE_CANDIDATE GPS points only.
"""
from __future__ import annotations
import json, math, os, re, sys
from pathlib import Path

import numpy as np
import requests
import rasterio
from rasterio.windows import from_bounds
from pyproj import Transformer, CRS
from scipy import ndimage

UA={"User-Agent":"Earthline-ElderTree-Research/0.7"}
PUBLIC_LAYER="https://services5.arcgis.com/Uzks6LSde6r23wwG/arcgis/rest/services/Big_Tree_Survey_View/FeatureServer/0"
PUBLIC_WHERE="(public_access = 'yes') AND (Champion = 'yes')"
NDSM_HTTP="https://vtopendata-prd.s3.us-east-2.amazonaws.com/Elevation/STATEWIDE_2023_35cm_NDSM.tif"
NDSM_VSI="/vsicurl/"+NDSM_HTTP
METHOD="earthline-elder-tree-vermont-ql1-v0.1"

def ajson(url,params):
    r=requests.get(url,params=params,headers=UA,timeout=120)
    r.raise_for_status()
    d=r.json()
    if isinstance(d,dict) and d.get("error"):
        raise RuntimeError(json.dumps(d["error"]))
    return d

def norm(s): return re.sub(r"[^a-z0-9]+","",str(s).lower())

def pick_field(fields, needles):
    for f in fields:
        n=norm(f)
        if all(x in n for x in needles): return f
    for f in fields:
        n=norm(f)
        if any(x in n for x in needles): return f
    return None

def fetch_public():
    meta=ajson(PUBLIC_LAYER,{"f":"json"})
    fields=[f.get("name") for f in meta.get("fields",[]) if f.get("name")]
    q=ajson(PUBLIC_LAYER+"/query",{
      "where":PUBLIC_WHERE,
      "outFields":"*",
      "returnGeometry":"true",
      "outSR":"4326",
      "f":"json",
      "resultRecordCount":"500"
    })
    exact={norm(f):f for f in fields}
    mapping={
      "common":exact.get("commonname") or pick_field(fields,["common"]),
      "species":exact.get("species") or exact.get("genusspecies") or pick_field(fields,["scientific"]) or pick_field(fields,["species"]),
      "height":exact.get("totalheight"),
      "crown":exact.get("crownspread"),
      "circ":exact.get("breastheightcirc"),
      "score":exact.get("bigtreepoints") or pick_field(fields,["score"]) or pick_field(fields,["points"]),
      "objectid":exact.get("objectid") or exact.get("globalid")
    }
    if not mapping["height"] or not mapping["circ"]:
        raise RuntimeError("Expected Vermont Big Tree measurement fields missing; fail closed")
    out=[]
    for f in q.get("features",[]):
        g=f.get("geometry") or {}; a=f.get("attributes") or {}
        lon,lat=g.get("x"),g.get("y")
        if lon is None or lat is None: continue
        rec={"lon":float(lon),"lat":float(lat),"attrs":a}
        for k,field in mapping.items():
            rec[k]=a.get(field) if field else None
        out.append(rec)
    return out,mapping,fields

def hav_m(a,b):
    lon1,lat1=a; lon2,lat2=b; R=6371008.8
    p1,p2=math.radians(lat1),math.radians(lat2)
    dp=math.radians(lat2-lat1); dl=math.radians(lon2-lon1)
    q=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(min(1,math.sqrt(q)))

def read_window(ds,lon,lat,radius_m=90):
    tosrc=Transformer.from_crs(4326,ds.crs,always_xy=True)
    x,y=tosrc.transform(lon,lat)
    w=from_bounds(x-radius_m,y-radius_m,x+radius_m,y+radius_m,ds.transform)
    w=w.round_offsets().round_lengths()
    arr=ds.read(1,window=w,boundless=True,fill_value=ds.nodata if ds.nodata is not None else 0).astype("float32")
    tr=ds.window_transform(w)
    if ds.nodata is not None: arr[arr==ds.nodata]=np.nan
    arr[(~np.isfinite(arr))|(arr<0)|(arr>47.1)]=np.nan
    return arr,tr

def peaks_from_window(arr,tr,crs,validation_id):
    z=np.nan_to_num(arr,nan=0.0)
    # 0.35m pixels: 17 px ~ 6m minimum separation between crown peaks.
    sm=ndimage.gaussian_filter(z,sigma=2.0)
    maxf=ndimage.maximum_filter(sm,size=17,mode="nearest")
    peak=(sm==maxf)&(sm>=5.0)
    rows,cols=np.where(peak)
    to4326=Transformer.from_crs(crs,4326,always_xy=True)
    feats=[]
    for row,col in zip(rows.tolist(),cols.tolist()):
        h=float(arr[row,col]) if np.isfinite(arr[row,col]) else float(sm[row,col])
        # local context around peak
        rad=35
        r0,r1=max(0,row-rad),min(arr.shape[0],row+rad+1)
        c0,c1=max(0,col-rad),min(arr.shape[1],col+rad+1)
        local=arr[r0:r1,c0:c1]
        lv=local[np.isfinite(local)]
        med=float(np.median(lv)) if lv.size else 0.0
        emerg=max(0.0,h-med)
        # broad-crown proxy: area above 45% of peak height in connected component
        sub=np.nan_to_num(local,nan=0.0)
        mask=sub>=max(3.0,h*0.45)
        lab,n=ndimage.label(mask)
        rr,cc=row-r0,col-c0
        label=lab[rr,cc] if 0<=rr<lab.shape[0] and 0<=cc<lab.shape[1] else 0
        area_px=int(np.sum(lab==label)) if label>0 else 0
        area_m2=area_px*(abs(tr.a)*abs(tr.e))
        x,y=rasterio.transform.xy(tr,row,col,offset="center")
        lon,lat=to4326.transform(x,y)
        feats.append({
          "type":"Feature",
          "geometry":{"type":"Point","coordinates":[lon,lat]},
          "properties":{
            "record_class":"ELDER_TREE_CANDIDATE",
            "verification_status":"remote-sensing candidate only",
            "method_version":METHOD,
            "source_name":"Vermont 2023 QL1 0.35 m LiDAR nDSM",
            "source_url":NDSM_HTTP,
            "height_m":round(h,2),
            "emergent_height_m":round(emerg,2),
            "crown_area_proxy_m2":round(area_m2,1),
            "validation_window_id":validation_id,
            "evidence_limit":"LiDAR structural candidate only; not a verified Elder Tree."
          }
        })
    return feats

def dedupe(features,within_m=2.5):
    out=[]
    for f in sorted(features,key=lambda x:x["properties"]["height_m"],reverse=True):
        p=f["geometry"]["coordinates"]
        if all(hav_m(p,g["geometry"]["coordinates"])>within_m for g in out):
            out.append(f)
    return out

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-vermont-ql1")
    out.mkdir(parents=True,exist_ok=True)
    controls,mapping,fields=fetch_public()
    if not controls:
        raise RuntimeError("No public champion-tree controls returned; fail closed")

    os.environ.setdefault("GDAL_DISABLE_READDIR_ON_OPEN","EMPTY_DIR")
    os.environ.setdefault("CPL_VSIL_CURL_ALLOWED_EXTENSIONS",".tif,.TIF")
    os.environ.setdefault("VSI_CACHE","TRUE")

    all_candidates=[]
    validation=[]
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif"):
        with rasterio.open(NDSM_VSI) as ds:
            for i,t in enumerate(controls):
                arr,tr=read_window(ds,t["lon"],t["lat"],90)
                feats=peaks_from_window(arr,tr,ds.crs,i)
                all_candidates.extend(feats)
                target=(t["lon"],t["lat"])
                nearest=None
                for f in feats:
                    d=hav_m(target,f["geometry"]["coordinates"])
                    if nearest is None or d<nearest[0]: nearest=(d,f)
                measured_ft=None
                try:
                    if t["height"] not in (None,""): measured_ft=float(t["height"])
                except: pass
                val={
                  "control_index":i,
                  "public_control":True,
                  "common_name":t["common"],
                  "species":t["species"],
                  "measured_height_ft":measured_ft,
                  "measured_height_m":round(measured_ft*0.3048,2) if measured_ft is not None else None,
                  "crown_spread_ft":t["crown"],
                  "circumference_in":t["circ"],
                  "nearest_candidate_distance_m":round(nearest[0],2) if nearest else None,
                  "nearest_candidate_height_m":nearest[1]["properties"]["height_m"] if nearest else None,
                  "candidate_count_in_180m_window":len(feats)
                }
                if measured_ft is not None and nearest:
                    val["height_error_m"]=round(nearest[1]["properties"]["height_m"]-measured_ft*0.3048,2)
                validation.append(val)

            raster_meta={
              "crs":str(ds.crs),"width":ds.width,"height":ds.height,
              "res":[abs(ds.transform.a),abs(ds.transform.e)],
              "nodata":ds.nodata,"dtype":str(ds.dtypes[0])
            }

    cands=dedupe(all_candidates)
    control_features=[]
    for i,t in enumerate(controls):
        control_features.append({
          "type":"Feature","geometry":{"type":"Point","coordinates":[t["lon"],t["lat"]]},
          "properties":{
            "record_class":"VERMONT_PUBLIC_BIG_TREE_VALIDATION_CONTROL",
            "validation_only":True,
            "common_name":t["common"],"species":t["species"],
            "measured_height_ft":t["height"],"crown_spread_ft":t["crown"],
            "circumference_in":t["circ"],
            "source":"Vermont Big Tree public map",
            "source_filter":PUBLIC_WHERE,
            "note":"Large-tree validation control; not automatically a verified Elder Tree."
          }
        })

    ds=[v["nearest_candidate_distance_m"] for v in validation if v["nearest_candidate_distance_m"] is not None]
    herrors=[abs(v["height_error_m"]) for v in validation if v.get("height_error_m") is not None]
    summary={
      "mode":"off-production",
      "method_version":METHOD,
      "public_control_filter":PUBLIC_WHERE,
      "public_control_count":len(controls),
      "candidate_count":len(cands),
      "field_mapping":mapping,
      "raster":raster_meta,
      "validation":{
        "controls_with_candidate_within_5m":sum(d<=5 for d in ds),
        "controls_with_candidate_within_10m":sum(d<=10 for d in ds),
        "controls_with_candidate_within_20m":sum(d<=20 for d in ds),
        "median_nearest_candidate_distance_m":round(float(np.median(ds)),2) if ds else None,
        "median_abs_height_error_m":round(float(np.median(herrors)),2) if herrors else None
      },
      "scientific_boundary":"Vermont Big Tree records validate large-tree detection only. Earthline LiDAR detections remain Elder Tree Candidates, not verified Elder Trees."
    }

    (out/"vermont-elder-tree-candidates.geojson").write_text(json.dumps({"type":"FeatureCollection","features":cands},indent=2))
    (out/"vermont-public-big-tree-controls.geojson").write_text(json.dumps({"type":"FeatureCollection","features":control_features},indent=2))
    (out/"vermont-validation-detail.json").write_text(json.dumps(validation,indent=2,default=str))
    (out/"validation-summary.json").write_text(json.dumps(summary,indent=2,default=str))
    print(json.dumps(summary,indent=2,default=str))

if __name__=="__main__": main()
