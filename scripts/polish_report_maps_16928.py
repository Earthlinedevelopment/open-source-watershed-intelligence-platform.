from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')

pairs=[
('stop-color="#eef5f2"','stop-color="#edf1ee"'),
('stop-color="#dbe8df"','stop-color="#d5e0da"'),
('fill="rgba(35,126,196,.16)"','fill="rgba(35,126,196,.11)"'),
('stroke="#237ec4" stroke-width="${small?1.4:1.8}" stroke-dasharray="5 3"','stroke="#2c78ad" stroke-width="${small?1.25:1.6}" stroke-dasharray="6 4"'),
('stroke="#879b99" stroke-width=".58" opacity=".45"','stroke="#738883" stroke-width=".52" opacity=".34"'),
('stroke="#3e2c1e" stroke-width="6.2" stroke-linecap="round" stroke-linejoin="round" opacity=".92"','stroke="#f7f4ea" stroke-width="7.1" stroke-linecap="round" stroke-linejoin="round" opacity=".86"'),
('stroke="${color}" stroke-width="4.1" stroke-linecap="round" stroke-linejoin="round"','stroke="${color}" stroke-width="4.25" stroke-linecap="round" stroke-linejoin="round"'),
('stroke="#baf2d2" stroke-width="1.05" stroke-dasharray="5 4" stroke-linecap="round" opacity=".8"','stroke="#17323d" stroke-width=".72" stroke-dasharray="5 4" stroke-linecap="round" opacity=".72"')
]
for old,new in pairs:
    if old in s: s=s.replace(old,new,1)

old="for(const f of flows().filter(x=>x?.geometry?.type==='LineString').slice(0,240))parts.push(`<path d=\"${path(f)}\" fill=\"none\" stroke=\"#1a9fd3\" stroke-width=\"1.15\" opacity=\".78\"/>`);"
new="for(const f of flows().filter(x=>x?.geometry?.type==='LineString').slice(0,240)){const fp=path(f);parts.push(`<path d=\"${fp}\" fill=\"none\" stroke=\"#f4fbff\" stroke-width=\"2.7\" opacity=\".62\" stroke-linecap=\"round\"/><path d=\"${fp}\" fill=\"none\" stroke=\"#178fc4\" stroke-width=\"1.35\" opacity=\".9\" stroke-linecap=\"round\"/>`);}"
if old not in s and new not in s: raise SystemExit('flow style anchor not found')
s=s.replace(old,new,1)

old="const title='Earthline '+(reportPlace?reportPlace+' ':'')+(reportTier==='focus'?'focus':'regional')+' screening map';"
new=old+"+''"
# Insert a bounded Vermont-context flag without changing analysis geometry.
flag="const isVermont=b[0]>=-74.1&&b[2]<=-71.0&&b[1]>=42.4&&b[3]<=45.3;"
if old in s and flag not in s: s=s.replace(old,old+flag,1)

oldstate="parts.push(`<path d=\"${pathCoords(state)}\" fill=\"none\" stroke=\"#5e7d72\" stroke-width=\"1.5\" opacity=\".9\"/>`);"
newstate="if(isVermont)parts.push(`<path d=\"${pathCoords(state)}\" fill=\"none\" stroke=\"#6f857c\" stroke-width=\"1.15\" opacity=\".55\"/>`);"
if oldstate in s: s=s.replace(oldstate,newstate,1)

oldroads="for(const r of roads)parts.push(`<path d=\"${pathCoords(r)}\" fill=\"none\" stroke=\"#b59664\" stroke-width=\"1.15\" opacity=\".55\"/>`);"
newroads="if(isVermont)for(const r of roads)parts.push(`<path d=\"${pathCoords(r)}\" fill=\"none\" stroke=\"#aa9675\" stroke-width=\".9\" opacity=\".36\"/>`);"
if oldroads in s: s=s.replace(oldroads,newroads,1)

p.write_text(s)