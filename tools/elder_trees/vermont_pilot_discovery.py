#!/usr/bin/env python3
"""
Earthline Elder Trees — Vermont public Big Tree + QL1 LiDAR pilot discovery.
OFF-PRODUCTION ONLY. This run uses only public validation geometry.

Uses only the public champion-tree ArcGIS layer for validation.
Never emits private-tree coordinates.
"""
from __future__ import annotations
import json, math, sys
from pathlib import Path
import requests

UA={"User-Agent":"Earthline-ElderTree-Research/0.5"}
PUBLIC_LAYER="https://services5.arcgis.com/Uzks6LSde6r23wwG/arcgis/rest/services/Big_Tree_Survey_View/FeatureServer/0"
DSM="https://maps.vcgi.vermont.gov/arcgis/rest/services/EGC_services/IMG_VCGI_LIDARDSM_SP_NOCACHE_v1/ImageServer"
DEM="https://maps.vcgi.vermont.gov/arcgis/rest/services/EGC_services/IMG_VCGI_LIDARDEM_SP_NOCACHE_v1/ImageServer"

def jget(url,params):
    r=requests.get(url,params=params,headers=UA,timeout=120); r.raise_for_status()
    d=r.json()
    if isinstance(d,dict) and d.get("error"): raise RuntimeError(json.dumps(d["error"]))
    return d

def find_fields(meta):
    names=[f.get("name") for f in meta.get("fields",[])]
    lower={n.lower():n for n in names if n}
    groups={}
    pats={
      "public":["public","access"],
      "name":["common","name"],
      "species":["genus","species","scientific"],
      "height":["height"],
      "crown":["crown","spread"],
      "circ":["circ","girth","diameter"],
      "score":["score","points"],
      "id":["objectid","globalid","treeid","id"]
    }
    for key,words in pats.items():
        groups[key]=[n for n in names if any(w in n.lower() for w in words)]
    return names,groups

def query_public():
    meta=jget(PUBLIC_LAYER,{"f":"json"})
    names,groups=find_fields(meta)
    q=jget(PUBLIC_LAYER+"/query",{
      "where":"1=1","outFields":"*","returnGeometry":"true","outSR":"4326",
      "f":"json","resultRecordCount":"500"
    })
    feats=q.get("features",[])
    # This service is the source used by the public champion-tree map.
    sample=[]
    for f in feats[:20]:
        a=f.get("attributes") or {}; g=f.get("geometry") or {}
        sample.append({"x":g.get("x"),"y":g.get("y"),"attrs":a})
    return {
      "service":PUBLIC_LAYER,
      "geometryType":meta.get("geometryType"),
      "spatialReference":meta.get("extent",{}).get("spatialReference"),
      "fields":names,
      "field_groups":groups,
      "record_count":len(feats),
      "sample":sample
    }

def image_service_meta(url):
    d=jget(url,{"f":"json"})
    return {
      "name":d.get("name"),
      "pixelType":d.get("pixelType"),
      "pixelSizeX":d.get("pixelSizeX"),
      "pixelSizeY":d.get("pixelSizeY"),
      "spatialReference":d.get("spatialReference"),
      "extent":d.get("extent"),
      "capabilities":d.get("capabilities"),
      "serviceDataType":d.get("serviceDataType")
    }

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-vermont-pilot")
    out.mkdir(parents=True,exist_ok=True)
    result={
      "mode":"off-production",
      "validation_source":query_public(),
      "dsm":image_service_meta(DSM),
      "dem":image_service_meta(DEM),
      "privacy_rule":"Only public champion-tree service geometry may be used for validation; private-tree locations are excluded."
    }
    (out/"vermont-pilot-discovery.json").write_text(json.dumps(result,indent=2,default=str))
    print(json.dumps(result,indent=2,default=str))

if __name__=="__main__": main()
