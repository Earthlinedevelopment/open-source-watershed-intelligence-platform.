#!/usr/bin/env python3
"""
Earthline Elder Trees — Priority Europe validation.
OFF-PRODUCTION ONLY.

Primary benchmark:
England, Scotland, Ireland, Denmark, Norway, Sweden, France, Germany.

England/Scotland:
- direct Woodland Trust ATI Ancient/Veteran controls
- CHMv2 positional recovery around sampled verified records

Other regions:
- distributed CHMv2 candidate-generation smoke
- source/provenance sanity
"""
from __future__ import annotations
import argparse, json, math, os, statistics, sys
from pathlib import Path

import numpy as np
import requests
import rasterio
from rasterio.windows import from_bounds
from pyproj import Transformer
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
from chmv2_candidate_worker import process, hav

ATI="https://services-eu1.arcgis.com/WIfgdJeDbrZU1cnA/ArcGIS/rest/services/Ancient%20Tree%20Inventory%20%28ATI%29/FeatureServer/0"
CHM_ROOT="https://dataforgood-fb-data.s3.amazonaws.com/forests/v2/global/dinov3_global_chm_v2_ml3/chm/"
UA={"User-Agent":"Earthline-ElderTree-Research/1.8"}

REGIONS={
  "ENG":{"name":"England","mode":"ATI","bbox":(-3.3,50.0,1.8,55.75)},
  "SCT":{"name":"Scotland","mode":"ATI","bbox":(-8.2,55.80,-0.7,60.9)},
  "IRL":{"name":"Ireland","mode":"SMOKE","iso3":"IRL"},
  "DNK":{"name":"Denmark","mode":"SMOKE","iso3":"DNK"},
  "NOR":{"name":"Norway","mode":"SMOKE","iso3":"NOR"},
  "SWE":{"name":"Sweden","mode":"SMOKE","iso3":"SWE"},
  "FRA":{"name":"France","mode":"SMOKE","iso3":"FRA"},
  "DEU":{"name":"Germany","mode":"SMOKE","iso3":"DEU"}
}

COVERAGE=Path("data/elder-trees/generated/global/international-chmv2-coverage.json")
QUEUE=Path("data/elder-trees/generated/global/global-country-chmv2-tile-queue.json")
ACTUAL=Path("data/elder-trees/generated/global/chmv2-actual-tiles.json")

def ajson(url,params):
    r=requests.get(url,params=params,headers=UA,timeout=120)
    r.raise_for_status()
    d=r.json()
    if isinstance(d,dict) and d.get("error"):
        raise RuntimeError(json.dumps(d["error"]))
    return d

def ati_controls(bbox,maxn=60):
    minlon,minlat,maxlon,maxlat=bbox
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
      "resultOffset":"0"
    }
    raw=[]
    while True:
        d=ajson(ATI+"/query",params)
        batch=d.get("features") or []
        raw.extend(batch)
        if len(batch)<2000:break
        params["resultOffset"]=str(int(params["resultOffset"])+len(batch))
        if int(params["resultOffset"])>40000:break

    refs=[]
    for f in raw:
        a=f.get("attributes") or {}
        status=str(a.get("VeteranStatus") or "").strip()
        low=status.lower()
        if not (("ancient" in low or "veteran" in low) and "lost" not in low):
            continue
        lon=a.get("Longitude");lat=a.get("Latitude")
        if lon is None or lat is None:
            g=f.get("geometry") or {};lon=g.get("x");lat=g.get("y")
        try:lon=float(lon);lat=float(lat)
        except:continue
        refs.append({
          "lon":lon,"lat":lat,
          "status":status,
          "species":a.get("Species"),
          "source_id":a.get("Id")
        })

    # deterministic geographically spread sample by sorting then selecting evenly
    refs=sorted(refs,key=lambda r:(r["lat"],r["lon"]))
    if len(refs)>maxn:
        idx=[round(i*(len(refs)-1)/(maxn-1)) for i in range(maxn)]
        refs=[refs[i] for i in idx]
    return refs,len(raw)

def quadkey(lon,lat,z=10):
    lat=max(-85.05112878,min(85.05112878,lat))
    x=(lon+180)/360
    s=math.sin(math.radians(lat))
    y=.5-math.log((1+s)/(1-s))/(4*math.pi)
    n=1<<z;tx=int(min(n-1,max(0,x*n)));ty=int(min(n-1,max(0,y*n)))
    out=[]
    for i in range(z,0,-1):
        bit=1<<(i-1);d=0
        if tx&bit:d+=1
        if ty&bit:d+=2
        out.append(str(d))
    return "".join(out)

def local_peaks(control):
    q=quadkey(control["lon"],control["lat"])
    url=CHM_ROOT+q+".tif"
    vsi="/vsicurl/"+url
    try:
      with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif"):
       with rasterio.open(vsi) as ds:
        tx=Transformer.from_crs(4326,ds.crs,always_xy=True)
        x,y=tx.transform(control["lon"],control["lat"])
        rr=90
        w=from_bounds(x-rr,y-rr,x+rr,y+rr,ds.transform).round_offsets().round_lengths()
        a=ds.read(1,window=w,boundless=True,fill_value=0).astype("float32")
        tr=ds.window_transform(w)
        if ds.nodata is not None:a[a==ds.nodata]=np.nan
        a[(~np.isfinite(a))|(a<0)|(a>80)]=np.nan
        z=np.nan_to_num(a,nan=0)
        pix=max(abs(tr.a),abs(tr.e))
        sep=max(3,int(round(5/max(pix,.01))))
        if sep%2==0:sep+=1
        sm=ndimage.gaussian_filter(z,sigma=max(.8,min(3,1/max(pix,.01))))
        peak=(sm==ndimage.maximum_filter(sm,size=sep,mode="nearest"))&(sm>=5)
        rows,cols=np.where(peak)
        to4326=Transformer.from_crs(ds.crs,4326,always_xy=True)
        pts=[]
        for r,c in zip(rows.tolist(),cols.tolist()):
            px,py=rasterio.transform.xy(tr,r,c,offset="center")
            lon,lat=to4326.transform(px,py)
            h=float(a[r,c]) if np.isfinite(a[r,c]) else float(sm[r,c])
            pts.append((lon,lat,h))
        return q,pts,None
    except Exception as e:
        return q,[],str(e)

def validate_ati(region):
    refs,raw_count=ati_controls(region["bbox"],60)
    rows=[];errs=0
    for ref in refs:
        q,pts,err=local_peaks(ref)
        if err:
            errs+=1;rows.append({"ref":ref,"quadkey":q,"error":err});continue
        ds=[(hav((ref["lon"],ref["lat"]),(lon,lat)),h) for lon,lat,h in pts]
        ds.sort(key=lambda x:x[0])
        nearest=ds[0] if ds else None
        rows.append({
          "ref":ref,"quadkey":q,"candidate_peak_count":len(pts),
          "nearest_m":round(nearest[0],2) if nearest else None,
          "nearest_height_m":round(nearest[1],2) if nearest else None
        })
    valid=[r["nearest_m"] for r in rows if r.get("nearest_m") is not None]
    return {
      "mode":"ATI_DIRECT_CONTROL",
      "ati_query_raw_record_count":raw_count,
      "sampled_ancient_veteran_count":len(refs),
      "readable_control_count":len(valid),
      "tile_error_count":errs,
      "within_5m":sum(d<=5 for d in valid),
      "within_10m":sum(d<=10 for d in valid),
      "within_20m":sum(d<=20 for d in valid),
      "within_30m":sum(d<=30 for d in valid),
      "median_nearest_m":round(statistics.median(valid),2) if valid else None,
      "details":rows,
      "scientific_boundary":"ATI points are verified external references. Nearby CHMv2 peaks remain modeled candidates."
    }

def evenly(items,n):
    items=sorted(set(items))
    if len(items)<=n:return items
    idx=[round(i*(len(items)-1)/(n-1)) for i in range(n)]
    return [items[i] for i in idx]

def validate_smoke(region):
    coverage=json.loads(COVERAGE.read_text())
    queue=json.loads(QUEUE.read_text())
    actual=set(json.loads(ACTUAL.read_text()))
    iso=region["iso3"]
    crow=next((x for x in coverage if x.get("iso3")==iso),None)
    qrow=next((x for x in queue if x.get("iso3")==iso),None)
    assigned=(qrow or {}).get("quadkeys") or []
    available=sorted(q for q in assigned if q in actual)
    attempts=evenly(available,min(8,len(available))) if available else []
    tiles=[];features=[]
    for q in attempts:
        try:
            feats,meta=process(q,max_candidates=12,coarse_size=512)
            tiles.append(meta)
            if meta.get("status")=="OK":
                features.extend(feats)
            if len([x for x in tiles if x.get("status")=="OK"])>=3:
                break
        except Exception as e:
            tiles.append({"quadkey":q,"status":"ERROR","error":str(e)})
    hs=[float(f["properties"]["height_m"]) for f in features if f.get("properties",{}).get("height_m") is not None]
    return {
      "mode":"DISTRIBUTED_CHMV2_SMOKE",
      "boundary_tile_count":len(assigned),
      "actual_chmv2_tile_count":len(available),
      "attempted_tile_count":len(tiles),
      "successful_tile_count":sum(x.get("status")=="OK" for x in tiles),
      "candidate_count":len(features),
      "height_min_m":round(min(hs),2) if hs else None,
      "height_median_m":round(statistics.median(hs),2) if hs else None,
      "height_max_m":round(max(hs),2) if hs else None,
      "tiles":tiles,
      "scientific_boundary":"Candidate-generation smoke test only; no verified Elder Tree claim."
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--region",required=True,choices=sorted(REGIONS))
    ap.add_argument("--out",required=True)
    args=ap.parse_args()
    reg=REGIONS[args.region]
    if reg["mode"]=="ATI":
        result=validate_ati(reg)
    else:
        result=validate_smoke(reg)
    result={"region_code":args.region,"name":reg["name"],**result}
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    (out/f"{args.region.lower()}-priority-europe.json").write_text(json.dumps(result,indent=2,ensure_ascii=False))
    print(json.dumps(result,indent=2,ensure_ascii=False))

if __name__=="__main__":
    main()
