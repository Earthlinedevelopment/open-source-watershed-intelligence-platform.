#!/usr/bin/env python3
"""
Earthline Elder Trees — U.S. national 3DEP source inventory.
OFF-PRODUCTION ONLY.

Downloads the current USGS WESM CSV and produces:
- a normalized work-unit catalog;
- project/source-quality summaries;
- a state/territory processing queue scaffold.

This script does not generate tree candidates and does not touch V1.
"""
from __future__ import annotations
import csv, io, json, re, sys
from collections import Counter, defaultdict
from pathlib import Path
import requests

WESM="https://rockyweb.usgs.gov/vdelivery/Datasets/Staged/Elevation/metadata/WESM.csv"
UA={"User-Agent":"Earthline-ElderTree-Research/0.8"}

JURISDICTIONS = [
("AL","Alabama"),("AK","Alaska"),("AZ","Arizona"),("AR","Arkansas"),("CA","California"),
("CO","Colorado"),("CT","Connecticut"),("DE","Delaware"),("FL","Florida"),("GA","Georgia"),
("HI","Hawaii"),("ID","Idaho"),("IL","Illinois"),("IN","Indiana"),("IA","Iowa"),
("KS","Kansas"),("KY","Kentucky"),("LA","Louisiana"),("ME","Maine"),("MD","Maryland"),
("MA","Massachusetts"),("MI","Michigan"),("MN","Minnesota"),("MS","Mississippi"),("MO","Missouri"),
("MT","Montana"),("NE","Nebraska"),("NV","Nevada"),("NH","New Hampshire"),("NJ","New Jersey"),
("NM","New Mexico"),("NY","New York"),("NC","North Carolina"),("ND","North Dakota"),("OH","Ohio"),
("OK","Oklahoma"),("OR","Oregon"),("PA","Pennsylvania"),("RI","Rhode Island"),("SC","South Carolina"),
("SD","South Dakota"),("TN","Tennessee"),("TX","Texas"),("UT","Utah"),("VT","Vermont"),
("VA","Virginia"),("WA","Washington"),("WV","West Virginia"),("WI","Wisconsin"),("WY","Wyoming"),
("DC","District of Columbia"),("PR","Puerto Rico"),("VI","U.S. Virgin Islands"),("GU","Guam"),
("MP","Northern Mariana Islands"),("AS","American Samoa")
]

def download_csv():
    r=requests.get(WESM,headers=UA,timeout=180)
    r.raise_for_status()
    txt=r.content.decode("utf-8-sig",errors="replace")
    return list(csv.DictReader(io.StringIO(txt))), r.url

def canon(row, candidates):
    low={str(k).lower():k for k in row.keys()}
    for c in candidates:
        k=low.get(c.lower())
        if k is not None:
            v=row.get(k)
            if v not in (None,""): return v
    return None

def infer_jurisdictions(row):
    blob=" ".join(str(v or "") for v in row.values())
    up=blob.upper()
    hits=[]
    for code,name in JURISDICTIONS:
        # Conservative textual inference only; spatial assignment is a later step.
        if re.search(rf"\b{re.escape(code)}\b",up) or name.upper() in up:
            hits.append(code)
    return sorted(set(hits))

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-us-national")
    out.mkdir(parents=True,exist_ok=True)
    rows,url=download_csv()
    if not rows: raise RuntimeError("USGS WESM returned no rows; fail closed")
    fields=list(rows[0].keys())

    normalized=[]
    projects=defaultdict(lambda:{
      "workunits":0,"ql":Counter(),"collect_start":[],"collect_end":[],
      "lpc_links":set(),"metadata_links":set(),"jurisdiction_hints":set()
    })
    for row in rows:
        workunit=canon(row,["workunit","work_unit","WorkUnit"])
        workunit_id=canon(row,["workunit_id","work_unit_id","WorkUnit_ID"])
        project=canon(row,["project","Project"])
        project_id=canon(row,["project_id","Project_ID"])
        ql=canon(row,["ql","QL","quality_level"])
        collect_start=canon(row,["collect_start","collection_start"])
        collect_end=canon(row,["collect_end","collection_end"])
        lpc_link=canon(row,["lpc_link","LPC_Link"])
        metadata_link=canon(row,["metadata_link","Metadata_Link"])
        lpc_status=canon(row,["lpc","LPC","lpc_status"])
        hints=infer_jurisdictions(row)
        rec={
          "workunit":workunit,"workunit_id":workunit_id,
          "project":project,"project_id":project_id,"ql":ql,
          "collect_start":collect_start,"collect_end":collect_end,
          "lpc_status":lpc_status,"lpc_link":lpc_link,
          "metadata_link":metadata_link,"jurisdiction_hints":hints
        }
        normalized.append(rec)
        key=project_id or project or "UNKNOWN"
        p=projects[key]; p["workunits"]+=1
        if ql:p["ql"][str(ql)]+=1
        if collect_start:p["collect_start"].append(str(collect_start))
        if collect_end:p["collect_end"].append(str(collect_end))
        if lpc_link:p["lpc_links"].add(str(lpc_link))
        if metadata_link:p["metadata_links"].add(str(metadata_link))
        p["jurisdiction_hints"].update(hints)
        p["project"]=project;p["project_id"]=project_id

    plist=[]
    for key,p in projects.items():
        plist.append({
          "project":p.get("project"),"project_id":p.get("project_id"),
          "workunits":p["workunits"],"ql_counts":dict(p["ql"]),
          "collect_start_min":min(p["collect_start"]) if p["collect_start"] else None,
          "collect_end_max":max(p["collect_end"]) if p["collect_end"] else None,
          "lpc_links":sorted(p["lpc_links"]),
          "metadata_links":sorted(p["metadata_links"]),
          "jurisdiction_hints":sorted(p["jurisdiction_hints"])
        })
    plist.sort(key=lambda x:(x["jurisdiction_hints"],str(x["project"])))

    queue=[]
    for code,name in JURISDICTIONS:
        hinted=[p for p in plist if code in p["jurisdiction_hints"]]
        queue.append({
          "code":code,"name":name,
          "text-hinted_project_count":len(hinted),
          "status":"source-cataloged; spatial coverage assignment pending",
          "candidate_rule":"Individual GPS candidates only from qualifying 3DEP LiDAR; provenance required."
        })

    summary={
      "mode":"off-production",
      "source":"USGS 3DEP Work Unit Extent Spatial Metadata (WESM)",
      "source_url":url,
      "workunit_count":len(normalized),
      "project_count":len(plist),
      "columns":fields,
      "jurisdiction_count":len(queue),
      "note":"State hints are conservative text hints only. Final assignment must use WESM geometry, not project-name inference."
    }
    (out/"us-wesm-summary.json").write_text(json.dumps(summary,indent=2))
    (out/"us-3dep-projects.json").write_text(json.dumps(plist,indent=2))
    (out/"us-jurisdiction-queue.json").write_text(json.dumps(queue,indent=2))
    # keep normalized catalog newline-delimited to avoid one enormous JSON array
    with (out/"us-wesm-normalized.ndjson").open("w") as fh:
        for rec in normalized: fh.write(json.dumps(rec)+"\n")
    print(json.dumps(summary,indent=2))

if __name__=="__main__": main()
