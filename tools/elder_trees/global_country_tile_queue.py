#!/usr/bin/env python3
"""
Earthline Elder Trees — global CHMv2 country tile queue.
OFF-PRODUCTION ONLY.

Builds deterministic zoom-10 quadkey queues by country/territory boundary.
This is a processing index only; it does not assert CHMv2 tile availability
and does not generate tree points.
"""
from __future__ import annotations
import json, math, sys, tempfile, zipfile
from pathlib import Path
import requests
import geopandas as gpd
from shapely.geometry import box

NE="https://naturalearth.s3.amazonaws.com/50m_cultural/ne_50m_admin_0_countries.zip"
UA={"User-Agent":"Earthline-ElderTree-Research/1.3"}
ZOOM=10

def dl(url,path):
    r=requests.get(url,headers=UA,timeout=240);r.raise_for_status();path.write_bytes(r.content)

def lonlat_to_tile(lon,lat,z):
    lat=max(-85.05112878,min(85.05112878,lat))
    n=1<<z
    x=int(min(n-1,max(0,(lon+180.0)/360.0*n)))
    s=math.sin(math.radians(lat))
    y=int(min(n-1,max(0,(0.5-math.log((1+s)/(1-s))/(4*math.pi))*n)))
    return x,y

def tile_bounds(x,y,z):
    n=1<<z
    lon1=x/n*360.0-180.0;lon2=(x+1)/n*360.0-180.0
    def lat(yy):
        a=math.pi*(1-2*yy/n)
        return math.degrees(math.atan(math.sinh(a)))
    lat1=lat(y+1);lat2=lat(y)
    return lon1,lat1,lon2,lat2

def quadkey(x,y,z):
    out=[]
    for i in range(z,0,-1):
        bit=1<<(i-1);d=0
        if x&bit:d+=1
        if y&bit:d+=2
        out.append(str(d))
    return "".join(out)

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else "artifacts/elder-trees-global-tiles")
    out.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); zpath=td/"ne.zip";dl(NE,zpath)
        with zipfile.ZipFile(zpath) as z:z.extractall(td/"ne")
        shp=next((td/"ne").glob("*.shp"))
        world=gpd.read_file(shp).to_crs(4326)
        records=[];total=0
        for _,row in world.iterrows():
            geom=row.geometry
            if geom is None or geom.is_empty:continue
            iso3=str(row.get("ISO_A3") or row.get("ADM0_A3") or "")
            if iso3=="-99": iso3=str(row.get("ADM0_A3") or "")
            name=str(row.get("NAME") or row.get("ADMIN") or iso3)
            minx,miny,maxx,maxy=geom.bounds
            tx0,ty1=lonlat_to_tile(minx,miny,ZOOM)
            tx1,ty0=lonlat_to_tile(maxx,maxy,ZOOM)
            q=[]
            for y in range(min(ty0,ty1),max(ty0,ty1)+1):
                for x in range(min(tx0,tx1),max(tx0,tx1)+1):
                    tb=box(*tile_bounds(x,y,ZOOM))
                    if geom.intersects(tb): q.append(quadkey(x,y,ZOOM))
            q=sorted(set(q));total+=len(q)
            records.append({
              "iso3":iso3,"name":name,"zoom":ZOOM,"quadkey_count":len(q),"quadkeys":q,
              "rule":"Queue entry only; processor must verify CHMv2 tile exists before reading."
            })
        records.sort(key=lambda x:x["name"])
        summary={
          "mode":"off-production","boundary_source":"Natural Earth 1:50m admin-0",
          "zoom":ZOOM,"country_feature_count":len(records),
          "country_tile_assignment_count":total,
          "purpose":"Incremental CHMv2 Elder Tree candidate processing queue."
        }
        (out/"global-country-chmv2-tile-queue.json").write_text(json.dumps(records,indent=2))
        (out/"global-country-chmv2-tile-summary.json").write_text(json.dumps(summary,indent=2))
        print(json.dumps(summary,indent=2))

if __name__=="__main__":main()
