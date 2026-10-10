#!/usr/bin/env python3
"""
Earthline Elder Trees — Vermont COG discovery.
OFF-PRODUCTION ONLY. Uses public-domain Vermont open geospatial data.

Discovers final statewide 2023 QL1 elevation COGs from Vermont's public S3 bucket
and inspects only the public Big Tree validation layer.
"""
from __future__ import annotations
import json, re, sys, xml.etree.ElementTree as ET
from pathlib import Path
import requests

UA={"User-Agent":"Earthline-ElderTree-Research/0.6"}
BUCKET="https://vtopendata-prd.s3.us-east-2.amazonaws.com/"
PREFIX="Elevation/"
PUBLIC_LAYER="https://services5.arcgis.com/Uzks6LSde6r23wwG/arcgis/rest/services/Big_Tree_Survey_View/FeatureServer/0"

def list_s3_all():
    keys=[]
    token=None
    for _ in range(50):
        params={"list-type":"2","prefix":PREFIX,"max-keys":"1000"}
        if token: params["continuation-token"]=token
        r=requests.get(BUCKET,params=params,headers=UA,timeout=120); r.raise_for_status()
        root=ET.fromstring(r.content)
        ns={"s3":"http://s3.amazonaws.com/doc/2006-03-01/"}
        for el in root.findall("s3:Contents/s3:Key",ns):
            if el.text: keys.append(el.text)
        trunc=(root.findtext("s3:IsTruncated",default="false",namespaces=ns) or "").lower()=="true"
        token=root.findtext("s3:NextContinuationToken",default=None,namespaces=ns)
        if not trunc or not token: break
    return keys

def arcgis_json(url,params):
    r=requests.get(url,params=params,headers=UA,timeout=120); r.raise_for_status()
    d=r.json()
    if isinstance(d,dict) and d.get("error"): raise RuntimeError(json.dumps(d["error"]))
    return d

def public_tree_summary():
    meta=arcgis_json(PUBLIC_LAYER,{"f":"json"})
    q=arcgis_json(PUBLIC_LAYER+"/query",{
      "where":"1=1","outFields":"*","returnGeometry":"true","outSR":"4326",
      "f":"json","resultRecordCount":"500"
    })
    fields=[f.get("name") for f in meta.get("fields",[])]
    feats=q.get("features") or []
    rows=[]
    for f in feats[:20]:
        g=f.get("geometry") or {}; a=f.get("attributes") or {}
        rows.append({"lon":g.get("x"),"lat":g.get("y"),"attrs":a})
    return {"record_count":len(feats),"fields":fields,"sample":rows}

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-vermont-cog")
    out.mkdir(parents=True,exist_ok=True)
    keys=list_s3_all()
    ql1=[]
    for k in keys:
        ku=k.upper()
        if "2023" in ku and any(x in ku for x in ("DSM","DEM","NDSM")):
            ql1.append(k)
    statewide=[k for k in ql1 if "STATEWIDE" in k.upper()]
    result={
      "mode":"off-production",
      "bucket":"s3://vtopendata-prd/Elevation/",
      "listed_key_count":len(keys),
      "ql1_2023_candidate_keys":ql1[:500],
      "statewide_2023_candidate_keys":statewide[:200],
      "public_big_tree":public_tree_summary(),
      "rules":[
        "Use only public Big Tree geometry for validation.",
        "Use final statewide 2023 QL1 COGs when present.",
        "Do not promote remote detections to verified Elder Trees."
      ]
    }
    (out/"vermont-cog-discovery.json").write_text(json.dumps(result,indent=2,default=str))
    print(json.dumps(result,indent=2,default=str))

if __name__=="__main__": main()
