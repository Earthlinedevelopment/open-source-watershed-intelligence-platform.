#!/usr/bin/env python3
"""
Earthline Elder Trees — CHMv2 cross-calibration against England + Vermont controls.
OFF-PRODUCTION ONLY.

Controls:
- England: Woodland Trust ATI Ancient/Veteran records in the Windsor pilot AOI.
- Vermont: exact public-map filter (public_access='yes' AND Champion='yes').

CHMv2 remains modeled candidate evidence only.
"""
from __future__ import annotations
import json, math, os, re, sys
from pathlib import Path
import numpy as np
import requests
import rasterio
from rasterio.windows import from_bounds
from pyproj import Transformer
from scipy import ndimage

UA={"User-Agent":"Earthline-ElderTree-Research/1.2"}
CHM_ROOT="https://dataforgood-fb-data.s3.amazonaws.com/forests/v2/global/dinov3_global_chm_v2_ml3/chm/"
ATI="https://services-eu1.arcgis.com/WIfgdJeDbrZU1cnA/ArcGIS/rest/services/Ancient%20Tree%20Inventory%20%28ATI%29/FeatureServer/0"
VT="https://services5.arcgis.com/Uzks6LSde6r23wwG/arcgis/rest/services/Big_Tree_Survey_View/FeatureServer/0"
VT_WHERE="(public_access = 'yes') AND (Champion = 'yes')"
WINDSOR=(-0.615,51.420,-0.575,51.450)
METHOD="earthline-elder-tree-chmv2-calibration-v0.2"

def quadkey(lon,lat,z=10):
    lat=max(-85.05112878,min(85.05112878,lat))
    x=(lon+180.0)/360.0
    sinlat=math.sin(math.radians(lat))
    y=0.5-math.log((1+sinlat)/(1-sinlat))/(4*math.pi)
    mapn=1<<z
    tx=int(min(mapn-1,max(0,x*mapn)))
    ty=int(min(mapn-1,max(0,y*mapn)))
    out=[]
    for i in range(z,0,-1):
        bit=1<<(i-1); d=0
        if tx&bit:d+=1
        if ty&bit:d+=2
        out.append(str(d))
    return "".join(out)

def ajson(url,params):
    r=requests.get(url,params=params,headers=UA,timeout=120); r.raise_for_status()
    d=r.json()
    if isinstance(d,dict) and d.get("error"): raise RuntimeError(json.dumps(d["error"]))
    return d

def england_controls():
    minlon,minlat,maxlon,maxlat=WINDSOR
    params={
      "where":"1=1","geometry":f"{minlon},{minlat},{maxlon},{maxlat}",
      "geometryType":"esriGeometryEnvelope","inSR":"4326",
      "spatialRel":"esriSpatialRelIntersects","outFields":"*",
      "returnGeometry":"true","outSR":"4326","f":"json",
      "resultRecordCount":"2000","resultOffset":"0"
    }
    raw=[]
    while True:
        d=ajson(ATI+"/query",params); batch=d.get("features") or []; raw.extend(batch)
        if len(batch)<2000:break
        params["resultOffset"]=str(int(params["resultOffset"])+len(batch))
    out=[]
    for f in raw:
        a=f.get("attributes") or {}
        status=str(a.get("VeteranStatus") or "")
        low=status.lower()
        if not (("ancient" in low or "veteran" in low) and "lost" not in low): continue
        lon=a.get("Longitude"); lat=a.get("Latitude")
        if lon is None or lat is None:
            g=f.get("geometry") or {}; lon=g.get("x");lat=g.get("y")
        try: lon=float(lon);lat=float(lat)
        except: continue
        out.append({"lon":lon,"lat":lat,"kind":"ATI Ancient/Veteran","measured_height_m":a.get("MeasuredHeight")})
    return out

def vt_controls():
    d=ajson(VT+"/query",{
      "where":VT_WHERE,"outFields":"*","returnGeometry":"true","outSR":"4326",
      "f":"json","resultRecordCount":"500"
    })
    out=[]
    for f in d.get("features") or []:
        g=f.get("geometry") or {};a=f.get("attributes") or {}
        lon,lat=g.get("x"),g.get("y")
        if lon is None or lat is None:continue
        h=a.get("total_height")
        try:h=float(h)*0.3048 if h not in (None,"") else None
        except:h=None
        out.append({"lon":float(lon),"lat":float(lat),"kind":"Vermont public champion tree","measured_height_m":h})
    return out

def hav(a,b):
    lon1,lat1=a;lon2,lat2=b;R=6371008.8
    p1,p2=math.radians(lat1),math.radians(lat2)
    dp=math.radians(lat2-lat1);dl=math.radians(lon2-lon1)
    q=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(min(1,math.sqrt(q)))

def peaks_for_control(control):
    q=quadkey(control["lon"],control["lat"],10)
    url=CHM_ROOT+q+".tif"
    vsi="/vsicurl/"+url
    try:
        with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif"):
            with rasterio.open(vsi) as ds:
                tx=Transformer.from_crs(4326,ds.crs,always_xy=True)
                x,y=tx.transform(control["lon"],control["lat"])
                r=90.0
                w=from_bounds(x-r,y-r,x+r,y+r,ds.transform).round_offsets().round_lengths()
                arr=ds.read(1,window=w,boundless=True,fill_value=ds.nodata if ds.nodata is not None else 0).astype("float32")
                tr=ds.window_transform(w)
                if ds.nodata is not None:arr[arr==ds.nodata]=np.nan
                arr[(~np.isfinite(arr))|(arr<0)|(arr>80)]=np.nan
                z=np.nan_to_num(arr,nan=0.0)
                # derive pixel-scaled separation ~5 m
                pix=max(abs(tr.a),abs(tr.e))
                sep=max(3,int(round(5.0/max(pix,0.01))))
                if sep%2==0:sep+=1
                sigma=max(.7,1.0/max(pix,0.01))
                sm=ndimage.gaussian_filter(z,sigma=min(4.0,sigma))
                peak=(sm==ndimage.maximum_filter(sm,size=sep,mode="nearest"))&(sm>=5.0)
                rows,cols=np.where(peak)
                to4326=Transformer.from_crs(ds.crs,4326,always_xy=True)
                pts=[]
                for rr,cc in zip(rows.tolist(),cols.tolist()):
                    px,py=rasterio.transform.xy(tr,rr,cc,offset="center")
                    lon,lat=to4326.transform(px,py)
                    h=float(arr[rr,cc]) if np.isfinite(arr[rr,cc]) else float(sm[rr,cc])
                    rad=max(6,int(round(22.0/max(pix,0.01))))
                    r0,r1=max(0,rr-rad),min(arr.shape[0],rr+rad+1)
                    c0,c1=max(0,cc-rad),min(arr.shape[1],cc+rad+1)
                    local=arr[r0:r1,c0:c1]
                    lv=local[np.isfinite(local)]
                    med=float(np.median(lv)) if lv.size else 0.0
                    emerg=max(0.0,h-med)
                    open_fraction=float(np.mean(np.nan_to_num(local,nan=0.0)<4.0))
                    sub=np.nan_to_num(local,nan=0.0)
                    mask=sub>=max(3.0,h*0.45)
                    lab,_=ndimage.label(mask)
                    rrr,ccc=rr-r0,cc-c0
                    labid=lab[rrr,ccc] if 0<=rrr<lab.shape[0] and 0<=ccc<lab.shape[1] else 0
                    crown_px=int(np.sum(lab==labid)) if labid>0 else 0
                    crown_area=crown_px*abs(tr.a*tr.e)
                    pts.append({"lon":lon,"lat":lat,"h":h,"emerg":emerg,"open":open_fraction,"crown":crown_area})
                if pts:
                    def pct(vals):
                        vals=np.asarray(vals,dtype=float)
                        order=np.argsort(vals)
                        ranks=np.empty(len(vals),dtype=float);ranks[order]=np.arange(len(vals),dtype=float)
                        return 100.0*(ranks+1)/len(vals)
                    hp=pct([p["h"] for p in pts]); ep=pct([p["emerg"] for p in pts])
                    op=pct([p["open"] for p in pts]); cp=pct([p["crown"] for p in pts])
                    for i,p in enumerate(pts):
                        p["score"]=float(.20*hp[i]+.30*cp[i]+.25*ep[i]+.25*op[i])
                return q,url,str(ds.crs),pix,pts,None
    except Exception as e:
        return q,url,None,None,[],str(e)

def validate(label,controls):
    rows=[]; tile_errors={}
    for i,c in enumerate(controls):
        q,url,crs,pix,pts,err=peaks_for_control(c)
        if err:
            tile_errors[q]=err
            rows.append({"index":i,"quadkey":q,"tile_error":err,"nearest_m":None})
            continue
        nearest=None
        for p in pts:
            d=hav((c["lon"],c["lat"]),(p["lon"],p["lat"]))
            if nearest is None or d<nearest[0]:nearest=(d,p)
        score_rank=None
        if nearest and pts:
            ordered=sorted(pts,key=lambda p:p.get("score",0),reverse=True)
            try:score_rank=ordered.index(nearest[1])+1
            except:score_rank=None
        row={
          "index":i,"quadkey":q,"candidate_count":len(pts),
          "nearest_m":round(nearest[0],2) if nearest else None,
          "candidate_height_m":round(nearest[1]["h"],2) if nearest else None,
          "candidate_score":round(nearest[1].get("score",0),2) if nearest else None,
          "candidate_score_rank":score_rank,
          "candidate_score_percentile_from_top":round(100.0*score_rank/max(1,len(pts)),2) if score_rank else None,
          "measured_height_m":c.get("measured_height_m"),"pixel_size":pix
        }
        if nearest and c.get("measured_height_m") is not None:
            try:row["height_error_m"]=round(nearest[1]["h"]-float(c["measured_height_m"]),2)
            except:pass
        for keep_pct in (5,10,20,40,100):
            n=max(1,int(math.ceil(len(pts)*keep_pct/100.0))) if pts else 0
            kept=sorted(pts,key=lambda p:p.get("score",0),reverse=True)[:n]
            hit=min((hav((c["lon"],c["lat"]),(p["lon"],p["lat"])) for p in kept),default=1e9)
            row[f"top_{keep_pct}pct_hit_20m"]=bool(hit<=20)
            row[f"top_{keep_pct}pct_hit_10m"]=bool(hit<=10)
        rows.append(row)
    ds=[r["nearest_m"] for r in rows if r.get("nearest_m") is not None]
    he=[abs(r["height_error_m"]) for r in rows if r.get("height_error_m") is not None]
    rank_sweep={}
    for keep_pct in (5,10,20,40,100):
        rank_sweep[str(keep_pct)]={
          "hit_10m":sum(bool(r.get(f"top_{keep_pct}pct_hit_10m")) for r in rows),
          "hit_20m":sum(bool(r.get(f"top_{keep_pct}pct_hit_20m")) for r in rows)
        }
    summary={
      "label":label,"control_count":len(controls),
      "controls_with_readable_CHMv2_tile":len(ds),
      "within_5m":sum(d<=5 for d in ds),
      "within_10m":sum(d<=10 for d in ds),
      "within_20m":sum(d<=20 for d in ds),
      "within_30m":sum(d<=30 for d in ds),
      "median_nearest_m":round(float(np.median(ds)),2) if ds else None,
      "median_abs_height_error_m":round(float(np.median(he)),2) if he else None,
      "median_control_peak_rank_percentile_from_top":round(float(np.median([r["candidate_score_percentile_from_top"] for r in rows if r.get("candidate_score_percentile_from_top") is not None])),2) if rows else None,
      "rank_sweep":rank_sweep,
      "tile_error_count":len(tile_errors)
    }
    return rows,summary

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-chmv2-calibration")
    out.mkdir(parents=True,exist_ok=True)
    eng=england_controls();vt=vt_controls()
    erows,es=validate("England ATI Ancient/Veteran",eng)
    vrows,vs=validate("Vermont public champion trees",vt)
    result={
      "mode":"off-production","method_version":METHOD,
      "source":"WRI/Meta CHMv2 modeled sub-meter canopy height","license":"CC BY 4.0",
      "england":es,"vermont":vs,
      "gate":{
        "decision":"POSITIONAL_PASS_RANKING_UNDER_TEST",
        "rule":"CHMv2 has passed a positional candidate-location gate in England and Vermont. Global publication remains blocked until a sparse ranking threshold is selected; never verified points."
      }
    }
    (out/"england-detail.json").write_text(json.dumps(erows,indent=2,default=str))
    (out/"vermont-detail.json").write_text(json.dumps(vrows,indent=2,default=str))
    (out/"chmv2-cross-calibration-summary.json").write_text(json.dumps(result,indent=2))
    print(json.dumps(result,indent=2))

if __name__=="__main__":main()
