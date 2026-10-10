#!/usr/bin/env python3
"""
Earthline Elder Trees — actual CHMv2 global tile inventory.
OFF-PRODUCTION ONLY.

Lists all real CHMv2 canopy GeoTIFF quadkeys exactly once from the public AWS
bucket. This is the authoritative processing queue; country assignments are
joined later. Avoids processing 427k duplicated country/tile intersections.
"""
from __future__ import annotations
import json, sys, xml.etree.ElementTree as ET
from pathlib import Path
import requests

ROOT="https://dataforgood-fb-data.s3.amazonaws.com/"
PREFIX="forests/v2/global/dinov3_global_chm_v2_ml3/chm/"
UA={"User-Agent":"Earthline-ElderTree-Research/1.4"}

def all_tiles():
    keys=[]; token=None; pages=0
    while True:
        params={"list-type":"2","prefix":PREFIX,"max-keys":"1000"}
        if token:params["continuation-token"]=token
        r=requests.get(ROOT,params=params,headers=UA,timeout=180);r.raise_for_status()
        root=ET.fromstring(r.content)
        ns={"s3":"http://s3.amazonaws.com/doc/2006-03-01/"}
        for el in root.findall("s3:Contents/s3:Key",ns):
            k=el.text or ""
            if k.lower().endswith(".tif"):
                q=Path(k).stem
                if len(q)==10 and set(q)<=set("0123"):keys.append(q)
        pages+=1
        trunc=(root.findtext("s3:IsTruncated",default="false",namespaces=ns) or "").lower()=="true"
        token=root.findtext("s3:NextContinuationToken",default=None,namespaces=ns)
        if not trunc or not token:break
    return sorted(set(keys)),pages

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-chmv2-tiles")
    out.mkdir(parents=True,exist_ok=True)
    tiles,pages=all_tiles()
    summary={
      "mode":"off-production",
      "source":"WRI/Meta CHMv2 public AWS",
      "prefix":"s3://dataforgood-fb-data/"+PREFIX,
      "zoom":10,
      "actual_tile_count":len(tiles),
      "listing_pages":pages,
      "rule":"Process each actual tile once; country assignment is metadata and must not duplicate computation."
    }
    (out/"chmv2-actual-tiles.json").write_text(json.dumps(tiles,indent=2))
    (out/"chmv2-actual-tiles-summary.json").write_text(json.dumps(summary,indent=2))
    print(json.dumps(summary,indent=2))

if __name__=="__main__":main()
