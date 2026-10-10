#!/usr/bin/env python3
"""
Earthline Elder Trees — batch USGS 3DEP refinement for candidate GeoJSON.
OFF-PRODUCTION ONLY.

prepare:
  creates one exact-workunit PDAL crop pipeline per candidate.
merge:
  reads completed point CSVs, applies the single-candidate measured-LiDAR
  confirmation rule, and upgrades only supported points.
"""
from __future__ import annotations
import argparse, json
from pathlib import Path
from types import SimpleNamespace
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import usgs_ept_candidate_refine as refine

def prepare(args):
    fc=json.loads(Path(args.input).read_text())
    feats=fc.get("features") or []
    out=Path(args.outdir);out.mkdir(parents=True,exist_ok=True)
    index=[]
    for i,f in enumerate(feats):
        g=f.get("geometry") or {};xy=g.get("coordinates") or []
        if g.get("type")!="Point" or len(xy)<2:continue
        d=out/f"{i:04d}";d.mkdir(parents=True,exist_ok=True)
        (d/"input-feature.json").write_text(json.dumps(f,indent=2))
        ns=SimpleNamespace(lon=str(xy[0]),lat=str(xy[1]),name=f"candidate-{i:04d}",radius=float(args.radius),outdir=str(d))
        rc=refine.cmd_prepare(ns)
        index.append({"index":i,"dir":str(d),"prepare_code":rc})
    (out/"batch-index.json").write_text(json.dumps(index,indent=2))
    print(json.dumps({"candidate_count":len(feats),"prepared":len(index),"pipeline_count":sum((Path(x["dir"])/"pipeline.json").exists() for x in index)},indent=2))

def merge(args):
    root=Path(args.outdir)
    idx=json.loads((root/"batch-index.json").read_text())
    features=[];upgraded=0;unresolved=0;noevidence=0
    for item in idx:
        d=Path(item["dir"])
        f=json.loads((d/"input-feature.json").read_text())
        props=f.setdefault("properties",{})
        man_path=d/"manifest.json"; csv_path=d/"points.csv"; result_path=d/"result.json"
        result=None
        if item.get("prepare_code")==0 and man_path.exists() and csv_path.exists():
            ns=SimpleNamespace(manifest=str(man_path),csv=str(csv_path),out=str(result_path))
            refine.cmd_summarize(ns)
            if result_path.exists():result=json.loads(result_path.read_text())
        if result and result.get("lidar_structure_confirmed"):
            upgraded+=1
            props["record_class"]="LIDAR_CONFIRMED_ELDER_TREE_CANDIDATE"
            props["verification_status"]="measured LiDAR structural candidate"
            props["source_class"]="LIDAR"
            props["lidar_source_name"]=result.get("source_name")
            props["lidar_source_url"]=result.get("source_url")
            props["lidar_source_ql"]=result.get("source_ql")
            props["lidar_source_workunit"]=result.get("source_workunit")
            props["lidar_collect_start"]=result.get("source_collect_start")
            props["lidar_collect_end"]=result.get("source_collect_end")
            props["lidar_point_count_within_8m"]=result.get("point_count_within_8m")
            props["lidar_canopy_evidence_points_within_8m"]=result.get("canopy_evidence_point_count_within_8m")
            props["lidar_measured_local_canopy_height_m"]=result.get("measured_canopy_height_m")
            props["lidar_method_version"]=result.get("method_version")
            props["lidar_evidence_limit"]=result.get("evidence_limit")
        elif item.get("prepare_code")!=0:
            unresolved+=1
        else:
            noevidence+=1
        features.append(f)
    outfc={"type":"FeatureCollection","features":features}
    summary={
      "mode":"off-production",
      "input_candidate_count":len(features),
      "lidar_confirmed_candidate_count":upgraded,
      "modeled_only_no_exact_source_count":unresolved,
      "modeled_only_local_lidar_not_confirmed_count":noevidence,
      "rule":"Only candidates with exact USGS work-unit resolution plus measured canopy returns within 8 m are upgraded. Elder Tree Confidence remains the CHMv2 local-relative evidence index and is not converted into an age probability."
    }
    Path(args.output).write_text(json.dumps(outfc,indent=2))
    Path(args.summary).write_text(json.dumps(summary,indent=2))
    print(json.dumps(summary,indent=2))

def main():
    ap=argparse.ArgumentParser()
    sp=ap.add_subparsers(dest="cmd",required=True)
    p=sp.add_parser("prepare");p.add_argument("--input",required=True);p.add_argument("--outdir",required=True);p.add_argument("--radius",type=float,default=30.0)
    m=sp.add_parser("merge");m.add_argument("--outdir",required=True);m.add_argument("--output",required=True);m.add_argument("--summary",required=True)
    a=ap.parse_args()
    prepare(a) if a.cmd=="prepare" else merge(a)

if __name__=="__main__":main()
