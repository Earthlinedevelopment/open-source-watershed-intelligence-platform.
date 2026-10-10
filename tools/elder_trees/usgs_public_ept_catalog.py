#!/usr/bin/env python3
"""
Earthline Elder Trees — public USGS 3DEP EPT catalog.
OFF-PRODUCTION ONLY.

Builds the free, no-account streamable USGS Entwine Point Tile project catalog.
This avoids the requester-pays raw LAZ bucket and preserves Earthline's zero-cost rule.
"""
from __future__ import annotations
import json, re, sys, xml.etree.ElementTree as ET
from pathlib import Path
import requests

BUCKET="https://usgs-lidar-public.s3.us-west-2.amazonaws.com/"
UA={"User-Agent":"Earthline-ElderTree-Research/1.0"}

def list_prefixes():
    prefixes=[]
    token=None
    for _ in range(20):
        params={"list-type":"2","delimiter":"/","max-keys":"1000"}
        if token: params["continuation-token"]=token
        r=requests.get(BUCKET,params=params,headers=UA,timeout=180)
        r.raise_for_status()
        root=ET.fromstring(r.content)
        ns={"s3":"http://s3.amazonaws.com/doc/2006-03-01/"}
        for el in root.findall("s3:CommonPrefixes/s3:Prefix",ns):
            if el.text: prefixes.append(el.text.rstrip("/"))
        trunc=(root.findtext("s3:IsTruncated",default="false",namespaces=ns) or "").lower()=="true"
        token=root.findtext("s3:NextContinuationToken",default=None,namespaces=ns)
        if not trunc or not token: break
    return sorted(set(prefixes))

def ept_meta(prefix):
    url=BUCKET+prefix+"/ept.json"
    try:
        r=requests.get(url,headers=UA,timeout=60)
        if r.status_code!=200: return {"prefix":prefix,"ept_url":url,"status":r.status_code}
        d=r.json()
        srs=d.get("srs") or {}
        return {
          "prefix":prefix,"ept_url":url,"status":200,
          "points":d.get("points"),"bounds":d.get("bounds"),"boundsConforming":d.get("boundsConforming"),
          "span":d.get("span"),"dataType":d.get("dataType"),
          "srs":{"authority":srs.get("authority"),"horizontal":srs.get("horizontal"),"vertical":srs.get("vertical"),"wkt":srs.get("wkt")}
        }
    except Exception as e:
        return {"prefix":prefix,"ept_url":url,"status":"error","error":str(e)}

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-us-ept")
    out.mkdir(parents=True,exist_ok=True)
    prefixes=list_prefixes()
    # Inspect metadata for every prefix; requests are small ept.json documents.
    projects=[ept_meta(p) for p in prefixes]
    ok=[p for p in projects if p.get("status")==200]
    summary={
      "mode":"off-production",
      "source":"USGS 3DEP public Entwine Point Tiles",
      "bucket":"s3://usgs-lidar-public/",
      "http_root":BUCKET,
      "project_prefix_count":len(prefixes),
      "valid_ept_project_count":len(ok),
      "zero_cost_rule":"Uses public no-account EPT resource, not requester-pays raw LAZ."
    }
    (out/"usgs-public-ept-projects.json").write_text(json.dumps(projects,indent=2))
    (out/"usgs-public-ept-summary.json").write_text(json.dumps(summary,indent=2))
    print(json.dumps(summary,indent=2))

if __name__=="__main__": main()
