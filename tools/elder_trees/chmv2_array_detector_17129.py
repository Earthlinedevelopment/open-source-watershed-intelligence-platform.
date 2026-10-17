from __future__ import annotations
import json, math
import numpy as np

METHOD="earthline-elder-tree-aoi-chmv2-v0.7-high-recall-plateau-collapse"
CURRENT_ELDER_TARGET_PER_HA=15.0
FUTURE_ELDER_RATIO=2.5

# EARTHLINE 17387 — NumPy-only equivalents of the exact scipy.ndimage operations
# used by the approved 17118 Elder algorithm. This removes the large SciPy cold
# download from the browser worker without changing thresholds, kernels,
# neighborhood modes, connectivity, ranking, quotas, or candidate semantics.
def _median_filter(a,size,mode=None):
    size=int(size); pad=size//2
    p=np.pad(a,((pad,pad),(pad,pad)),mode="edge")
    w=np.lib.stride_tricks.sliding_window_view(p,(size,size))
    return np.median(w,axis=(-2,-1)).astype(a.dtype,copy=False)

def _uniform_filter(a,size,mode=None):
    size=int(size); pad=size//2
    p=np.pad(a,((pad,pad),(pad,pad)),mode="edge")
    h,w=a.shape
    out=np.zeros_like(a,dtype=np.float32)
    for dr in range(size):
        for dc in range(size):
            out += p[dr:dr+h,dc:dc+w]
    out /= float(size*size)
    return out.astype(a.dtype,copy=False)

def _maximum_filter(a,size,mode=None):
    size=int(size); pad=size//2
    p=np.pad(a,((pad,pad),(pad,pad)),mode="edge")
    h,w=a.shape
    out=np.full_like(a,-np.inf,dtype=np.float32)
    for dr in range(size):
        for dc in range(size):
            np.maximum(out,p[dr:dr+h,dc:dc+w],out=out)
    return out.astype(a.dtype,copy=False)

def _gaussian_filter(a,sigma):
    sigma=float(sigma)
    radius=max(1,int(4.0*sigma+0.5))
    x=np.arange(-radius,radius+1,dtype=np.float32)
    k=np.exp(-(x*x)/(2.0*sigma*sigma)).astype(np.float32)
    k/=np.sum(k)
    h,w=a.shape
    px=np.pad(a,((0,0),(radius,radius)),mode="symmetric")
    tmp=np.zeros_like(a,dtype=np.float32)
    for i,weight in enumerate(k):
        tmp += weight*px[:,i:i+w]
    py=np.pad(tmp,((radius,radius),(0,0)),mode="symmetric")
    out=np.zeros_like(a,dtype=np.float32)
    for i,weight in enumerate(k):
        out += weight*py[i:i+h,:]
    return out.astype(a.dtype,copy=False)

def _label(mask):
    mask=np.asarray(mask,dtype=bool)
    h,w=mask.shape
    labels=np.zeros((h,w),dtype=np.int32)
    lab=0
    for r in range(h):
        for c in range(w):
            if not mask[r,c] or labels[r,c]:
                continue
            lab+=1
            labels[r,c]=lab
            stack=[(r,c)]
            while stack:
                rr,cc=stack.pop()
                if rr>0 and mask[rr-1,cc] and not labels[rr-1,cc]:
                    labels[rr-1,cc]=lab;stack.append((rr-1,cc))
                if rr+1<h and mask[rr+1,cc] and not labels[rr+1,cc]:
                    labels[rr+1,cc]=lab;stack.append((rr+1,cc))
                if cc>0 and mask[rr,cc-1] and not labels[rr,cc-1]:
                    labels[rr,cc-1]=lab;stack.append((rr,cc-1))
                if cc+1<w and mask[rr,cc+1] and not labels[rr,cc+1]:
                    labels[rr,cc+1]=lab;stack.append((rr,cc+1))
    return labels,lab

def hav(a,b):
    lon1,lat1=a;lon2,lat2=b;R=6371008.8
    p1,p2=math.radians(lat1),math.radians(lat2)
    dp=math.radians(lat2-lat1);dl=math.radians(lon2-lon1)
    q=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(min(1,math.sqrt(q)))

def mercator_to_lonlat(x,y):
    R=6378137.0
    lon=math.degrees(x/R)
    lat=math.degrees(2*math.atan(math.exp(y/R))-math.pi/2)
    return lon,lat

def _load_f32(path,h,w):
    a=np.frombuffer(open(path,"rb").read(),dtype=np.float32).copy()
    if a.size != h*w:
        raise ValueError(f"array size mismatch {a.size} != {h*w}")
    return a.reshape((h,w))

def detect_from_files(screen_path,oh,ow,native_path,nh,nw,meta_json,max_per_tile=240,preserve_all_eligible=True):
    meta=json.loads(meta_json)
    arr=_load_f32(screen_path,int(oh),int(ow))
    native=_load_f32(native_path,int(nh),int(nw))
    oh=int(oh);ow=int(ow);nh=int(nh);nw=int(nw)
    minlon,minlat,maxlon,maxlat=[float(x) for x in meta["bbox"]]
    q=str(meta["quadkey"])
    source_url=str(meta["source_url"])
    resx=float(meta["res_x"])
    resy=float(meta["res_y"])
    screen_col0=int(meta["screen_col0"]);screen_row0=int(meta["screen_row0"])
    screen_ww=int(meta["screen_ww"]);screen_wh=int(meta["screen_wh"])
    native_col0=int(meta["native_col0"]);native_row0=int(meta["native_row0"])
    origin_x=float(meta["origin_x"]);origin_y=float(meta["origin_y"])
    pix=max(abs(resx),abs(resy))

    arr[(~np.isfinite(arr))|(arr<0)|(arr>80)]=np.nan
    z=np.nan_to_num(arr,nan=0)
    woody=z[z>=1.5]
    if woody.size<8:
        return {"features":[],"tile":{"quadkey":q,"status":"NO_CANOPY"}}
    canopy_floor_m=float(max(2.0,min(5.0,np.percentile(woody,25))))
    canopy=z>=canopy_floor_m
    vals=z[canopy]
    if vals.size<8:
        return {"features":[],"tile":{"quadkey":q,"status":"NO_CANOPY","canopy_floor_m":round(canopy_floor_m,2)}}

    med=_median_filter(z,size=9,mode="nearest")
    prom=np.maximum(0,z-med)
    pvals=prom[canopy]
    hs=np.sort(vals);ps=np.sort(pvals)
    h_pct=np.zeros_like(z,dtype="float32")
    p_pct=np.zeros_like(z,dtype="float32")
    h_pct[canopy]=np.searchsorted(hs,z[canopy],side="right")/max(1,len(hs))
    p_pct[canopy]=np.searchsorted(ps,prom[canopy],side="right")/max(1,len(ps))
    local_density=_uniform_filter(canopy.astype("float32"),size=9,mode="nearest")
    open_context=np.clip(1.0-local_density,0.0,1.0)
    score=np.zeros_like(z,dtype="float32")
    score[canopy]=.40*h_pct[canopy]+.35*p_pct[canopy]+.25*open_context[canopy]

    screen_px_m=max(abs(resx)*screen_ww/max(1,ow),abs(resy)*screen_wh/max(1,oh))
    stand_px=max(4,int(round(300.0/max(screen_px_m,.01))))
    nms_px=max(3,int(round(8.0/max(screen_px_m,.01))))
    if nms_px%2==0:nms_px+=1

    candidates=[]
    forest_cells=0;forest_cells_with_candidate=0;forest_area_ha=0.0
    current_target_total=0;future_target_total=0
    current_selected_total=0;future_selected_total=0
    pixel_area_m2=screen_px_m*screen_px_m

    for r0 in range(0,oh,stand_px):
        for c0 in range(0,ow,stand_px):
            r1=min(oh,r0+stand_px);c1=min(ow,c0+stand_px)
            cm=canopy[r0:r1,c0:c1]
            if cm.size==0:continue
            forest_fraction=float(np.mean(cm))
            if forest_fraction<0.18 and not preserve_all_eligible:continue
            forest_cells+=1
            canopy_area_ha=float(np.sum(cm))*pixel_area_m2/10000.0
            forest_area_ha+=canopy_area_ha
            current_target=max(1,int(math.ceil(canopy_area_ha*CURRENT_ELDER_TARGET_PER_HA)))
            future_target=max(1,int(math.ceil(current_target*FUTURE_ELDER_RATIO)))
            current_target_total+=current_target;future_target_total+=future_target
            hs_cell=h_pct[r0:r1,c0:c1];ps_cell=p_pct[r0:r1,c0:c1]
            op_cell=open_context[r0:r1,c0:c1];sc_cell=score[r0:r1,c0:c1]
            eligible_cell=cm&(hs_cell>=.35)&((ps_cell>=.30)|(op_cell>=.45))
            if not np.any(eligible_cell):continue
            peak_cell=(sc_cell==_maximum_filter(sc_cell,size=nms_px,mode="nearest"))&eligible_cell
            labels,nlab=_label(peak_cell)
            rr=[];cc=[];z_cell=z[r0:r1,c0:c1]
            for lab_id in range(1,nlab+1):
                pr,pc=np.where(labels==lab_id)
                if not len(pr):continue
                best=max(range(len(pr)),key=lambda k:(
                    float(z_cell[pr[k],pc[k]]),
                    float(ps_cell[pr[k],pc[k]]),
                    float(sc_cell[pr[k],pc[k]]),
                    -int(pr[k]),-int(pc[k])
                ))
                rr.append(int(pr[best]));cc.append(int(pc[best]))
            if not len(rr):continue
            forest_cells_with_candidate+=1
            ranked_cell=sorted([(float(sc_cell[r,c]),r0+r,c0+c) for r,c in zip(rr,cc)],reverse=True)
            total_target=current_target+future_target
            quota_selected=ranked_cell[:total_target]
            if len(quota_selected)>=total_target:
                current_n=current_target
            else:
                current_n=max(1,int(round(len(quota_selected)/(1.0+FUTURE_ELDER_RATIO)))) if quota_selected else 0
                current_n=min(current_target,current_n)
            future_n=min(future_target,max(0,len(quota_selected)-current_n))
            current_items=quota_selected[:current_n]
            future_items=quota_selected[current_n:current_n+future_n]
            current_selected_total+=len(current_items);future_selected_total+=len(future_items)
            candidates.extend([(sc,r,c,"CURRENT_ELDER_CANDIDATE") for sc,r,c in current_items])
            candidates.extend([(sc,r,c,"FUTURE_ELDER_CANDIDATE") for sc,r,c in future_items])
            if preserve_all_eligible and len(ranked_cell)>len(quota_selected):
                candidates.extend([(sc,r,c,"OUTSIDE_DENSITY_PRIOR") for sc,r,c in ranked_cell[len(quota_selected):]])

    all_ranked=sorted(candidates,key=lambda x:x[0],reverse=True)
    ranked=all_ranked[:int(max_per_tile)*3]
    reference_peak_count=len(all_ranked)

    native_clean=native.astype("float32",copy=True)
    native_clean[(~np.isfinite(native_clean))|(native_clean<0)|(native_clean>80)]=np.nan

    def refine_candidate(r,c):
        full_col=screen_col0+(c+.5)*screen_ww/max(1,ow)
        full_row=screen_row0+(r+.5)*screen_wh/max(1,oh)
        ic=int(full_col)-native_col0
        ir=int(full_row)-native_row0
        rradius=max(10,int(round(15.0/max(pix,.01))))
        r0=max(0,ir-rradius);r1=min(nh,ir+rradius+1)
        c0=max(0,ic-rradius);c1=min(nw,ic+rradius+1)
        a=native_clean[r0:r1,c0:c1]
        if not a.size:return None
        zz=np.nan_to_num(a,nan=0)
        sep=max(3,int(round(5/max(pix,.01))))
        if sep%2==0:sep+=1
        sm=_gaussian_filter(zz,sigma=max(.8,min(2.5,1/max(pix,.01))))
        peak=(sm==_maximum_filter(sm,size=sep,mode="nearest"))&(sm>=canopy_floor_m)
        rows,cols=np.where(peak)
        best=None
        for lr,lc in zip(rows.tolist(),cols.tolist()):
            h=float(a[lr,lc]) if np.isfinite(a[lr,lc]) else float(sm[lr,lc])
            rad=max(5,int(round(18/max(pix,.01))))
            ar0,ar1=max(0,lr-rad),min(a.shape[0],lr+rad+1)
            ac0,ac1=max(0,lc-rad),min(a.shape[1],lc+rad+1)
            local=a[ar0:ar1,ac0:ac1];lv=local[np.isfinite(local)]
            medv=float(np.median(lv)) if lv.size else 0.0
            emerg=max(0.0,h-medv)
            openf=float(np.mean(np.nan_to_num(local,nan=0)<4))
            sub=np.nan_to_num(local,nan=0)
            lab,_=_label(sub>=max(1.5,canopy_floor_m*.75,h*.45))
            rr0,cc0=lr-ar0,lc-ac0
            lid=lab[rr0,cc0] if 0<=rr0<lab.shape[0] and 0<=cc0<lab.shape[1] else 0
            area=float(np.sum(lab==lid)*abs(resx*resy)) if lid else 0.0
            global_col=native_col0+c0+lc
            global_row=native_row0+r0+lr
            x=origin_x+(global_col+.5)*resx
            y=origin_y+(global_row+.5)*resy
            cx=origin_x+full_col*resx
            cy=origin_y+full_row*resy
            dist=((x-cx)**2+(y-cy)**2)**.5
            structural=.45*h+.65*emerg+.025*min(area,800)+4*openf
            rec=(dist,-structural,x,y,h,emerg,area,openf)
            if best is None or rec<best:best=rec
        if best is None:return None
        dist,neg_structural,x,y,h,emerg,area,openf=best
        lon,lat=mercator_to_lonlat(x,y)
        return -neg_structural,lon,lat,h,emerg,area,openf

    feats=[]
    for rank,(sc,r,c,cohort) in enumerate(ranked,1):
        ref=refine_candidate(r,c)
        if not ref:continue
        structural,lon,lat,h,emerg,area,openf=ref
        if not (minlon<=lon<=maxlon and minlat<=lat<=maxlat):continue
        if any(hav((lon,lat),f["geometry"]["coordinates"])<10 for f in feats):continue
        feats.append({
          "type":"Feature","geometry":{"type":"Point","coordinates":[lon,lat]},
          "properties":{
            "record_class":"ELDER_TREE_CANDIDATE",
            "elder_cohort":cohort,
            "cohort_definition":"CURRENT = top locally ranked structures under the research density prior; FUTURE = successor structures retained for continuity. Neither label proves age.",
            "verification_status":"modeled remote-sensing candidate only",
            "source_class":"MODELED_CHMV2","source_name":"WRI/Meta CHMv2",
            "source_url":source_url,"source_license":"CC BY 4.0",
            "quadkey":q,"method_version":METHOD,"screen_rank":rank,
            "screen_reference_peak_count":reference_peak_count,
            "local_canopy_floor_m":round(canopy_floor_m,2),
            "raw_structural_evidence_score":round(float(structural),4),
            "screen_structural_score":round(float(sc),5),
            "elder_tree_confidence_pct":int(round(max(0.0,min(100.0,100.0*sc)))),
            "confidence_pct":int(round(max(0.0,min(100.0,100.0*sc)))),
            "confidence_definition":"Earthline Elder Tree Confidence is a local relative structural-evidence index built from height rank, local prominence rank, and open-grown context in the analyzed area. It is not the probability that the tree is ancient, veteran, or a mycorrhizal hub.",
            "height_m":round(h,2),"emergent_height_m":round(emerg,2),
            "crown_area_proxy_m2":round(area,1),"open_context_fraction":round(openf,3),
            "evidence_limit":"Candidate only; modeled canopy structure is not proof of age or mycorrhizal hub status."
          }
        })
        if len(feats)>=int(max_per_tile):break

    tile={
      "quadkey":q,"status":"OK","candidate_count":len(feats),
      "refine_radius_m":15.0,"screen_shape":[oh,ow],
      "canopy_floor_m":round(canopy_floor_m,2),
      "reference_peak_count":reference_peak_count,
      "screen_pixel_m":round(screen_px_m,2),
      "stand_target_m":300.0,
      "forest_cells":forest_cells,
      "forest_cells_with_candidate":forest_cells_with_candidate,
      "forest_candidate_coverage_pct":round(100.0*forest_cells_with_candidate/max(1,forest_cells),1),
      "forest_area_ha":round(forest_area_ha,3),
      "current_elder_target_per_ha":CURRENT_ELDER_TARGET_PER_HA,
      "future_elder_ratio":FUTURE_ELDER_RATIO,
      "current_target_total":current_target_total,
      "future_target_total":future_target_total,
      "current_selected_total":current_selected_total,
      "future_selected_total":future_selected_total
    }
    return {"features":feats,"tile":tile}
