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
METHOD="earthline-elder-tree-aoi-chmv2-v0.4-local-evidence-index"
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

def refine(ds,cx,cy,canopy_floor_m=2.0,radius_m=45):
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
    peak=(sm==ndimage.maximum_filter(sm,size=sep,mode="nearest"))&(sm>=canopy_floor_m)
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
        lab,_=ndimage.label(sub>=max(1.5,canopy_floor_m*.75,h*.45))
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
            woody=z[z>=1.5]
            if woody.size<8:return [],{"quadkey":q,"status":"NO_CANOPY"}
            # Local-relative canopy floor: dry/alpine stands are not forced to meet
            # the same absolute height profile as humid/tall forests.
            canopy_floor_m=float(max(2.0,min(5.0,np.percentile(woody,25))))
            canopy=z>=canopy_floor_m
            vals=z[canopy]
            if vals.size<8:return [],{"quadkey":q,"status":"NO_CANOPY","canopy_floor_m":round(canopy_floor_m,2)}
            med=ndimage.median_filter(z,size=9,mode="nearest")
            prom=np.maximum(0,z-med)
            pvals=prom[canopy]
            hs=np.sort(vals); ps=np.sort(pvals)
            h_pct=np.zeros_like(z,dtype="float32")
            p_pct=np.zeros_like(z,dtype="float32")
            h_pct[canopy]=np.searchsorted(hs,z[canopy],side="right")/max(1,len(hs))
            p_pct[canopy]=np.searchsorted(ps,prom[canopy],side="right")/max(1,len(ps))
            local_density=ndimage.uniform_filter(canopy.astype("float32"),size=9,mode="nearest")
            open_context=np.clip(1.0-local_density,0.0,1.0)
            score=np.zeros_like(z,dtype="float32")
            score[canopy]=.40*h_pct[canopy]+.35*p_pct[canopy]+.25*open_context[canopy]
            eligible=canopy&(h_pct>=.70)&((p_pct>=.65)|(open_context>=.60))
            peak=(score==ndimage.maximum_filter(score,size=9,mode="nearest"))&eligible
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
                ref=refine(ds,cx,cy,canopy_floor_m=canopy_floor_m)
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
                    "local_canopy_floor_m":round(canopy_floor_m,2),
                    "raw_structural_evidence_score":round(float(structural),4),
                    "elder_tree_confidence_pct":int(round(max(0.0,min(100.0,100.0*sc)))),
                    "confidence_pct":int(round(max(0.0,min(100.0,100.0*sc)))),
                    "confidence_definition":"Earthline Elder Tree Confidence is a local relative structural-evidence index built from height rank, local prominence rank, and open-grown context in the analyzed area. It is not the probability that the tree is ancient, veteran, or a mycorrhizal hub.",
                    "height_m":round(h,2),"emergent_height_m":round(emerg,2),
                    "crown_area_proxy_m2":round(area,1),"open_context_fraction":round(openf,3),
                    "evidence_limit":"Candidate only; modeled canopy structure is not proof of age or mycorrhizal hub status."
                  }
                })
                if len(feats)>=max_per_tile:break
            return feats,{"quadkey":q,"status":"OK","candidate_count":len(feats),"screen_shape":[oh,ow],"canopy_floor_m":round(canopy_floor_m,2),"reference_peak_count":reference_peak_count}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--bbox",required=True,help="minlon,minlat,maxlon,maxlat")
    ap.add_argument("--out",required=True)
    ap.add_argument("--max-per-tile",type=int,default=20,help="Candidate-pool limit per source tile after native refinement")
    ap.add_argument("--display-per-tile",type=int,default=None,help="Optional sparse map-display limit per tile; does not change candidate-pool count")
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

    # Candidate-pool evidence and map-display density are separate owners.
    # Counts/reporting use the candidate pool; the optional display subset exists
    # only to keep the map readable and must never be interpreted as detector recall.
    display=ded
    if args.display_per_tile is not None:
        grouped={}
        for f in ded:
            q=str((f.get("properties") or {}).get("quadkey") or "")
            grouped.setdefault(q,[]).append(f)
        display=[]
        for q,items in grouped.items():
            items=sorted(items,key=lambda x:(
              float((x.get("properties") or {}).get("elder_tree_confidence_pct") or 0),
              float((x.get("properties") or {}).get("height_m") or 0)
            ),reverse=True)
            display.extend(items[:max(0,args.display_per_tile)])
        display=sorted(display,key=lambda x:float((x.get("properties") or {}).get("elder_tree_confidence_pct") or 0),reverse=True)

    key=hashlib.sha256((METHOD+"|"+",".join(map(str,bbox))).encode()).hexdigest()[:16]
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    pool_fc={"type":"FeatureCollection","features":ded}
    display_fc={"type":"FeatureCollection","features":display}
    meta={"mode":"off-production","method_version":METHOD,"bbox":bbox,"cache_key":key,
          "requested_tiles":qs,"tile_results":tiles,
          "candidate_count":len(ded),"candidate_pool_count":len(ded),
          "display_count":len(display),"display_limit_per_tile":args.display_per_tile,
          "count_owner":"candidate_pool","map_owner":"display_subset" if args.display_per_tile is not None else "candidate_pool",
          "scientific_boundary":"All output points are unverified Elder Tree Candidates. Display density is not detector recall and is not the evidence-count owner."}
    (out/f"elder-tree-candidate-pool-{key}.geojson").write_text(json.dumps(pool_fc,indent=2))
    (out/f"elder-trees-{key}.geojson").write_text(json.dumps(display_fc,indent=2))
    (out/f"elder-trees-{key}.json").write_text(json.dumps(meta,indent=2))
    print(json.dumps(meta,indent=2))

if __name__=="__main__":main()
