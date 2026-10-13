from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_visibility="    /* EARTHLINE 17124 — BUILD-CHECK-15805 is the single Property swale visibility owner. */if(t==='regional'){setPaint('earthline-ranked-swale-water-15777','line-color','#008cff');setPaint('earthline-ranked-swale-water-15777','line-opacity',1)}"
new_visibility="    for(const id of Object.values(PROPERTY))visible(id,property);if(t==='regional'){setPaint('earthline-ranked-swale-water-15777','line-color','#008cff');setPaint('earthline-ranked-swale-water-15777','line-opacity',1)}"
if s.count(old_visibility)!=1:
    raise SystemExit(f"Expected one 17124 visibility block, found {s.count(old_visibility)}")
s=s.replace(old_visibility,new_visibility,1)

source_marker="/* EARTHLINE 17125 — Property source stability."
source_end="""                lastSwaleData=fc;
                src.setData(fc);
              }"""
m0=s.find(source_marker)
if m0<0:
    raise SystemExit("17125 source marker not found")
m1=s.find(source_end,m0)
if m1<0:
    raise SystemExit("17125 source block end not found")
m1+=len(source_end)
new_source="""// A committed result is small and must be republished on every authoritative
              // refresh. Signature caching is not allowed to conceal an externally emptied
              // Mapbox source.
              if(
                src&&src.setData&&
                (force||committedProperty||sourceChanged||signature!==lastSwaleSignature)
              ){
                lastSwaleSignature=signature;
                lastSwaleData=fc;
                src.setData(fc);
              }"""
s=s[:m0]+new_source+s[m1:]

if s.count(old_source)!=1:
    raise SystemExit(f"Expected one 17125 source block, found {s.count(old_source)}")
s=s.replace(old_source,new_source,1)

blue="paint:{'line-color':'#008cff','line-width':['interpolate',['linear'],['zoom'],14,3.4,17,5.4,20,7.2],'line-opacity':.82}}"
zoom=".el49-detail-shell{width:min(680px,96vw);max-height:calc(100vh - 36px);overflow:auto;"
if blue not in s:
    raise SystemExit("Property blue lock missing")
if zoom not in s:
    raise SystemExit("Zoom repair missing")
if "earthline-presentation-lock-17139" in s:
    raise SystemExit("Rejected Regional override present")
p.write_text(s,encoding="utf-8")

q=Path("earthline-launch-16872.js")
j=q.read_text(encoding="utf-8")
old_zoom_refresh="    if(t.matches?.('[data-action=\"zoom\"]')||label.includes('zoom to location')||label.includes('zoom to this location'))refresh();"
new_zoom_refresh="    /* EARTHLINE 17133 — Elder is downstream of Property publication; Zoom no longer invokes Elder refresh. */"
if j.count(old_zoom_refresh)!=1:
    raise SystemExit(f"Expected one Elder Zoom hook, found {j.count(old_zoom_refresh)}")
j=j.replace(old_zoom_refresh,new_zoom_refresh,1)
q.write_text(j,encoding="utf-8")

s=p.read_text(encoding="utf-8")
j=q.read_text(encoding="utf-8")
assert "for(const id of Object.values(PROPERTY))visible(id,property);" in s
assert "(force||committedProperty||sourceChanged||signature!==lastSwaleSignature)" in s
assert "EARTHLINE 17124 — BUILD-CHECK-15805 is the single Property swale visibility owner." not in s
assert "EARTHLINE 17125 — Property source stability." not in s
assert blue in s
assert zoom in s
assert "EARTHLINE 17133 — Elder is downstream of Property publication" in j
assert "label.includes('zoom to this location'))refresh();" not in j
print("17133 transition restore contract PASS")
