#!/usr/bin/env python3
"""
Earthline Elder Trees — England calibration pilot.

OFF-PRODUCTION RESEARCH ONLY. England is the independent calibration geography.

Inputs:
- Environment Agency 1 m LIDAR Composite DSM and DTM via WCS.
- Woodland Trust Ancient Tree Inventory public ArcGIS service for validation.

Outputs:
- elder-tree-candidates.geojson  (Earthline structural candidates)
- ati-reference.geojson          (reference points used for comparison)
- validation-summary.json

No output from this script is a VERIFIED Earthline Elder Tree.
"""

from __future__ import annotations
import argparse, json, math, os, re, sys, xml.etree.ElementTree as ET
from io import BytesIO
from pathlib import Path

import numpy as np
import requests
import rasterio
from rasterio.io import MemoryFile
from rasterio.warp import transform_bounds
from pyproj import CRS, Transformer
from scipy import ndimage

DSM_WCS="https://environment.data.gov.uk/spatialdata/lidar-composite-digital-surface-model-last-return-dsm-1m/wcs"
DTM_WCS="https://environment.data.gov.uk/spatialdata/lidar-composite-digital-terrain-model-dtm-1m/wcs"
ATI="https://services-eu1.arcgis.com/WIfgdJeDbrZU1cnA/ArcGIS/rest/services/Ancient%20Tree%20Inventory%20%28ATI%29/FeatureServer/0"
METHOD="earthline-elder-tree-england-calibration-v0.1"

def get_xml(url, params):
    r=requests.get(url, params=params, timeout=90)
    r.raise_for_status()
    return ET.fromstring(r.content)

def coverage_id(base):
    root=get_xml(base,{"service":"WCS","version":"2.0.1","request":"GetCapabilities"})
    for el in root.iter():
        if el.tag.endswith("CoverageId") and (el.text or "").strip():
            return el.text.strip()
    raise RuntimeError("WCS coverage id not found")

def describe(base,cid):
    root=get_xml(base,{"service":"WCS","version":"2.0.1","request":"DescribeCoverage","coverageId":cid})
    env=None
    for el in root.iter():
        if el.tag.endswith("Envelope"):
            env=el; break
    if env is None:
        raise RuntimeError("WCS envelope not found")
    axis=(env.attrib.get("axisLabels") or "E N").split()
    srs=env.attrib.get("srsName") or ""
    return axis,srs

def get_wcs_tif(base,bbox27700,out_path):
    cid=coverage_id(base)
    axis,srs=describe(base,cid)
    if len(axis)<2: axis=["E","N"]
    minx,miny,maxx,maxy=bbox27700
    params=[
        ("service","WCS"),("version","2.0.1"),("request","GetCoverage"),
        ("coverageId",cid),
        ("subset",f"{axis[0]}({minx},{maxx})"),
        ("subset",f"{axis[1]}({miny},{maxy})"),
        ("format","image/tiff"),
    ]
    r=requests.get(base,params=params,timeout=180)
    r.raise_for_status()
    ctype=(r.headers.get("content-type") or "").lower()
    if "xml" in ctype or r.content[:50].lstrip().startswith(b"<"):
        raise RuntimeError("WCS returned XML instead of GeoTIFF: "+r.text[:500])
    out_path.write_bytes(r.content)
    return {"coverage_id":cid,"axis_labels":axis,"srs":srs,"url":r.url}

def fetch_ati(bbox4326):
    minlon,minlat,maxlon,maxlat=bbox4326
    params={
        "where":"1=1",
        "geometry":f"{minlon},{minlat},{maxlon},{maxlat}",
        "geometryType":"esriGeometryEnvelope",
        "inSR":"4326",
        "spatialRel":"esriSpatialRelIntersects",
        "outFields":"*",
        "returnGeometry":"true",
        "outSR":"4326",
        "f":"json",
        "resultRecordCount":"2000",
        "resultOffset":"0",
    }
    feats=[]
    while True:
        r=requests.get(ATI+"/query",params=params,timeout=90)
        r.raise_for_status()
        data=r.json()
        if "error" in data:
            raise RuntimeError("ATI query error: "+json.dumps(data["error"]))
        batch=data.get("features") or []
        feats.extend(batch)
        if len(batch)<2000:
            break
        params["resultOffset"]=str(int(params["resultOffset"])+len(batch))
        if int(params["resultOffset"])>20000:
            break
    out=[]
    for f in feats:
        g=f.get("geometry") or {}
        x,y=g.get("x"),g.get("y")
        if x is None or y is None: continue
        a=f.get("attributes") or {}
        out.append({
            "type":"Feature",
            "geometry":{"type":"Point","coordinates":[float(x),float(y)]},
            "properties":{"source":"Woodland Trust Ancient Tree Inventory","attributes":a}
        })
    return out

def robust_candidate_points(dsm_path,dtm_path):
    with rasterio.open(dsm_path) as dsm, rasterio.open(dtm_path) as dtm:
        a=dsm.read(1).astype("float32")
        b=dtm.read(1).astype("float32")
        if a.shape != b.shape or dsm.transform != dtm.transform or dsm.crs != dtm.crs:
            raise RuntimeError("DSM/DTM grids are not aligned; fail closed")
        for arr,nod in ((a,dsm.nodata),(b,dtm.nodata)):
            if nod is not None: arr[arr==nod]=np.nan
        chm=a-b
        chm[(~np.isfinite(chm))|(chm<2)|(chm>70)]=np.nan

        # Remove obviously built surfaces by requiring locally tree-like height texture:
        smooth=ndimage.gaussian_filter(np.nan_to_num(chm,nan=0),sigma=1.0)
        local_med=ndimage.median_filter(np.nan_to_num(chm,nan=0),size=15)
        emergent=smooth-local_med

        vals=chm[np.isfinite(chm)&(chm>=8)]
        if vals.size<500:
            raise RuntimeError("Too little canopy in AOI")
        p95=float(np.percentile(vals,95))
        p99=float(np.percentile(vals,99))
        threshold=max(18.0,p95)

        maxf=ndimage.maximum_filter(smooth,size=9,mode="nearest")
        peak=(smooth==maxf)&(smooth>=threshold)&(emergent>=2.5)
        rows,cols=np.where(peak)

        to4326=Transformer.from_crs(dsm.crs,CRS.from_epsg(4326),always_xy=True)
        feats=[]
        for r,c in zip(rows.tolist(),cols.tolist()):
            x,y=rasterio.transform.xy(dsm.transform,r,c,offset="center")
            lon,lat=to4326.transform(x,y)
            h=float(chm[r,c]) if np.isfinite(chm[r,c]) else float(smooth[r,c])
            em=float(emergent[r,c])
            strong=bool(h>=max(24.0,p99) and em>=4.0)
            conf=min(95.0,max(40.0,45.0+(h-threshold)*2.0+em*2.0))
            feats.append({
                "type":"Feature",
                "geometry":{"type":"Point","coordinates":[lon,lat]},
                "properties":{
                    "record_class":"ELDER_TREE_STRONG_CANDIDATE" if strong else "ELDER_TREE_CANDIDATE",
                    "verification_status":"remote-sensing candidate only",
                    "method_version":METHOD,
                    "source_name":"Environment Agency LIDAR Composite DSM/DTM 1m",
                    "confidence":round(conf,1),
                    "height_m":round(h,2),
                    "emergent_height_m":round(em,2),
                    "species":None,
                    "genus":None,
                    "mycorrhizal_network_evidence":None,
                    "evidence_limit":"Structural LiDAR candidate; not an ATI verification and not a verified mycorrhizal hub."
                }
            })
        return feats,{"p95_height_m":p95,"p99_height_m":p99,"canopy_cells":int(vals.size),"crs":str(dsm.crs)}

def haversine_m(a,b):
    lon1,lat1=a; lon2,lat2=b
    R=6371008.8
    p1,p2=math.radians(lat1),math.radians(lat2)
    dp=math.radians(lat2-lat1); dl=math.radians(lon2-lon1)
    q=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(min(1,math.sqrt(q)))

def validate(cands,refs):
    cp=[f["geometry"]["coordinates"] for f in cands]
    rp=[f["geometry"]["coordinates"] for f in refs]
    if not cp or not rp:
        return {"candidate_count":len(cp),"reference_count":len(rp),"status":"insufficient-points"}
    nearest_ref=[]
    for p in cp:
        nearest_ref.append(min(haversine_m(p,q) for q in rp))
    nearest_cand=[]
    for q in rp:
        nearest_cand.append(min(haversine_m(q,p) for p in cp))
    return {
        "candidate_count":len(cp),
        "reference_count":len(rp),
        "candidate_within_15m_of_ATI":sum(d<=15 for d in nearest_ref),
        "candidate_within_30m_of_ATI":sum(d<=30 for d in nearest_ref),
        "candidate_within_60m_of_ATI":sum(d<=60 for d in nearest_ref),
        "ATI_with_candidate_within_15m":sum(d<=15 for d in nearest_cand),
        "ATI_with_candidate_within_30m":sum(d<=30 for d in nearest_cand),
        "ATI_with_candidate_within_60m":sum(d<=60 for d in nearest_cand),
        "median_candidate_to_ATI_m":round(float(np.median(nearest_ref)),2),
        "median_ATI_to_candidate_m":round(float(np.median(nearest_cand)),2),
        "note":"ATI is incomplete; unmatched Earthline candidates are not automatically false positives."
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--bbox",required=True,help="minlon,minlat,maxlon,maxlat")
    ap.add_argument("--name",required=True)
    ap.add_argument("--out",required=True)
    args=ap.parse_args()
    bbox=tuple(float(x) for x in args.bbox.split(","))
    out=Path(args.out); out.mkdir(parents=True,exist_ok=True)
    tx=Transformer.from_crs(4326,27700,always_xy=True)
    minlon,minlat,maxlon,maxlat=bbox
    xs,ys=tx.transform([minlon,maxlon,maxlon,minlon],[minlat,minlat,maxlat,maxlat])
    bbox27700=(min(xs),min(ys),max(xs),max(ys))

    dsm_meta=get_wcs_tif(DSM_WCS,bbox27700,out/"dsm.tif")
    dtm_meta=get_wcs_tif(DTM_WCS,bbox27700,out/"dtm.tif")
    refs=fetch_ati(bbox)
    cands,chm_meta=robust_candidate_points(out/"dsm.tif",out/"dtm.tif")

    (out/"elder-tree-candidates.geojson").write_text(json.dumps({"type":"FeatureCollection","features":cands},indent=2))
    (out/"ati-reference.geojson").write_text(json.dumps({"type":"FeatureCollection","features":refs},indent=2))
    summary={
        "pilot":args.name,
        "bbox_wgs84":bbox,
        "method_version":METHOD,
        "off_production":True,
        "dsm":dsm_meta,
        "dtm":dtm_meta,
        "chm":chm_meta,
        "validation":validate(cands,refs),
        "scientific_boundary":"Candidates are GPS points derived from canopy structure. No candidate is a verified Elder Tree until field/authoritative verification."
    }
    (out/"validation-summary.json").write_text(json.dumps(summary,indent=2))
    print(json.dumps(summary,indent=2))

if __name__=="__main__":
    main()
