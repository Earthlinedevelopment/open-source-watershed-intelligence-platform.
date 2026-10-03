from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')
anchor="const path=f=>pathCoords(f?.geometry?.coordinates||[]),smoothPath=f=>pathCoords(smooth(f?.geometry?.coordinates||[]));"
insert="""const path=f=>pathCoords(f?.geometry?.coordinates||[]),smoothPath=f=>pathCoords(smooth(f?.geometry?.coordinates||[]));
    const contourElevationM=f=>{const p=f&&f.properties||{};for(const k of ['ele','elevation','elevation_m','elev_m','level','levelM','contour','contour_m','z']){const v=Number(p[k]);if(Number.isFinite(v))return v}return null};
    const contourLabelPoint=f=>{const c=f&&f.geometry&&f.geometry.type==='LineString'?f.geometry.coordinates:null;if(!Array.isArray(c)||c.length<2)return null;const q=c[Math.floor((c.length-1)*.58)];return Array.isArray(q)&&Number.isFinite(+q[0])&&Number.isFinite(+q[1])?q:null};"""
if anchor not in s and 'const contourElevationM=f=>' not in s: raise SystemExit('report path helper anchor not found')
s=s.replace(anchor,insert,1)
old="for(const f of reportContours)parts.push(`<path d=\"${path(f)}\" fill=\"none\" stroke=\"#738883\" stroke-width=\".52\" opacity=\".34\"/>`);"
if old not in s:
    old="for(const f of contours().filter(x=>x?.geometry?.type==='LineString').slice(0,170))parts.push(`<path d=\"${path(f)}\" fill=\"none\" stroke=\"#738883\" stroke-width=\".52\" opacity=\".34\"/>`);"
new="""const reportContours=contours().filter(x=>x?.geometry?.type==='LineString').slice(0,170);
    for(const f of reportContours)parts.push(`<path d=\"${path(f)}\" fill=\"none\" stroke=\"#738883\" stroke-width=\".52\" opacity=\".34\"/>`);
    let contourLabelCount=0;
    for(let ci=0;ci<reportContours.length&&contourLabelCount<(small?7:12);ci+=Math.max(1,Math.floor(reportContours.length/(small?7:12)))){
      const f=reportContours[ci],elev=contourElevationM(f),pt=contourLabelPoint(f);
      if(!Number.isFinite(elev)||!pt||!inside(pt))continue;
      const x=sx(+pt[0]).toFixed(1),y=sy(+pt[1]).toFixed(1),label=Math.round(elev)+' m';
      parts.push(`<g class=\"el-report-contour-label\"><rect x=\"${(+x-13).toFixed(1)}\" y=\"${(+y-7).toFixed(1)}\" width=\"26\" height=\"11\" rx=\"2.4\" fill=\"#eef2ef\" fill-opacity=\".88\"/><text x=\"${x}\" y=\"${(+y+1.5).toFixed(1)}\" text-anchor=\"middle\" fill=\"#536a66\" font-size=\"${small?6.8:7.4}\" font-weight=\"700\">${label}</text></g>`);
      contourLabelCount++;
    }"""
if 'el-report-contour-label' not in s:
    if old not in s: raise SystemExit('report contour draw anchor not found')
    s=s.replace(old,new,1)
p.write_text(s)