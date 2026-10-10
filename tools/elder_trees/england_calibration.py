#!/usr/bin/env python3
"""
Earthline Elder Trees — England calibration pilot v0.2.

OFF-PRODUCTION RESEARCH ONLY.

Purpose:
- Generate GPS POINT candidates only.
- Use Environment Agency 1 m LiDAR DSM/DTM for structure.
- Compare against Woodland Trust ATI Ancient/Veteran GPS points.
- Do not create zones, scoring, exclusions, or V1 production behavior.
"""

from __future__ import annotations
import argparse, json, math, time, xml.etree.ElementTree as ET
from pathlib import Path

import numpy as np
import requests
import rasterio
from pyproj import CRS, Transformer
from scipy import ndimage

DSM_WCS_OPTIONS=[
 "https://environment.data.gov.uk/spatialdata/lidar-composite-digital-surface-model-first-return-dsm-1m/wcs",
 "https://environment.data.gov.uk/spatialdata/lidar-composite-digital-surface-model-last-return-dsm-1m/wcs",
]
DTM_WCS="https://environment.data.gov.uk/spatialdata/lidar-composite-digital-terrain-model-dtm-1m/wcs"
ATI="https://services-eu1.arcgis.com/WIfgdJeDbrZU1cnA/ArcGIS/rest/services/Ancient%20Tree%20Inventory%20%28ATI%29/FeatureServer/0"
METHOD="earthline-elder-tree-england-calibration-v0.2"
UA={"User-Agent":"Earthline-ElderTree-Research/0.2"}

def get_xml(url,params):
    last=None
    for pause in (0,2,5):
        if pause: time.sleep(pause)
        r=requests.get(url,params=params,headers=UA,timeout=90)
        last=r
        if r.status_code < 500:
            r.raise_for_status()
            return ET.fromstring(r.content)
    last.raise_for_status()
    raise RuntimeError("unreachable")

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
    if env is None: raise RuntimeError("WCS envelope not found")
    return (env.attrib.get("axisLabels") or "E N").split(), env.attrib.get("srsName") or ""

def get_wcs_tif_one(base,bbox27700,out_path):
    cid=coverage_id(base)
    axis,srs=describe(base,cid)
    if len(axis)<2: axis=["E","N"]
    minx,miny,maxx,maxy=bbox27700
    params=[
      ("service","WCS"),("version","2.0.1"),("request","GetCoverage"),
      ("coverageId",cid),
      ("subset",f"{axis[0]}({minx},{maxx})"),
      ("subset",f"{axis[1]}({miny},{maxy})"),
      ("format","image/tiff")
    ]
    r=requests.get(base,params=params,headers=UA,timeout=240)
    r.raise_for_status()
    if "xml" in (r.headers.get("content-type") or "").lower() or r.content[:40].lstrip().startswith(b"<"):
        raise RuntimeError("WCS returned XML instead of GeoTIFF: "+r.text[:400])
    out_path.write_bytes(r.content)
    return {"coverage_id":cid,"axis_labels":axis,"srs":srs,"endpoint":base,"request_url":r.url}

def get_wcs_tif(options,bbox27700,out_path):
    if isinstance(options,str): options=[options]
    errors=[]
    for base in options:
        try: return get_wcs_tif_one(base,bbox27700,out_path)
        except Exception as e: errors.append(f"{base}: {e}")
    raise RuntimeError("All WCS sources failed: "+" | ".join(errors))

def fetch_ati(bbox4326):
    minlon,minlat,maxlon,maxlat=bbox4326
    params={
      "where":"1=1",
      "geometry":f"{minlon},{minlat},{maxlon},{maxlat}",
      "geometryType":"esriGeometryEnvelope",
      "inSR":"4326","spatialRel":"esriSpatialRelIntersects",
      "outFields":"*","returnGeometry":"true","outSR":"4326",
      "f":"json","resultRecordCount":"2000","resultOffset":"0"
    }
    raw=[]
    while True:
        r=requests.get(ATI+"/query",params=params,headers=UA,timeout=90); r.raise_for_status()
        d=r.json()
        if "error" in d: raise RuntimeError("ATI query error: "+json.dumps(d["error"]))
        batch=d.get("features") or []; raw.extend(batch)
        if len(batch)<2000: break
        params["resultOffset"]=str(int(params["resultOffset"])+len(batch))
        if int(params["resultOffset"])>20000: break
    out=[]
    status_counts={}
    for f in raw:
        a=f.get("attributes") or {}
        status=str(a.get("VeteranStatus") or "").strip()
        status_counts[status]=status_counts.get(status,0)+1
        low=status.lower()
        # Calibration control is Ancient/Veteran only; exclude notable/lost/unknown.
        if not (("ancient" in low or "veteran" in low) and "lost" not in low):
            continue
        lon=a.get("Longitude"); lat=a.get("Latitude")
        if lon is None or lat is None:
            g=f.get("geometry") or {}; lon=g.get("x"); lat=g.get("y")
        if lon is None or lat is None: continue
        try: lon=float(lon); lat=float(lat)
        except: continue
        out.append({
          "type":"Feature",
          "geometry":{"type":"Point","coordinates":[lon,lat]},
          "properties":{
            "record_class":"VERIFIED_EXTERNAL_TREE",
            "source":"Woodland Trust Ancient Tree Inventory",
            "source_id":a.get("Id"),
            "veteran_status":status,
            "species":a.get("Species"),
            "tree_form":a.get("TreeForm"),
            "measured_girth_m":a.get("MeasuredGirth"),
            "measured_height_m":a.get("MeasuredHeight"),
            "verified_date":a.get("VerifiedDate")
          }
        })
    return out,{"raw_status_counts":status_counts,"raw_count":len(raw),"ancient_veteran_count":len(out)}

def percentile_scores(values):
    arr=np.asarray(values,dtype=float)
    order=np.argsort(arr)
    ranks=np.empty(len(arr),dtype=float); ranks[order]=np.arange(len(arr),dtype=float)
    return 100.0*(ranks+1)/max(1,len(arr))

def crown_area_proxy(chm,row,col,h):
    r=22
    r0,r1=max(0,row-r),min(chm.shape[0],row+r+1)
    c0,c1=max(0,col-r),min(chm.shape[1],col+r+1)
    sub=np.nan_to_num(chm[r0:r1,c0:c1],nan=0.0)
    # Broad living crown proxy; intentionally not an age verdict.
    mask=sub>=max(4.0,h*0.42)
    lab,n=ndimage.label(mask)
    rr,cc=row-r0,col-c0
    k=lab[rr,cc]
    return float(np.sum(lab==k)) if k>0 else 0.0

def structural_candidates(dsm_path,dtm_path):
    with rasterio.open(dsm_path) as dsm, rasterio.open(dtm_path) as dtm:
        a=dsm.read(1).astype("float32"); b=dtm.read(1).astype("float32")
        if a.shape!=b.shape or dsm.transform!=dtm.transform or dsm.crs!=dtm.crs:
            raise RuntimeError("DSM/DTM are not aligned; fail closed")
        if dsm.nodata is not None: a[a==dsm.nodata]=np.nan
        if dtm.nodata is not None: b[b==dtm.nodata]=np.nan
        chm=a-b
        chm[(~np.isfinite(chm))|(chm<0)|(chm>70)]=np.nan
        z=np.nan_to_num(chm,nan=0.0)
        smooth=ndimage.gaussian_filter(z,sigma=1.0)

        # Use a permissive canopy floor; veteran trees can be retrenched and not be the tallest.
        maxf=ndimage.maximum_filter(smooth,size=9,mode="nearest")
        peak=(smooth==maxf)&(smooth>=8.0)
        rows,cols=np.where(peak)
        if len(rows)>20000:
            # bounded pilot: keep stronger peaks without forcing "top 5%" old-tree assumption.
            vals=smooth[rows,cols]
            cut=np.percentile(vals,50)
            keep=vals>=cut; rows,cols=rows[keep],cols[keep]

        feats=[]
        hvals=[]; emerg=[]; areas=[]; openfr=[]
        for row,col in zip(rows.tolist(),cols.tolist()):
            h=float(chm[row,col]) if np.isfinite(chm[row,col]) else float(smooth[row,col])
            rr=30
            r0,r1=max(0,row-rr),min(chm.shape[0],row+rr+1)
            c0,c1=max(0,col-rr),min(chm.shape[1],col+rr+1)
            local=chm[r0:r1,c0:c1]
            lv=local[np.isfinite(local)]
            med=float(np.median(lv)) if lv.size else 0.0
            e=max(0.0,h-med)
            area=crown_area_proxy(chm,row,col,h)
            # Open-grown context can be informative for veteran parkland trees, but is only one component.
            open_fraction=float(np.mean(np.nan_to_num(local,nan=0.0)<4.0))
            hvals.append(h); emerg.append(e); areas.append(area); openfr.append(open_fraction)
            feats.append([row,col,h,e,area,open_fraction])

        hp=percentile_scores(hvals); ep=percentile_scores(emerg)
        ap=percentile_scores(areas); op=percentile_scores(openfr)
        to4326=Transformer.from_crs(dsm.crs,CRS.from_epsg(4326),always_xy=True)
        out=[]
        for i,(row,col,h,e,area,of) in enumerate(feats):
            # Structure score, not "probability of ancient tree."
            score=.22*hp[i]+.28*ap[i]+.25*ep[i]+.25*op[i]
            x,y=rasterio.transform.xy(dsm.transform,row,col,offset="center")
            lon,lat=to4326.transform(x,y)
            out.append({
              "type":"Feature",
              "geometry":{"type":"Point","coordinates":[lon,lat]},
              "properties":{
                "record_class":"ELDER_TREE_CANDIDATE",
                "verification_status":"remote-sensing candidate only",
                "method_version":METHOD,
                "source_name":"Environment Agency 1m LiDAR DSM/DTM",
                "structure_score":round(float(score),2),
                "height_m":round(h,2),
                "emergent_height_m":round(e,2),
                "crown_area_proxy_m2":round(area,1),
                "open_context_fraction":round(of,3),
                "species":None,
                "mycorrhizal_network_evidence":None,
                "evidence_limit":"LiDAR structural candidate only; not field verified."
              }
            })
        out.sort(key=lambda f:f["properties"]["structure_score"],reverse=True)
        vals=chm[np.isfinite(chm)&(chm>=2)]
        return out,{
          "all_peak_count":len(out),
          "p95_canopy_height_m":float(np.percentile(vals,95)) if vals.size else None,
          "p99_canopy_height_m":float(np.percentile(vals,99)) if vals.size else None,
          "crs":str(dsm.crs)
        }

def hav_m(a,b):
    lon1,lat1=a; lon2,lat2=b; R=6371008.8
    p1,p2=math.radians(lat1),math.radians(lat2)
    dp=math.radians(lat2-lat1); dl=math.radians(lon2-lon1)
    q=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(min(1,math.sqrt(q)))

def recall_at(cands,refs,n,radius):
    cp=[f["geometry"]["coordinates"] for f in cands[:min(n,len(cands))]]
    rp=[f["geometry"]["coordinates"] for f in refs]
    if not cp or not rp:return 0,0.0
    hit=sum(min(hav_m(q,p) for p in cp)<=radius for q in rp)
    return int(hit),float(hit/len(rp))

def validation(cands,refs):
    sweeps=[]
    for n in (100,200,400,800,1200,2000,4000):
        if n>len(cands) and sweeps: break
        rec={"top_n":min(n,len(cands))}
        for rad in (15,30,60):
            hit,rate=recall_at(cands,refs,n,rad)
            rec[f"ATI_hit_within_{rad}m"]=hit
            rec[f"ATI_recall_within_{rad}m"]=round(rate,4)
        sweeps.append(rec)
    # every structural peak gives an upper-bound on what this peak model can recover.
    upper={}
    for rad in (15,30,60):
        hit,rate=recall_at(cands,refs,len(cands),rad)
        upper[f"ATI_hit_within_{rad}m"]=hit
        upper[f"ATI_recall_within_{rad}m"]=round(rate,4)
    return {
      "candidate_peak_count":len(cands),
      "ATI_reference_count":len(refs),
      "rank_sweep":sweeps,
      "all_peaks_upper_bound":upper,
      "interpretation_rule":"ATI is incomplete, so unmatched Earthline candidates are not automatically false positives. ATI misses, however, are real calibration evidence."
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--bbox",required=True); ap.add_argument("--name",required=True); ap.add_argument("--out",required=True)
    ap.add_argument("--dsm",default=None,help="Optional existing authoritative DSM GeoTIFF")
    ap.add_argument("--dtm",default=None,help="Optional existing authoritative DTM GeoTIFF")
    args=ap.parse_args()
    bbox=tuple(float(x) for x in args.bbox.split(","))
    out=Path(args.out); out.mkdir(parents=True,exist_ok=True)
    tx=Transformer.from_crs(4326,27700,always_xy=True)
    minlon,minlat,maxlon,maxlat=bbox
    xs,ys=tx.transform([minlon,maxlon,maxlon,minlon],[minlat,minlat,maxlat,maxlat])
    b27700=(min(xs),min(ys),max(xs),max(ys))

    if args.dsm and args.dtm:
        dsm_path=Path(args.dsm); dtm_path=Path(args.dtm)
        if not dsm_path.exists() or not dtm_path.exists():
            raise RuntimeError("Supplied DSM/DTM artifact missing; fail closed")
        dsm_meta={"source":"reused successful Environment Agency LiDAR artifact","path":str(dsm_path)}
        dtm_meta={"source":"reused successful Environment Agency LiDAR artifact","path":str(dtm_path)}
    else:
        dsm_path=out/"dsm.tif"; dtm_path=out/"dtm.tif"
        dsm_meta=get_wcs_tif(DSM_WCS_OPTIONS,b27700,dsm_path)
        dtm_meta=get_wcs_tif(DTM_WCS,b27700,dtm_path)
    refs,ati_meta=fetch_ati(bbox)
    cands,chm_meta=structural_candidates(dsm_path,dtm_path)
    val=validation(cands,refs)

    # Keep a bounded point layer for visual inspection; full ranking remains in artifact only.
    display=cands[:min(1000,len(cands))]
    (out/"elder-tree-candidates.geojson").write_text(json.dumps({"type":"FeatureCollection","features":display},indent=2))
    (out/"ati-reference.geojson").write_text(json.dumps({"type":"FeatureCollection","features":refs},indent=2))
    summary={
      "pilot":args.name,"bbox_wgs84":bbox,"method_version":METHOD,"off_production":True,
      "dsm":dsm_meta,"dtm":dtm_meta,"ati":ati_meta,"canopy":chm_meta,
      "validation":val,
      "scientific_boundary":"Earthline output is GPS-point structural screening only. ATI points are external verified evidence; Earthline candidates remain unverified."
    }
    (out/"validation-summary.json").write_text(json.dumps(summary,indent=2))
    print(json.dumps(summary,indent=2))

if __name__=="__main__": main()
