#!/usr/bin/env python3
"""
Earthline Elder Trees — validate Elder Tree Confidence against Woodland Trust ATI.
OFF-PRODUCTION ONLY.

Input:
- a dense Earthline CHMv2 candidate GeoJSON for the Windsor pilot AOI.

Reference:
- Woodland Trust ATI Ancient/Veteran records in the same AOI.

Outputs:
- positional recovery at 10/20/30 m;
- Elder Tree Confidence distribution for candidates matched to ATI controls;
- comparison with the whole Earthline candidate set.

Scientific boundary:
This validates relative structural evidence against known Ancient/Veteran points.
It does not turn unmatched candidates into verified Elder Trees.
"""
from __future__ import annotations
import argparse, json, math
from pathlib import Path
import requests

ATI="https://services-eu1.arcgis.com/WIfgdJeDbrZU1cnA/ArcGIS/rest/services/Ancient%20Tree%20Inventory%20%28ATI%29/FeatureServer/0"
BBOX=(-0.615,51.420,-0.575,51.450)
UA={"User-Agent":"Earthline-ElderTree-Research/1.9"}

def ajson(url,params):
    r=requests.get(url,params=params,headers=UA,timeout=120)
    r.raise_for_status()
    d=r.json()
    if isinstance(d,dict) and d.get("error"):raise RuntimeError(json.dumps(d["error"]))
    return d

def controls():
    minlon,minlat,maxlon,maxlat=BBOX
    params={
      "where":"1=1",
      "geometry":f"{minlon},{minlat},{maxlon},{maxlat}",
      "geometryType":"esriGeometryEnvelope",
      "inSR":"4326","spatialRel":"esriSpatialRelIntersects",
      "outFields":"Id,VeteranStatus,Species,Longitude,Latitude",
      "returnGeometry":"true","outSR":"4326","f":"json",
      "resultRecordCount":"2000","resultOffset":"0"
    }
    raw=[]
    while True:
        d=ajson(ATI+"/query",params); batch=d.get("features") or [];raw.extend(batch)
        if len(batch)<2000:break
        params["resultOffset"]=str(int(params["resultOffset"])+len(batch))
    out=[]
    for f in raw:
        a=f.get("attributes") or {}
        status=str(a.get("VeteranStatus") or "")
        low=status.lower()
        if not (("ancient" in low or "veteran" in low) and "lost" not in low):continue
        lon=a.get("Longitude");lat=a.get("Latitude")
        if lon is None or lat is None:
            g=f.get("geometry") or {};lon=g.get("x");lat=g.get("y")
        try:lon=float(lon);lat=float(lat)
        except:continue
        out.append({"id":a.get("Id"),"status":status,"species":a.get("Species"),"lon":lon,"lat":lat})
    return out

def hav(a,b):
    lon1,lat1=a;lon2,lat2=b;R=6371008.8
    p1,p2=math.radians(lat1),math.radians(lat2)
    dp=math.radians(lat2-lat1);dl=math.radians(lon2-lon1)
    q=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(min(1,math.sqrt(q)))

def percentile(vals,p):
    if not vals:return None
    s=sorted(float(x) for x in vals)
    if len(s)==1:return s[0]
    k=(len(s)-1)*p/100
    a=int(math.floor(k));b=int(math.ceil(k))
    if a==b:return s[a]
    return s[a]*(b-k)+s[b]*(k-a)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--candidates",required=True)
    ap.add_argument("--out",required=True)
    args=ap.parse_args()
    fc=json.loads(Path(args.candidates).read_text())
    feats=fc.get("features") or []
    cand=[]
    for f in feats:
        g=f.get("geometry") or {};p=f.get("properties") or {}
        if g.get("type")!="Point":continue
        xy=g.get("coordinates") or []
        if len(xy)<2:continue
        conf=p.get("elder_tree_confidence_pct",p.get("confidence_pct"))
        cand.append({"lon":float(xy[0]),"lat":float(xy[1]),"confidence":float(conf) if conf is not None else None,
                     "height_m":p.get("height_m"),"method":p.get("method_version")})
    refs=controls()
    detail=[]
    for r in refs:
        nearest=None
        for c in cand:
            d=hav((r["lon"],r["lat"]),(c["lon"],c["lat"]))
            if nearest is None or d<nearest[0]:nearest=(d,c)
        detail.append({
          **r,
          "nearest_m":round(nearest[0],2) if nearest else None,
          "matched_confidence":nearest[1]["confidence"] if nearest and nearest[0]<=30 else None,
          "matched_height_m":nearest[1]["height_m"] if nearest and nearest[0]<=30 else None
        })
    ds=[x["nearest_m"] for x in detail if x["nearest_m"] is not None]
    matched20=[x["matched_confidence"] for x in detail if x["nearest_m"] is not None and x["nearest_m"]<=20 and x["matched_confidence"] is not None]
    allc=[x["confidence"] for x in cand if x["confidence"] is not None]
    summary={
      "mode":"off-production",
      "ati_control_count":len(refs),
      "candidate_count":len(cand),
      "within_10m":sum(d<=10 for d in ds),
      "within_20m":sum(d<=20 for d in ds),
      "within_30m":sum(d<=30 for d in ds),
      "median_nearest_m":round(percentile(ds,50),2) if ds else None,
      "ati_matched_confidence_20m":{
        "count":len(matched20),
        "min":min(matched20) if matched20 else None,
        "p25":round(percentile(matched20,25),1) if matched20 else None,
        "median":round(percentile(matched20,50),1) if matched20 else None,
        "p75":round(percentile(matched20,75),1) if matched20 else None,
        "max":max(matched20) if matched20 else None
      },
      "all_candidate_confidence":{
        "count":len(allc),
        "min":min(allc) if allc else None,
        "p25":round(percentile(allc,25),1) if allc else None,
        "median":round(percentile(allc,50),1) if allc else None,
        "p75":round(percentile(allc,75),1) if allc else None,
        "max":max(allc) if allc else None
      },
      "rule":"Elder Tree Confidence is a local relative structural-evidence index, not probability of age or Ancient/Veteran status."
    }
    out=Path(args.out);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps({"summary":summary,"detail":detail},indent=2))
    print(json.dumps(summary,indent=2))

if __name__=="__main__":main()
