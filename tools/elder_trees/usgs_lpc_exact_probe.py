#!/usr/bin/env python3
import json, requests
URL="https://index.nationalmap.gov/arcgis/rest/services/3DEPElevationIndex/MapServer/8"
UA={"User-Agent":"Earthline-ElderTree-Research/2.1"}
POINTS=[
 {"name":"Vermont Earthline candidate","lon":-73.20924818515778,"lat":44.50332740834088},
 {"name":"Vermont public champion control","lon":-73.199238191,"lat":44.480345151},
]
meta=requests.get(URL,params={"f":"json"},headers=UA,timeout=120).json()
print("FIELDS")
print(json.dumps([{"name":f.get("name"),"alias":f.get("alias"),"type":f.get("type")} for f in meta.get("fields",[])],indent=2))
for p in POINTS:
    q=requests.get(URL+"/query",params={
      "f":"json","geometry":f'{p["lon"]},{p["lat"]}',
      "geometryType":"esriGeometryPoint","inSR":"4326",
      "spatialRel":"esriSpatialRelIntersects",
      "outFields":"*","returnGeometry":"false","resultRecordCount":"100"
    },headers=UA,timeout=120)
    q.raise_for_status(); d=q.json()
    print("POINT",p["name"])
    print(json.dumps({"point":p,"error":d.get("error"),"feature_count":len(d.get("features") or []),
      "attributes":[f.get("attributes") or {} for f in d.get("features") or []]},indent=2,default=str))
