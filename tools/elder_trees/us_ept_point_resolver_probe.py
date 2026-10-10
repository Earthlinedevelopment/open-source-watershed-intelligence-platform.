#!/usr/bin/env python3
"""
Earthline Elder Trees — resolve one GPS point to an exact USGS 3DEP WESM work unit
and a free public EPT project.
OFF-PRODUCTION ONLY.
"""
from __future__ import annotations
import json, math, re, sys, tempfile, xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse, unquote
import requests
import geopandas as gpd
from shapely.geometry import Point

WESM="https://rockyweb.usgs.gov/vdelivery/Datasets/Staged/Elevation/metadata/WESM.gpkg"
EPT_ROOT="https://usgs-lidar-public.s3.us-west-2.amazonaws.com/"
UA={"User-Agent":"Earthline-ElderTree-Research/1.5"}

def norm(s):
    s=str(s or "").lower()
    s=s.replace("usgs_lpc_","").replace("usgs_lidar_","")
    return re.sub(r"[^a-z0-9]+","",s)

def list_ept_prefixes():
    prefixes=[];token=None
    while True:
        p={"list-type":"2","delimiter":"/","max-keys":"1000"}
        if token:p["continuation-token"]=token
        r=requests.get(EPT_ROOT,params=p,headers=UA,timeout=180);r.raise_for_status()
        root=ET.fromstring(r.content);ns={"s3":"http://s3.amazonaws.com/doc/2006-03-01/"}
        prefixes += [(e.text or "").rstrip("/") for e in root.findall("s3:CommonPrefixes/s3:Prefix",ns)]
        trunc=(root.findtext("s3:IsTruncated",default="false",namespaces=ns) or "").lower()=="true"
        token=root.findtext("s3:NextContinuationToken",default=None,namespaces=ns)
        if not trunc or not token:break
    return sorted(set(prefixes))

def lpc_project_token(link):
    if not link:return None
    path=unquote(urlparse(str(link)).path)
    # Try project directory above LAZ/LPC/workunit subfolders.
    parts=[p for p in path.split("/") if p]
    for marker in ("Projects","projects"):
        if marker in parts:
            i=parts.index(marker)
            if i+1<len(parts):return parts[i+1]
    # fallback: first segment resembling USGS_LPC_*
    for p in parts:
        if "USGS_LPC" in p.upper() or "USGS_LIDAR" in p.upper():return p
    return None

def ql_value(v):
    m=re.search(r"([0-9]+(?:\.[0-9]+)?)",str(v or ""))
    return float(m.group(1)) if m else 99.0

def main():
    lon=float(sys.argv[1]);lat=float(sys.argv[2])
    with tempfile.TemporaryDirectory() as td:
        gpkg=Path(td)/"wesm.gpkg"
        r=requests.get(WESM,headers=UA,timeout=300);r.raise_for_status();gpkg.write_bytes(r.content)
        layers=gpd.io.file.fiona.listlayers(gpkg)
        gdf=gpd.read_file(gpkg,layer=layers[0])
        p=gpd.GeoSeries([Point(lon,lat)],crs=4326).to_crs(gdf.crs).iloc[0]
        hit=gdf[gdf.geometry.intersects(p)].copy()
        if hit.empty:
            print(json.dumps({"point":[lon,lat],"status":"NO_WESM_COVERAGE"},indent=2));return
        # Prefer usable LPC, best quality, newest collection.
        hit["_ql"]=hit["ql"].map(ql_value) if "ql" in hit else 99
        if "collect_end" in hit:
            hit["_date"]=hit["collect_end"].astype(str)
        else:hit["_date"]=""
        hit=hit.sort_values(["_ql","_date"],ascending=[True,False])

        prefixes=list_ept_prefixes()
        pn={p:norm(p) for p in prefixes}
        rows=[]
        for _,row in hit.head(10).iterrows():
            rec={k:(None if str(row.get(k))=="nan" else row.get(k)) for k in [
              "workunit","workunit_id","project","project_id","ql","collect_start","collect_end",
              "lpc_category","lpc_reason","lpc_link","metadata_link"
            ] if k in hit.columns}
            token=lpc_project_token(rec.get("lpc_link"))
            candidates=[]
            for source in [token,rec.get("project"),rec.get("project_id")]:
                ns=norm(source)
                if not ns:continue
                exact=[pfx for pfx,nv in pn.items() if nv==ns]
                partial=[pfx for pfx,nv in pn.items() if ns in nv or nv in ns]
                for pfx in exact+partial:
                    if pfx not in candidates:candidates.append(pfx)
            tested=[]
            resolved=None
            for pfx in candidates[:20]:
                url=EPT_ROOT+pfx+"/ept.json"
                rr=requests.get(url,headers=UA,timeout=45)
                tested.append({"prefix":pfx,"status":rr.status_code})
                if rr.status_code==200:
                    resolved={"prefix":pfx,"ept_url":url,"meta":rr.json()}
                    break
            rec["derived_lpc_project_token"]=token
            rec["ept_candidates_tested"]=tested
            rec["resolved_ept"]={
              "prefix":resolved["prefix"],
              "ept_url":resolved["ept_url"],
              "points":resolved["meta"].get("points"),
              "bounds":resolved["meta"].get("bounds"),
              "boundsConforming":resolved["meta"].get("boundsConforming"),
              "srs":resolved["meta"].get("srs")
            } if resolved else None
            rows.append(rec)
            if resolved:break

        out={"point":[lon,lat],"wesm_match_count":int(len(hit)),"selected":rows[0] if rows else None,"candidates":rows}
        print(json.dumps(out,indent=2,default=str))

if __name__=="__main__":main()
