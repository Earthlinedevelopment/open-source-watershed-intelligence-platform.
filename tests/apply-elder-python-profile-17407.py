from pathlib import Path
p=Path("tools/elder_trees/chmv2_array_detector_17129.py")
s=p.read_text(encoding="utf-8")
s=s.replace("import json, math\n","import json, math, time\n",1)
old='''def detect_from_files(screen_path,oh,ow,native_path,nh,nw,meta_json,max_per_tile=240,preserve_all_eligible=True):
    meta=json.loads(meta_json)'''
new='''def detect_from_files(screen_path,oh,ow,native_path,nh,nw,meta_json,max_per_tile=240,preserve_all_eligible=True):
    __prof0=time.perf_counter()
    meta=json.loads(meta_json)'''
if s.count(old)!=1: raise SystemExit("start anchor")
s=s.replace(old,new,1)

old='''    reference_peak_count=len(all_ranked)

    native_clean=native.astype("float32",copy=True)'''
new='''    reference_peak_count=len(all_ranked)
    __prof_ranked=time.perf_counter()

    native_clean=native.astype("float32",copy=True)'''
if s.count(old)!=1: raise SystemExit("rank anchor")
s=s.replace(old,new,1)

old='''    def refine_candidate(r,c):'''
new='''    __prof_shared=time.perf_counter()
    __prof_refine=[0.0,0]
    def refine_candidate(r,c):'''
if s.count(old)!=1: raise SystemExit("refine anchor")
s=s.replace(old,new,1)

old='''        ref=refine_candidate(r,c)
        if not ref:continue'''
new='''        __rt=time.perf_counter()
        ref=refine_candidate(r,c)
        __prof_refine[0]+=time.perf_counter()-__rt
        __prof_refine[1]+=1
        if not ref:continue'''
if s.count(old)!=1: raise SystemExit("ref call anchor")
s=s.replace(old,new,1)

old='''    tile={
      "quadkey":q,"status":"OK","candidate_count":len(feats),'''
new='''    __prof_end=time.perf_counter()
    tile={
      "quadkey":q,"status":"OK","candidate_count":len(feats),
      "python_profile_ms":{
        "pre_rank":round((__prof_ranked-__prof0)*1000,1),
        "shared_setup":round((__prof_shared-__prof_ranked)*1000,1),
        "refine_total":round(__prof_refine[0]*1000,1),
        "refine_calls":int(__prof_refine[1]),
        "other_after_shared":round((__prof_end-__prof_shared-__prof_refine[0])*1000,1)
      },'''
if s.count(old)!=1: raise SystemExit("tile anchor")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("installed Elder Python phase profile 17407")
