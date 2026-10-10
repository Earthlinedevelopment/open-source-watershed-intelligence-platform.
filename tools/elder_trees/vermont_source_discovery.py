#!/usr/bin/env python3
"""
Earthline Elder Trees — Vermont source discovery / pilot setup.
OFF-PRODUCTION ONLY.

Discovers:
1) Vermont Big Tree public table fields and any public coordinate fields.
2) Vermont VCGI LiDAR nDSM WCS capabilities/coverage identifiers.
3) Produces a source-manifest JSON used by the Vermont Elder Tree candidate generator.

No V1 files are touched and no candidate is labeled verified.
"""
from __future__ import annotations
import json, re, sys, xml.etree.ElementTree as ET
from pathlib import Path
import requests

BIG_TREE_TABLE="https://anrmaps.vermont.gov/arcgis/rest/services/map_services/MAP_ANR_ANRATLASFPR_WM_NOCACHE/MapServer/31"
NDSM_WCS="https://maps.vcgi.vermont.gov/arcgis/services/EGC_services/IMG_VCGI_LIDARNDSM_WM_CACHE_v1/ImageServer/WCSServer"
UA={"User-Agent":"Earthline-ElderTree-Research/0.3"}

def get_json(url,params=None):
    r=requests.get(url,params=params,headers=UA,timeout=90); r.raise_for_status()
    d=r.json()
    if isinstance(d,dict) and d.get("error"): raise RuntimeError(json.dumps(d["error"]))
    return d

def get_text(url,params=None):
    r=requests.get(url,params=params,headers=UA,timeout=90); r.raise_for_status()
    return r.text

def public_big_tree_data():
    meta=get_json(BIG_TREE_TABLE,{"f":"json"})
    q=get_json(BIG_TREE_TABLE+"/query",{
      "where":"1=1","outFields":"*","returnGeometry":"false","f":"json","resultRecordCount":"1000"
    })
    fields=[f.get("name") for f in (meta.get("fields") or [])]
    feats=q.get("features") or []
    samples=[(f.get("attributes") or {}) for f in feats[:5]]
    coord_fields=[x for x in fields if re.search(r"(^|_)(lat|latitude|lon|long|longitude|x|y)($|_)",str(x),re.I)]
    measurement_fields=[x for x in fields if re.search(r"(height|circ|girth|crown|spread|species|common|scientific|score|points|county|town)",str(x),re.I)]
    return {
      "table_url":BIG_TREE_TABLE,
      "record_count":len(feats),
      "fields":fields,
      "coordinate_like_fields":coord_fields,
      "measurement_like_fields":measurement_fields,
      "samples":samples
    }

def wcs_caps():
    attempts=[
      {"service":"WCS","request":"GetCapabilities","version":"1.0.0"},
      {"service":"WCS","request":"GetCapabilities","version":"1.1.1"},
      {"service":"WCS","request":"GetCapabilities"},
    ]
    errors=[]
    for p in attempts:
      try:
        txt=get_text(NDSM_WCS,p)
        root=ET.fromstring(txt.encode())
        names=[]
        for el in root.iter():
          tag=el.tag.split("}")[-1]
          if tag in ("name","Name","CoverageId","Identifier") and (el.text or "").strip():
            t=el.text.strip()
            if t not in names: names.append(t)
        return {"url":NDSM_WCS,"request":p,"coverage_identifiers":names[:100],"xml_head":txt[:600]}
      except Exception as e:
        errors.append({"request":p,"error":str(e)})
    return {"url":NDSM_WCS,"errors":errors}

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-vermont")
    out.mkdir(parents=True,exist_ok=True)
    manifest={
      "mode":"off-production",
      "product":"Earthline Elder Trees GPS points",
      "geography":"Vermont",
      "big_tree":public_big_tree_data(),
      "lidar_ndsm":wcs_caps(),
      "notes":[
        "Vermont Big Tree records are independent large-tree validation evidence, not Elder Tree verification.",
        "VCGI nDSM is LiDAR-derived height-above-ground and is suitable for structural candidate screening.",
        "No candidate is promoted to VERIFIED_ELDER_TREE from remote sensing alone."
      ]
    }
    (out/"vermont-source-manifest.json").write_text(json.dumps(manifest,indent=2,default=str))
    print(json.dumps(manifest,indent=2,default=str))

if __name__=="__main__": main()
