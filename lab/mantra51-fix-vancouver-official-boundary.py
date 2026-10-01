from pathlib import Path
import json, urllib.request

p=Path("index.html")
s=p.read_text(encoding="utf-8")

url="https://geogratis.gc.ca/services/geoname/en/geonames/JBRIN.geojson?expand=feature"
with urllib.request.urlopen(url, timeout=30) as r:
    data=json.load(r)
geom=((data.get("feature") or {}).get("geometry"))
if not geom or geom.get("type") not in ("Polygon","MultiPolygon"):
    raise SystemExit("official CGNDB Vancouver Island polygon unavailable")

def walk(v, pts):
    if isinstance(v,list):
        if len(v)>=2 and isinstance(v[0],(int,float)) and isinstance(v[1],(int,float)):
            pts.append((float(v[0]),float(v[1])))
        else:
            for x in v: walk(x,pts)
pts=[]; walk(geom.get("coordinates"),pts)
if len(pts)<100: raise SystemExit("official polygon unexpectedly sparse")
w=min(x for x,y in pts); e=max(x for x,y in pts); so=min(y for x,y in pts); n=max(y for x,y in pts)
geom_js=json.dumps(geom,separators=(",",":"))

cap_anchor="""  const earthlineBoundaryCapabilities16539=Object.freeze({
    usState:Object.freeze({
      id:'us-census-state',"""
if cap_anchor not in s: raise SystemExit("boundary capability anchor missing")
if "ca-cgndb-vancouver-island" not in s:
    replacement="""  const EARTHLINE_VANCOUVER_ISLAND_GEOMETRY_16920=Object.freeze("""+geom_js+""");
  const earthlineBoundaryCapabilities16539=Object.freeze({
    vancouverIsland:Object.freeze({
      id:'ca-cgndb-vancouver-island',placeType:'region',countryCode:'ca',
      source:'Canadian Geographical Names Database — Vancouver Island (JBRIN)',
      sourceTier:'authoritative-national',sourceVintage:'official feature polygon',
      endpoint:'embedded-from-https://geogratis.gc.ca/services/geoname/en/geonames/JBRIN.geojson?expand=feature'
    }),
    usState:Object.freeze({
      id:'us-census-state',"""
    s=s.replace(cap_anchor,replacement,1)

admin_old="""    if(pt==='region'&&cc==='us')return earthlineBoundaryCapabilities16539.usState;
    if(pt==='country')return earthlineGlobalCountryCapability16845;"""
admin_new="""    const nk=String(loc&&loc.name||loc&&loc.fullName||'').trim().toLowerCase();
    if(pt==='region'&&cc==='ca'&&nk.includes('vancouver island'))return earthlineBoundaryCapabilities16539.vancouverIsland;
    if(pt==='region'&&cc==='us')return earthlineBoundaryCapabilities16539.usState;
    if(pt==='country')return earthlineGlobalCountryCapability16845;"""
if admin_new not in s:
    if admin_old not in s: raise SystemExit("administrative capability branch missing")
    s=s.replace(admin_old,admin_new,1)

resolve_anchor="""    const cap=capability||earthlineAdministrativeCapability16539(loc);if(!cap)return null;
    const center=[Number(loc&&loc.lng),Number(loc&&loc.lat)];"""
resolve_new="""    const cap=capability||earthlineAdministrativeCapability16539(loc);if(!cap)return null;
    const center=[Number(loc&&loc.lng),Number(loc&&loc.lat)];
    if(cap.id==='ca-cgndb-vancouver-island'){
      const g=EARTHLINE_VANCOUVER_ISLAND_GEOMETRY_16920;
      const bbox=earthlineGeometryBounds16556(g),inside=earthlineInteriorPoint16556(g,bbox);
      const out={geometry:g,prepared:earthlinePrepareJurisdiction16539(g),bbox,center:inside,source:cap.source,sourceTier:cap.sourceTier,sourceVintage:cap.sourceVintage,capability:cap.id,placeType:'region',label:'Vancouver Island',code:'BC-VI',resolvedAt:new Date().toISOString()};
      window.EARTHLINE_VANCOUVER_ISLAND_BOUNDARY_16920=out;
      return out;
    }"""
if "EARTHLINE_VANCOUVER_ISLAND_BOUNDARY_16920" not in s:
    if resolve_anchor not in s: raise SystemExit("resolver anchor missing")
    s=s.replace(resolve_anchor,resolve_new,1)

old_bbox="bbox:[-128.5000,48.2800,-123.2600,50.8800],zoomHint:6.15"
new_bbox=f"bbox:[{w:.7f},{so:.7f},{e:.7f},{n:.7f}],analysisBBox:true,zoomHint:6.15"
count=s.count(old_bbox)
if count<3: raise SystemExit(f"expected 3 Vancouver rectangle overrides, found {count}")
s=s.replace(old_bbox,new_bbox,3)

if "ca-cgndb-vancouver-island" not in s or "EARTHLINE_VANCOUVER_ISLAND_GEOMETRY_16920" not in s:
    raise SystemExit("Vancouver authoritative boundary patch failed")
p.write_text(s,encoding="utf-8")
print(json.dumps({"points":len(pts),"bbox":[w,so,e,n],"source":"CGNDB JBRIN"}))

# trigger official boundary apply
