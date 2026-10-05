from pathlib import Path
import json, math, urllib.request, zipfile, tempfile, os
import shapefile

p=Path("index.html")
s=p.read_text(encoding="utf-8")

url="https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_state_500k.zip"
td=tempfile.mkdtemp(); zpath=os.path.join(td,"states.zip")
urllib.request.urlretrieve(url,zpath)
with zipfile.ZipFile(zpath) as z: z.extractall(td)
shp=next(Path(td).glob("*.shp"))
r=shapefile.Reader(str(shp))
fields=[f[0] for f in r.fields[1:]]
name_i=fields.index("NAME"); abbr_i=fields.index("STUSPS")
shapes={}
skip={"Puerto Rico","United States Virgin Islands","Guam","American Samoa","Commonwealth of the Northern Mariana Islands"}
for rec,sh in zip(r.records(),r.shapes()):
    name=str(rec[name_i]); abbr=str(rec[abbr_i])
    if name in skip: continue
    pts=sh.points; parts=list(sh.parts)+[len(pts)]; rings=[]
    for i in range(len(parts)-1):
        ring=pts[parts[i]:parts[i+1]]
        if len(ring)<4: continue
        step=max(1,math.ceil(len(ring)/110))
        simp=[ring[j] for j in range(0,len(ring),step)]
        if simp[-1]!=ring[-1]: simp.append(ring[-1])
        rings.append([[round(x,4),round(y,4)] for x,y in simp])
    if rings: shapes[name]={"abbr":abbr,"rings":rings}

state_json=json.dumps(shapes,separators=(",",":"))
marker="const EL_US_STATE_SHAPES="
if marker in s:
    a=s.index(marker); b=s.index(";\n",a)+2
    s=s[:a]+s[b:]
insert=s.index("function mapSvg(d,small=false){")
s=s[:insert]+"const EL_US_STATE_SHAPES="+state_json+";\n"+s[insert:]

start=s.index("function mapSvg(d,small=false){")
try: end=s.index("function gradeSummary",start)
except ValueError: end=s.index("  return parts.join('');\n}",start)+len("  return parts.join('');\n}")

fn=r'''function mapSvg(d,small=false){
  const W=1100,H=small?470:620;
  const mainX=28,mainY=42,mainW=770,mainH=H-78;
  const sideX=820,sideY=42,sideW=252,sideH=mainH;
  const rawB=reportBounds(d);
  const rows=graded();
  const swaleRows=rows.filter(r=>r&&r.f&&r.f.geometry&&r.f.geometry.type==='LineString');
  const reportFlows=flows().filter(f=>f?.geometry?.type==='LineString').slice(0,240);
  const reportContours=contours().filter(f=>f?.geometry?.type==='LineString').slice(0,220);
  const aquiferFeatures=reportAquifers();

  const text=JSON.stringify(d||{}).toLowerCase();
  const stateAbbr={al:'Alabama',ak:'Alaska',az:'Arizona',ar:'Arkansas',ca:'California',co:'Colorado',ct:'Connecticut',de:'Delaware',fl:'Florida',ga:'Georgia',hi:'Hawaii',id:'Idaho',il:'Illinois',in:'Indiana',ia:'Iowa',ks:'Kansas',ky:'Kentucky',la:'Louisiana',me:'Maine',md:'Maryland',ma:'Massachusetts',mi:'Michigan',mn:'Minnesota',ms:'Mississippi',mo:'Missouri',mt:'Montana',ne:'Nebraska',nv:'Nevada',nh:'New Hampshire',nj:'New Jersey',nm:'New Mexico',ny:'New York',nc:'North Carolina',nd:'North Dakota',oh:'Ohio',ok:'Oklahoma',or:'Oregon',pa:'Pennsylvania',ri:'Rhode Island',sc:'South Carolina',sd:'South Dakota',tn:'Tennessee',tx:'Texas',ut:'Utah',vt:'Vermont',va:'Virginia',wa:'Washington',wv:'West Virginia',wi:'Wisconsin',wy:'Wyoming',dc:'District of Columbia'};
  let stateName=Object.keys(EL_US_STATE_SHAPES).find(n=>text.includes(n.toLowerCase()))||'';
  if(!stateName){
    for(const [ab,n] of Object.entries(stateAbbr)){
      const re=new RegExp('(^|[^a-z])'+ab+'([^a-z]|$)','i');
      if(re.test(String(d?.state||d?.query||d?.location||''))){stateName=n;break}
    }
  }
  const state=stateName?EL_US_STATE_SHAPES[stateName]:null;
  const modeText=String(d?.tier||d?.mode||d?.extentClass||'').toLowerCase();
  const propertyMode=modeText.includes('property')||modeText.includes('parcel')||modeText.includes('site');

  const allStatePts=state?state.rings.flat():[];
  let stateB=null;
  if(allStatePts.length){
    const xs=allStatePts.map(q=>+q[0]),ys=allStatePts.map(q=>+q[1]);
    stateB=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  }

  let b=propertyMode?rawB.slice():(stateB||rawB).slice();
  const pad=.075,dx=Math.max(.0001,b[2]-b[0]),dy=Math.max(.0001,b[3]-b[1]);
  b=[b[0]-dx*pad,b[1]-dy*pad,b[2]+dx*pad,b[3]+dy*pad];
  const midLat=(b[1]+b[3])/2,cosLat=Math.max(.2,Math.cos(midLat*Math.PI/180));
  let cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,dxDeg=b[2]-b[0],dyDeg=b[3]-b[1];
  const target=mainW/mainH,current=(dxDeg*cosLat)/dyDeg;
  if(current<target)dxDeg=(dyDeg*target)/cosLat;else dyDeg=(dxDeg*cosLat)/target;
  b=[cx-dxDeg/2,cy-dyDeg/2,cx+dxDeg/2,cy+dyDeg/2];

  const xSpan=b[2]-b[0],ySpan=b[3]-b[1];
  const sx=x=>mainX+(x-b[0])/xSpan*mainW,sy=y=>mainY+mainH-(y-b[1])/ySpan*mainH;
  const pathCoords=coords=>(coords||[]).map((q,i)=>(i?'L':'M')+sx(+q[0]).toFixed(1)+' '+sy(+q[1]).toFixed(1)).join(' ');
  const path=f=>pathCoords(f?.geometry?.coordinates||[]);
  const mid=f=>{const a=f?.geometry?.coordinates||[];return a.length?a[Math.floor((a.length-1)/2)]:null};
  const slen=f=>{const a=f?.geometry?.coordinates||[];let L=0;for(let i=1;i<a.length;i++)L+=Math.hypot(sx(+a[i][0])-sx(+a[i-1][0]),sy(+a[i][1])-sy(+a[i-1][1]));return L};

  const flowRank=reportFlows.map(f=>({f,L:slen(f)})).sort((a,b)=>b.L-a.L);
  const principal=flowRank.slice(0,Math.min(propertyMode?4:6,flowRank.length));
  const priority=swaleRows.filter(r=>r.grade==='A').slice(0,propertyMode?14:10);
  const support=propertyMode?swaleRows.filter(r=>r.grade==='B').slice(0,8):[];

  const clip='elMain16983',arrow='elArrow16983',parts=[];
  parts.push('<svg class="el-report-institutional-map-16983" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Earthline recharge opportunity map with geographic context">');
  parts.push('<defs><clipPath id="'+clip+'"><rect x="'+mainX+'" y="'+mainY+'" width="'+mainW+'" height="'+mainH+'" rx="4"/></clipPath><marker id="'+arrow+'" markerWidth="5" markerHeight="5" refX="4.4" refY="2.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L5 2.5 L0 5 Z" fill="#2b7895"/></marker></defs>');
  parts.push('<rect width="'+W+'" height="'+H+'" fill="#ffffff"/>');
  const mapTitle=propertyMode?'SITE RECHARGE OPPORTUNITY':'REGIONAL RECHARGE OPPORTUNITY';
  parts.push('<text x="'+mainX+'" y="20" fill="#1d3430" font-family="Noto Sans,Arial,sans-serif" font-size="12" font-weight="850" letter-spacing=".8">'+mapTitle+'</text>');
  parts.push('<text x="'+mainX+'" y="34" fill="#6d7974" font-family="Noto Sans,Arial,sans-serif" font-size="6.3">Earthline Screening Method v1.0 · geographic context + published run geometry</text>');
  parts.push('<rect x="'+mainX+'" y="'+mainY+'" width="'+mainW+'" height="'+mainH+'" rx="4" fill="#f4f5f1" stroke="#9da8a2" stroke-width=".85"/>');
  parts.push('<g clip-path="url(#'+clip+')">');

  if(state){
    for(const ring of state.rings){
      const dp=pathCoords(ring);if(dp)parts.push('<path d="'+dp+' Z" fill="#eef1ec" stroke="#55655e" stroke-width="1.35" vector-effect="non-scaling-stroke"/>');
    }
  }
  if(propertyMode){
    for(let i=0;i<reportContours.length;i+=14){
      const dp=path(reportContours[i]);if(dp)parts.push('<path d="'+dp+'" fill="none" stroke="#b6bbb4" stroke-width=".48" opacity=".34" vector-effect="non-scaling-stroke"/>');
    }
  }

  const rb=rawB;
  const ax=sx(rb[0]),ay=sy(rb[3]),aw=sx(rb[2])-sx(rb[0]),ah=sy(rb[1])-sy(rb[3]);
  parts.push('<rect x="'+ax.toFixed(1)+'" y="'+ay.toFixed(1)+'" width="'+Math.max(1,aw).toFixed(1)+'" height="'+Math.max(1,ah).toFixed(1)+'" fill="#ffffff" fill-opacity=".05" stroke="#273d37" stroke-width="1.8" stroke-dasharray="'+(propertyMode?'0':'5 3')+'" vector-effect="non-scaling-stroke"/>');

  for(const f of aquiferFeatures){
    const g=f&&f.geometry;if(!g)continue;
    const polys=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
    for(const poly of polys){
      const rings=poly.filter(r=>Array.isArray(r)&&r.length>=3);if(!rings.length)continue;
      const dp=rings.map(r=>pathCoords(r)+' Z').join(' ');
      parts.push('<path d="'+dp+'" fill="#dfa05c" fill-opacity=".16" fill-rule="evenodd" stroke="#be7736" stroke-width=".55" stroke-opacity=".55" vector-effect="non-scaling-stroke"/>');
    }
  }

  let fi=0;
  for(const row of principal){
    const dp=path(row.f);if(!dp)continue;
    parts.push('<path d="'+dp+'" fill="none" stroke="#d8e9ee" stroke-width="3.2" opacity=".92" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>');
    parts.push('<path d="'+dp+'" fill="none" stroke="#2b7895" stroke-width="1.35" opacity=".98" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"'+(fi++<2?' marker-end="url(#'+arrow+')"':'')+'/>');
  }
  for(const r of support){
    const dp=path(r.f);if(dp)parts.push('<path d="'+dp+'" fill="none" stroke="#7d9875" stroke-width="1.15" opacity=".38" stroke-dasharray="4 3" stroke-linecap="round" vector-effect="non-scaling-stroke"/>');
  }
  for(const r of priority){
    const dp=path(r.f);if(!dp)continue;
    parts.push('<path d="'+dp+'" fill="none" stroke="#ffffff" stroke-width="5.2" opacity=".97" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>');
    parts.push('<path d="'+dp+'" fill="none" stroke="#3f714b" stroke-width="2.8" opacity=".99" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>');
    parts.push('<path d="'+dp+'" fill="none" stroke="#8ab57d" stroke-width="1.15" opacity=".98" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>');
  }
  for(let i=0;i<Math.min(3,priority.length);i++){
    const q=mid(priority[i].f);if(!q)continue;const x=sx(+q[0]),y=sy(+q[1]);
    parts.push('<g><circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="7.2" fill="#ffffff" stroke="#3f714b" stroke-width="1.1"/><text x="'+x.toFixed(1)+'" y="'+(y+2.1).toFixed(1)+'" text-anchor="middle" fill="#31583b" font-family="Noto Sans,Arial,sans-serif" font-size="5.8" font-weight="850">A'+(i+1)+'</text></g>');
  }
  parts.push('</g>');

  const kmWide=Math.max(.001,xSpan*111.32*cosLat),mWide=kmWide*1000;
  const candidates=[50,100,200,500,1000,2000,5000,10000,20000,50000,100000,200000];
  let niceM=candidates[0];for(const c of candidates){if(c<=mWide*.23)niceM=c;else break}
  const barPx=Math.max(48,Math.min(150,niceM/mWide*mainW)),barLabel=niceM>=1000?(niceM/1000)+' km':niceM+' m';
  parts.push('<g transform="translate('+(mainX+16)+','+(mainY+mainH-18)+')"><path d="M0 0 H'+barPx+'" stroke="#334a43" stroke-width="1.05"/><path d="M0 -3 V3 M'+barPx+' -3 V3" stroke="#334a43" stroke-width=".8"/><text x="'+(barPx/2)+'" y="11" text-anchor="middle" fill="#596861" font-family="Noto Sans,Arial,sans-serif" font-size="5.7" font-weight="700">'+barLabel+'</text></g>');
  parts.push('<g transform="translate('+(mainX+mainW-28)+','+(mainY+14)+')"><text x="7" y="5" text-anchor="middle" fill="#2f453e" font-family="Noto Sans,Arial,sans-serif" font-size="6.7" font-weight="850">N</text><path d="M7 10 V30" stroke="#2f453e" stroke-width="1"/><path d="M7 10 L3 18 L7 15 L11 18 Z" fill="#2f453e"/></g>');

  parts.push('<rect x="'+sideX+'" y="'+sideY+'" width="'+sideW+'" height="'+sideH+'" rx="5" fill="#fafaf7" stroke="#d0d5d1" stroke-width=".75"/>');
  parts.push('<text x="'+(sideX+16)+'" y="'+(sideY+23)+'" fill="#213b35" font-family="Noto Sans,Arial,sans-serif" font-size="8.2" font-weight="850" letter-spacing=".7">GEOGRAPHIC CONTEXT</text>');
  parts.push('<path d="M'+(sideX+16)+' '+(sideY+31)+' H'+(sideX+sideW-16)+'" stroke="#76a9bb" stroke-width=".9"/>');

  if(state){
    const ix=sideX+18,iy=sideY+46,iw=sideW-36,ih=150;
    const sb=stateB,sdx=sb[2]-sb[0],sdy=sb[3]-sb[1];
    const sc=Math.min(iw/sdx,ih/sdy),ox=ix+(iw-sdx*sc)/2,oy=iy+(ih-sdy*sc)/2;
    const isx=x=>ox+(x-sb[0])*sc,isy=y=>oy+ih-(y-sb[1])*sc-(ih-sdy*sc)/2;
    for(const ring of state.rings){
      const dp=ring.map((q,i)=>(i?'L':'M')+isx(+q[0]).toFixed(1)+' '+isy(+q[1]).toFixed(1)).join(' ');
      parts.push('<path d="'+dp+' Z" fill="#e9eee9" stroke="#596a62" stroke-width=".9"/>');
    }
    const rcx=(rawB[0]+rawB[2])/2,rcy=(rawB[1]+rawB[3])/2;
    parts.push('<circle cx="'+isx(rcx).toFixed(1)+'" cy="'+isy(rcy).toFixed(1)+'" r="4.3" fill="#2b7895" stroke="#ffffff" stroke-width="1.2"/>');
    parts.push('<text x="'+(sideX+18)+'" y="'+(sideY+213)+'" fill="#30483f" font-family="Noto Sans,Arial,sans-serif" font-size="7.2" font-weight="800">'+stateName.toUpperCase()+'</text>');
    parts.push('<text x="'+(sideX+18)+'" y="'+(sideY+226)+'" fill="#6f7b76" font-family="Noto Sans,Arial,sans-serif" font-size="5.6">Analysis location shown in blue</text>');
  }else{
    parts.push('<text x="'+(sideX+18)+'" y="'+(sideY+76)+'" fill="#68766f" font-family="Noto Sans,Arial,sans-serif" font-size="6.2">State locator available for U.S. reports.</text>');
  }

  const ky=sideY+260;
  parts.push('<text x="'+(sideX+16)+'" y="'+ky+'" fill="#213b35" font-family="Noto Sans,Arial,sans-serif" font-size="7.5" font-weight="850" letter-spacing=".6">MAP KEY</text>');
  parts.push('<path d="M'+(sideX+16)+' '+(ky+10)+' H'+(sideX+sideW-16)+'" stroke="#d3d8d4" stroke-width=".7"/>');
  parts.push('<path d="M'+(sideX+18)+' '+(ky+31)+' H'+(sideX+48)+'" stroke="#3f714b" stroke-width="3"/><path d="M'+(sideX+18)+' '+(ky+31)+' H'+(sideX+48)+'" stroke="#8ab57d" stroke-width="1.2"/><text x="'+(sideX+58)+'" y="'+(ky+34)+'" fill="#4d5f57" font-family="Noto Sans,Arial,sans-serif" font-size="6.1">Priority bioswale</text>');
  parts.push('<path d="M'+(sideX+18)+' '+(ky+55)+' H'+(sideX+48)+'" stroke="#2b7895" stroke-width="1.4"/><text x="'+(sideX+58)+'" y="'+(ky+58)+'" fill="#4d5f57" font-family="Noto Sans,Arial,sans-serif" font-size="6.1">Modeled water path</text>');
  parts.push('<rect x="'+(sideX+18)+'" y="'+(ky+72)+'" width="30" height="9" fill="#dfa05c" fill-opacity=".22" stroke="#be7736" stroke-width=".5"/><text x="'+(sideX+58)+'" y="'+(ky+80)+'" fill="#4d5f57" font-family="Noto Sans,Arial,sans-serif" font-size="6.1">Mapped aquifer context</text>');
  parts.push('<rect x="'+(sideX+18)+'" y="'+(ky+96)+'" width="30" height="15" fill="none" stroke="#273d37" stroke-width="1.4" stroke-dasharray="'+(propertyMode?'0':'4 2')+'"/><text x="'+(sideX+58)+'" y="'+(ky+106)+'" fill="#4d5f57" font-family="Noto Sans,Arial,sans-serif" font-size="6.1">Analysis boundary</text>');

  const vy=ky+142;
  parts.push('<text x="'+(sideX+16)+'" y="'+vy+'" fill="#213b35" font-family="Noto Sans,Arial,sans-serif" font-size="7.5" font-weight="850" letter-spacing=".6">HOW TO READ THIS MAP</text>');
  parts.push('<path d="M'+(sideX+16)+' '+(vy+10)+' H'+(sideX+sideW-16)+'" stroke="#d3d8d4" stroke-width=".7"/>');
  const lines=['1  Boundary establishes geographic scale.','2  Blue paths show modeled water movement.','3  Green corridors show priority interventions.','4  Orange context identifies mapped aquifers.'];
  lines.forEach((t,i)=>parts.push('<text x="'+(sideX+18)+'" y="'+(vy+31+i*18)+'" fill="#5c6963" font-family="Noto Sans,Arial,sans-serif" font-size="5.8">'+t+'</text>'));
  parts.push('<text x="'+(sideX+16)+'" y="'+(sideY+sideH-22)+'" fill="#78837e" font-family="Noto Sans,Arial,sans-serif" font-size="5.1">Screening output · field verification required before design</text>');
  parts.push('</svg>');
  return parts.join('');
}
'''
s=s[:start]+fn+s[end:]
old="Figure 1. Earthline engine output for the recorded analysis extent. Green lines show priority bioswale opportunities, blue lines show modeled surface-water paths, and pale orange areas show mapped aquifer context. Screening only; field verification is required before design."
new="Figure 1. Earthline recharge-opportunity map. The main frame establishes state or site context, the dark boundary shows the recorded analysis extent, green corridors show priority bioswale opportunities, blue lines show modeled surface-water paths, and pale orange areas show mapped aquifer context. Screening only; field verification is required before design."
if old in s: s=s.replace(old,new,1)
if "el-report-institutional-map-16983" not in s: raise SystemExit("16983 marker missing")
p.write_text(s,encoding="utf-8")
