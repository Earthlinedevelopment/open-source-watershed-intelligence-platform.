#!/usr/bin/env python3
"""
Earthline Elder Trees — WRI/Meta CHMv2 public AWS discovery.
OFF-PRODUCTION ONLY.

CHMv2 is a modeled canopy-height source and may support worldwide Elder Tree
candidate screening only after validation against England and Vermont controls.
"""
from __future__ import annotations
import json, sys, xml.etree.ElementTree as ET
from pathlib import Path
import requests

ROOT="https://dataforgood-fb-data.s3.amazonaws.com/"
PREFIX="forests/v2/global/dinov3_global_chm_v2_ml3/"
UA={"User-Agent":"Earthline-ElderTree-Research/1.1"}

def list_objects(max_pages=20):
    keys=[]; token=None
    for _ in range(max_pages):
        params={"list-type":"2","prefix":PREFIX,"max-keys":"1000"}
        if token: params["continuation-token"]=token
        r=requests.get(ROOT,params=params,headers=UA,timeout=180); r.raise_for_status()
        root=ET.fromstring(r.content)
        ns={"s3":"http://s3.amazonaws.com/doc/2006-03-01/"}
        for el in root.findall("s3:Contents/s3:Key",ns):
            if el.text: keys.append(el.text)
        trunc=(root.findtext("s3:IsTruncated",default="false",namespaces=ns) or "").lower()=="true"
        token=root.findtext("s3:NextContinuationToken",default=None,namespaces=ns)
        if not trunc or not token: break
    return keys, bool(token)

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-chmv2")
    out.mkdir(parents=True,exist_ok=True)
    keys,more=list_objects()
    tif=[k for k in keys if k.lower().endswith((".tif",".tiff"))]
    geo=[k for k in keys if k.lower().endswith((".geojson",".json"))]
    result={
      "mode":"off-production",
      "dataset":"WRI/Meta Version 2 High Resolution Canopy Height Maps (CHMv2)",
      "license":"CC BY 4.0",
      "aws_prefix":"s3://dataforgood-fb-data/"+PREFIX,
      "listed_object_count":len(keys),
      "tif_count_in_listing":len(tif),
      "json_geojson_count_in_listing":len(geo),
      "listing_may_continue":more,
      "sample_tifs":tif[:30],
      "sample_json_geojson":geo[:30],
      "rule":"Modeled CHMv2 output is not a verified Elder Tree. Global GPS candidate generation remains disabled until England/Vermont calibration passes."
    }
    (out/"chmv2-discovery.json").write_text(json.dumps(result,indent=2))
    print(json.dumps(result,indent=2))

if __name__=="__main__": main()
