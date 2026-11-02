"""Cache official 2025 Census cartographic state polygons for same-origin Earthline Regional analysis.
The cartographic boundary is a generalized screening boundary, not a legal parcel boundary.
No fallback is accepted unless NAME, STUSPS, geometry and all 50 state records validate.
"""
import io, json, pathlib, time, urllib.request, zipfile
import shapefile

URL="https://www2.census.gov/geo/tiger/GENZ2025/shp/cb_2025_us_state_500k.zip"
EXPECTED=set("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split())
OUT=pathlib.Path("data/jurisdiction/us-states-2025-500k")
def download():
    last=None
    for attempt in range(4):
        try:
            req=urllib.request.Request(URL,headers={"User-Agent":"EarthlineHydrology/1.0 (public nonprofit boundary cache)"})
            with urllib.request.urlopen(req,timeout=45) as resp:
                raw=resp.read()
            if len(raw)<100000 or not zipfile.is_zipfile(io.BytesIO(raw)):
                raise ValueError("Invalid Census boundary archive")
            return zipfile.ZipFile(io.BytesIO(raw))
        except Exception as e:
            last=e;print(f"Census boundary download attempt {attempt+1} failed: {e}",flush=True)
            time.sleep(3)
    raise RuntimeError(f"Cannot build an authoritative same-origin boundary: {last}")
def main():
    z=download()
    paths={path.rsplit(".",1)[-1].lower():path for path in z.namelist() if path.endswith((".shp",".shx",".dbf"))}
    for key in ("shp","shx","dbf"):
        if key not in paths:raise ValueError(f"Missing {key} in Census archive")
    shp=shapefile.Reader(shp=io.BytesIO(z.read(paths["shp"])),shx=io.BytesIO(z.read(paths["shx"])),dbf=io.BytesIO(z.read(paths["dbf"])))
    output={}
    for record in shp.iterShapeRecords():
        row=record.record.as_dict()
        abbr=str(row.get("STUSPS","")).strip().upper()
        if abbr not in EXPECTED:continue
        if abbr in output:raise ValueError(f"Duplicate state: {abbr}")
        geom=record.shape.__geo_interface__
        if geom.get("type") not in ("Polygon","MultiPolygon"):raise ValueError(f"Invalid geometry for {abbr}")
        coords=geom.get("coordinates")
        if not coords:raise ValueError(f"Empty geometry for {abbr}")
        props={"NAME":str(row.get("NAME","")),"STUSAB":abbr,"GEOID":str(row.get("GEOID","")),
               "INTPTLAT":row.get("INTPTLAT"),"INTPTLON":row.get("INTPTLON"),
               "CENSUS_SOURCE":"2025 Census Cartographic Boundary State 1:500,000"}
        if not props["NAME"] or not props["GEOID"]:raise ValueError(f"Incomplete properties for {abbr}")
        output[abbr]={"type":"FeatureCollection","features":[{"type":"Feature","properties":props,
                                                           "geometry":geom}]}
    if set(output)!=EXPECTED:raise ValueError(f"Missing state boundaries: {sorted(EXPECTED-set(output))}")
    OUT.mkdir(parents=True,exist_ok=True)
    for abbr,fc in sorted(output.items()):
        path=OUT/(abbr+".geojson")
        path.write_text(json.dumps(fc,separators=(",",":"),ensure_ascii=False),encoding="utf-8")
    (OUT/"source.json").write_text(json.dumps({"source":URL,"vintage":"2025",
        "scale":"1:500000","dataset":"Census cartographic boundaries","state_count":len(output),
        "precision":"Generalized for regional screening; not legal parcel boundaries"},indent=2)+"\n",encoding="utf-8")
    print("CENSUS_STATE_CACHE "+json.dumps({"count":len(output),"bytes":sum(p.stat().st_size for p in OUT.glob("*.geojson"))}),flush=True)
if __name__=="__main__":main()
