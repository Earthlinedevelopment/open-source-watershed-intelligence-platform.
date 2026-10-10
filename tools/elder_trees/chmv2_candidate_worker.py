#!/usr/bin/env python3
"""
Earthline Elder Trees — CHMv2 sparse candidate worker.
OFF-PRODUCTION RESEARCH ONLY.

Input: one CHMv2 zoom-10 quadkey.
Output: sparse ELDER_TREE_CANDIDATE GPS points.

Architecture:
1. Read a coarse max-height overview from the COG.
2. Select spatially separated exceptional canopy cells.
3. Re-open only small native-resolution windows around those cells.
4. Place one precise candidate point per selected structure.
5. Preserve modeled-source provenance and uncertainty.

No point from this worker is VERIFIED.
"""

from __future__ import annotations
import argparse, json, math, os
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.windows import Window
from rasterio.transform import Affine
from pyproj import Transformer
from scipy import ndimage

ROOT="https://dataforgood-fb-data.s3.amazonaws.com/forests/v2/global/dinov3_global_chm_v2_ml3/chm/"
METHOD="earthline-chmv2-sparse-candidate-v0.1"

def percentile_rank(a,mask):
    vals=a[mask]
    out=np.zeros(a.shape,dtype="float32")
    if vals.size==0:return out
    order=np.argsort(vals)
    ranks=np.empty(vals.size,dtype="float32")
    ranks[order]=(np.arange(vals.size,dtype="float32")+1)/vals.size
    out[mask]=ranks
    return out

def hav(a,b):
    lon1,lat1=a;lon2,lat2=b;R=6371008.8
    p1,p2=math.radians(lat1),math.radians(lat2)
    dp=math.radians(lat2-lat1);dl=math.radians(lon2-lon1)
    q=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(min(1,math.sqrt(q)))

def native_candidate(ds,cx,cy,radius_m=70.0):
    # cx/cy are source-CRS coordinates.
    col,row=~ds.transform*(cx,cy)
    px=max(abs(ds.transform.a),abs(ds.transform.e))
    rr=max(12,int(round(radius_m/max(px,0.01))))
    win=Window(int(col)-rr,int(row)-rr,2*rr+1,2*rr+1)
    arr=ds.read(1,window=win,boundless=True,fill_value=ds.nodata if ds.nodata is not None else 0).astype("float32")
    tr=ds.window_transform(win)
    if ds.nodata is not None:arr[arr==ds.nodata]=np.nan
    arr[(~np.isfinite(arr))|(arr<0)|(arr>80)]=np.nan
    z=np.nan_to_num(arr,nan=0.0)
    sep=max(3,int(round(5.0/max(px,0.01))))
    if sep%2==0:sep+=1
    sm=ndimage.gaussian_filter(z,sigma=max(.8,min(3.0,1.0/max(px,0.01))))
    peak=(sm==ndimage.maximum_filter(sm,size=sep,mode="nearest"))&(sm>=5.0)
    rows,cols=np.where(peak)
    if not len(rows):return None

    best=None
    for r,c in zip(rows.tolist(),cols.tolist()):
        h=float(arr[r,c]) if np.isfinite(arr[r,c]) else float(sm[r,c])
        rad=max(6,int(round(20.0/max(px,0.01))))
        r0,r1=max(0,r-rad),min(arr.shape[0],r+rad+1)
        c0,c1=max(0,c-rad),min(arr.shape[1],c+rad+1)
        local=arr[r0:r1,c0:c1]
        lv=local[np.isfinite(local)]
        med=float(np.median(lv)) if lv.size else 0.0
        emerg=max(0.0,h-med)
        open_fraction=float(np.mean(np.nan_to_num(local,nan=0.0)<4.0))
        sub=np.nan_to_num(local,nan=0.0)
        mask=sub>=max(3.0,h*0.45)
        lab,_=ndimage.label(mask)
        rr0,cc0=r-r0,c-c0
        labid=lab[rr0,cc0] if 0<=rr0<lab.shape[0] and 0<=cc0<lab.shape[1] else 0
        crown_px=int(np.sum(lab==labid)) if labid>0 else 0
        crown_area=float(crown_px*abs(tr.a*tr.e))
        x,y=rasterio.transform.xy(tr,r,c,offset="center")
        # This is a structural score only. It is not a probability of age.
        score=0.45*h+0.65*emerg+0.025*min(crown_area,800)+4.0*open_fraction
        d=((x-cx)**2+(y-cy)**2)**0.5
        # prefer high structural score while keeping the selected coarse cell local
        objective=score-0.03*d
        rec={"x":x,"y":y,"height_m":h,"emergent_height_m":emerg,
             "crown_area_proxy_m2":crown_area,"open_context_fraction":open_fraction,
             "structural_score":score,"objective":objective}
        if best is None or rec["objective"]>best["objective"]:best=rec
    return best

def process(quadkey,max_candidates=50,coarse_size=512):
    url=ROOT+quadkey+".tif"
    vsi="/vsicurl/"+url
    os.environ.setdefault("GDAL_DISABLE_READDIR_ON_OPEN","EMPTY_DIR")
    os.environ.setdefault("CPL_VSIL_CURL_ALLOWED_EXTENSIONS",".tif")
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif"):
        with rasterio.open(vsi) as ds:
            # CHMv2 COGs provide built-in overviews through 64x (512px for a 32768px tile).
            # Read that overview directly for screening; refine only selected structures at native resolution.
            coarse_transform=ds.transform*Affine.scale(ds.width/coarse_size,ds.height/coarse_size)
            arr=ds.read(
              1,
              out_shape=(coarse_size,coarse_size),
              resampling=Resampling.nearest
            ).astype("float32")
            if ds.nodata is not None:arr[arr==ds.nodata]=np.nan
            arr[(~np.isfinite(arr))|(arr<0)|(arr>80)]=np.nan
            mask=np.isfinite(arr)&(arr>=5)
            if not np.any(mask):
                return [],{"quadkey":quadkey,"source_url":url,"status":"NO_CANOPY"}

            z=np.nan_to_num(arr,nan=0.0)
            med=ndimage.median_filter(z,size=9,mode="nearest")
            prom=np.maximum(0,z-med)
            hp=percentile_rank(z,mask)
            pp=percentile_rank(prom,mask)
            coarse_score=np.zeros(z.shape,dtype="float32")
            coarse_score[mask]=0.62*hp[mask]+0.38*pp[mask]

            # Non-max suppress over a ~9-cell neighborhood so one broad crown/hotspot
            # does not monopolize the candidate budget.
            mx=ndimage.maximum_filter(coarse_score,size=9,mode="nearest")
            peaks=mask&(coarse_score==mx)
            rows,cols=np.where(peaks)
            ranked=sorted(
              [(float(coarse_score[r,c]),r,c,float(z[r,c]),float(prom[r,c])) for r,c in zip(rows.tolist(),cols.tolist())],
              reverse=True
            )[:max_candidates*2]

            sx=ds.width/coarse_size;sy=ds.height/coarse_size
            ctr=ds.transform*Affine.scale(sx,sy)
            to4326=Transformer.from_crs(ds.crs,4326,always_xy=True)
            feats=[]
            for coarse_rank,(cs,r,c,h,promv) in enumerate(ranked,1):
                cx,cy=rasterio.transform.xy(ctr,r,c,offset="center")
                refined=native_candidate(ds,cx,cy)
                if not refined:continue
                lon,lat=to4326.transform(refined["x"],refined["y"])
                # Deduplicate nearby refined peaks.
                if any(hav((lon,lat),f["geometry"]["coordinates"])<10 for f in feats):
                    continue
                feats.append({
                  "type":"Feature",
                  "geometry":{"type":"Point","coordinates":[lon,lat]},
                  "properties":{
                    "record_class":"ELDER_TREE_CANDIDATE",
                    "verification_status":"modeled remote-sensing candidate only",
                    "source_class":"MODELED_CHMV2",
                    "source_name":"WRI/Meta CHMv2",
                    "source_url":url,
                    "source_license":"CC BY 4.0",
                    "method_version":METHOD,
                    "quadkey":quadkey,
                    "coarse_rank":coarse_rank,
                    "coarse_score":round(cs,5),
                    "height_m":round(refined["height_m"],2),
                    "emergent_height_m":round(refined["emergent_height_m"],2),
                    "crown_area_proxy_m2":round(refined["crown_area_proxy_m2"],1),
                    "open_context_fraction":round(refined["open_context_fraction"],3),
                    "structure_score":round(refined["structural_score"],2),
                    "evidence_limit":"Modeled canopy structure; not field verified, not LiDAR-confirmed, and not proof of age or mycorrhizal hub status."
                  }
                })
                if len(feats)>=max_candidates:break

            meta={
              "quadkey":quadkey,"source_url":url,"status":"OK",
              "source_crs":str(ds.crs),"native_resolution":[abs(ds.transform.a),abs(ds.transform.e)],
              "coarse_size":coarse_size,"max_candidates":max_candidates,
              "candidate_count":len(feats),"method_version":METHOD
            }
            return feats,meta

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--quadkey",required=True)
    ap.add_argument("--out",required=True)
    ap.add_argument("--max-candidates",type=int,default=50)
    ap.add_argument("--coarse-size",type=int,default=512)
    args=ap.parse_args()
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    feats,meta=process(args.quadkey,args.max_candidates,args.coarse_size)
    (out/f"{args.quadkey}.geojson").write_text(json.dumps({"type":"FeatureCollection","features":feats},indent=2))
    (out/f"{args.quadkey}.json").write_text(json.dumps(meta,indent=2))
    print(json.dumps(meta,indent=2))

if __name__=="__main__":main()
