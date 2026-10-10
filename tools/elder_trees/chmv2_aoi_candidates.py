#!/usr/bin/env python3
"""
Earthline Elder Trees — worldwide AOI candidate query.
OFF-PRODUCTION ONLY.

Input: WGS84 bbox.
Output: sparse ELDER_TREE_CANDIDATE GPS points within that bbox from WRI/Meta CHMv2.

The browser/site does not process imagery. This is the preprocessing/service-side
shape of the future Elder Tree layer.
"""
from __future__ import annotations
import argparse, hashlib, json, math, os
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.windows import from_bounds, Window
from pyproj import Transformer
from scipy import ndimage
import requests

ROOT="https://dataforgood-fb-data.s3.amazonaws.com/forests/v2/global/dinov3_global_chm_v2_ml3/chm/"
METHOD="earthline-elder-tree-aoi-chmv2-v0.1"
UA={"User-Agent":"Earthline-ElderTree-Research/1.6"}

def tile_xy(lon,lat,z=10):
    lat=max(-85.05112878,min(85.05112878,lat)); n=1<<z
    x=int(min(n-1,max(0,(lon+180.0)/360.0*n)))
    s=math.sin(math.radians(lat))
    y=int(min(n-1,max(0,(0.5-math.log((1+s)/(1-s))/(4*math.pi))*n)))
    return x,y

def quadkey(x,y,z=10):
    out=[]
    for i in range(z,0,-1):
        bit=1<<(i-1);d=0
        if x&bit:d+=1
        if y&bit:d+=2
        out.append(str(d))
    return "".join(out)

def bbox_tiles(b,z=10):
    minlon,minlat,maxlon,maxlat=b
    x0,y1=tile_xy(minlon,minlat,z);x1,y0=tile_xy(maxlon,maxlat,z)
    return [quadkey(x,y,z) for y in range(min(y0,y1),max(y0,y1)+1) for x in range(min(x0,x1),max(x0,x1)+1)]

def exists(q):
    r=requests.head(ROOT+q+".tif",headers=UA,timeout=45)
    return r.status_code==200

def hav(a,b):
    lon1,lat1=a;lon2,lat2=b;R=6371008.8
    p1,p2=math.radians(lat1),math.radians(lat2)
    dp=math.radians(lat2-lat1);dl=math.radians(lon2-lon1)
    q=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(min(1,math.sqrt(q)))

def refine(ds,cx,cy,radius_m=45):
    col,row=~ds.transform*(cx,cy)
    pix=max(abs(ds.transform.a),abs(ds.transform.e))
    rr=max(10,int(round(radius_m/max(pix,.01))))
    win=Window(int(col)-rr,int(row)-rr,2*rr+1,2*rr+1)
    a=ds.read(1,window=win,boundless=True,fill_value=0).astype("float32")
    tr=ds.window_transform(win)
    a[(~np.isfinite(a))|(a<0)|(a>80)]=np.nan
    z=np.nan_to_num(a,nan=0)
    sep=max(3,int(round(5/max(pix,.01))))
    if sep%2==0:sep+=1
    sm=ndimage.gaussian_filter(z,sigma=max(.8,min(2.5,1/max(pix,.01))))
    peak=(sm==ndimage.maximum_filter(sm,size=sep,mode="nearest"))&(sm>=5)
    rows,cols=np.where(peak)
    best=None
    for r,c in zip(rows.tolist(),cols.tolist()):
        h=float(a[r,c]) if np.isfinite(a[r,c]) else float(sm[r,c])
        rad=max(5,int(round(18/max(pix,.01))))
        r0,r1=max(0,r-rad),min(a.shape[0],r+rad+1)
        c0,c1=max(0,c-rad),min(a.shape[1],c+rad+1)
        local=a[r0:r1,c0:c1];lv=local[np.isfinite(local)]
        med=float(np.median(lv)) if lv.size else 0
        emerg=max(0,h-med)
        openf=float(np.mean(np.nan_to_num(local,nan=0)<4))
        sub=np.nan_to_num(local,nan=0)
        lab,_=ndimage.label(sub>=max(3,h*.45))
        rr0,cc0=r-r0,c-c0; lid=lab[rr0,cc0] if 0<=rr0<lab.shape[0] and 0<=cc0<lab.shape[1] else 0
        area=float(np.sum(lab==lid)*abs(tr.a*tr.e)) if lid else 0
        x,y=rasterio.transform.xy(tr,r,c,offset="center")
        dist=((x-cx)**2+(y-cy)**2)**.5
        score=.45*h+.65*emerg+.025*min(area,800)+4*openf-.03*dist
        rec=(score,x,y,h,emerg,area,openf)
        if best is None or rec[0]>best[0]:best=rec
    return best

def process_tile(q,bbox,max_per_tile=20,screen_size=512):
    url=ROOT+q+".tif"
    if not exists(q):return [],{"quadkey":q,"status":"NO_TILE"}
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif"):
        with rasterio.open("/vsicurl/"+url) as ds:
            tx=Transformer.from_crs(4326,ds.crs,always_xy=True)
            minlon,minlat,maxlon,maxlat=bbox
            xs,ys=tx.transform([minlon,maxlon,maxlon,minlon],[minlat,minlat,maxlat,maxlat])
            left,bottom,right,top=min(xs),min(ys),max(xs),max(ys)
            # Intersect query AOI with this tile's native bounds.
            left=max(left,ds.bounds.left);right=min(right,ds.bounds.right)
            bottom=max(bottom,ds.bounds.bottom);top=min(top,ds.bounds.top)
            if left>=right or bottom>=top:return [],{"quadkey":q,"status":"NO_INTERSECTION"}
            win=from_bounds(left,bottom,right,top,ds.transform).round_offsets().round_lengths()
            wh=max(1,int(win.height));ww=max(1,int(win.width))
            aspect=ww/max(1,wh)
            if aspect>=1:
                ow=screen_size;oh=max(32,int(round(screen_size/aspect)))
            else:
                oh=screen_size;ow=max(32,int(round(screen_size*aspect)))
            arr=ds.read(1,window=win,out_shape=(oh,ow),resampling=Resampling.nearest).astype("float32")
            arr[(~np.isfinite(arr))|(arr<0)|(arr>80)]=np.nan
            z=np.nan_to_num(arr,nan=0)
            if np.nanmax(z)<5:return [],{"quadkey":q,"status":"NO_CANOPY"}
            med=ndimage.median_filter(z,size=9,mode="nearest")
            prom=np.maximum(0,z-med)
            vals=z[z>=5]; pcut=float(np.percentile(vals,80)) if vals.size else 999
            pvals=prom[z>=5]; ecut=float(np.percentile(pvals,75)) if pvals.size else 999
            score=(z/max(np.nanmax(z),1))*.55+(prom/max(np.nanmax(prom),1))*.45
            peak=(score==ndimage.maximum_filter(score,size=9,mode="nearest"))&(z>=pcut)&((prom>=ecut)|(z>=np.percentile(vals,95)))
            rows,cols=np.where(peak)
            all_ranked=sorted([(float(score[r,c]),r,c) for r,c in zip(rows.tolist(),cols.tolist())],reverse=True)
            ranked=all_ranked[:max_per_tile*3]
            reference_peak_count=len(all_ranked)
            # map screening pixel back to native source coordinate inside cropped window
            sx=win.width/ow;sy=win.height/oh
            screen_tr=ds.window_transform(win)*rasterio.Affine.scale(sx,sy)
            to4326=Transformer.from_crs(ds.crs,4326,always_xy=True)
            feats=[]
            for rank,(sc,r,c) in enumerate(ranked,1):
                cx,cy=rasterio.transform.xy(screen_tr,r,c,offset="center")
                ref=refine(ds,cx,cy)
                if not ref:continue
                structural,x,y,h,emerg,area,openf=ref
                lon,lat=to4326.transform(x,y)
                if not (minlon<=lon<=maxlon and minlat<=lat<=maxlat):continue
                if any(hav((lon,lat),f["geometry"]["coordinates"])<10 for f in feats):continue
                feats.append({
                  "type":"Feature","geometry":{"type":"Point","coordinates":[lon,lat]},
                  "properties":{
                    "record_class":"ELDER_TREE_CANDIDATE",
                    "verification_status":"modeled remote-sensing candidate only",
                    "source_class":"MODELED_CHMV2","source_name":"WRI/Meta CHMv2",
                    "source_url":url,"source_license":"CC BY 4.0",
                    "quadkey":q,"method_version":METHOD,"screen_rank":rank,
                    "screen_reference_peak_count":reference_peak_count,
                    "raw_structural_evidence_score":round(float(structural),4),
                    "elder_tree_confidence_pct":int(round(100.0*(1.0-(rank-1)/max(1,reference_peak_count-1)))) if reference_peak_count else None,
                    "confidence_pct":int(round(100.0*(1.0-(rank-1)/max(1,reference_peak_count-1)))) if reference_peak_count else None,
                    "confidence_definition":"Earthline Elder Tree Confidence is a local percentile: how strongly this structure ranks against other detected tree/canopy structures in the same analyzed source tile/AOI. It is not the probability that the tree is ancient, veteran, or a mycorrhizal hub.",
                    "height_m":round(h,2),"emergent_height_m":round(emerg,2),
                    "crown_area_proxy_m2":round(area,1),"open_context_fraction":round(openf,3),
                    "evidence_limit":"Candidate only; modeled canopy structure is not proof of age or mycorrhizal hub status."
                  }
                })
                if len(feats)>=max_per_tile:break
            return feats,{"quadkey":q,"status":"OK","candidate_count":len(feats),"screen_shape":[oh,ow]}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--bbox",required=True,help="minlon,minlat,maxlon,maxlat")
    ap.add_argument("--out",required=True)
    ap.add_argument("--max-per-tile",type=int,default=20)
    args=ap.parse_args()
    bbox=tuple(float(x) for x in args.bbox.split(","))
    if bbox[0]>=bbox[2] or bbox[1]>=bbox[3]:raise SystemExit("invalid bbox")
    qs=bbox_tiles(bbox)
    # protect service shape: Earthline searches should remain bounded
    if len(qs)>64:raise SystemExit(f"AOI spans {len(qs)} CHMv2 tiles; split into bounded requests")
    feats=[];tiles=[]
    for q in qs:
        f,m=process_tile(q,bbox,args.max_per_tile);feats.extend(f);tiles.append(m)
    ded=[]
    for f in sorted(feats,key=lambda x:x["properties"].get("height_m",0),reverse=True):
        p=f["geometry"]["coordinates"]
        if all(hav(p,g["geometry"]["coordinates"])>=10 for g in ded):ded.append(f)

    key=hashlib.sha256((METHOD+"|"+",".join(map(str,bbox))).encode()).hexdigest()[:16]
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    fc={"type":"FeatureCollection","features":ded}
    meta={"mode":"off-production","method_version":METHOD,"bbox":bbox,"cache_key":key,
          "requested_tiles":qs,"tile_results":tiles,"candidate_count":len(ded),
          "scientific_boundary":"All output points are unverified Elder Tree Candidates."}
    (out/f"elder-trees-{key}.geojson").write_text(json.dumps(fc,indent=2))
    (out/f"elder-trees-{key}.json").write_text(json.dumps(meta,indent=2))
    print(json.dumps(meta,indent=2))

if __name__=="__main__":main()
