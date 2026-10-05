from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

# Critical safety fix: report grading must never mutate the live engine's swale properties.
old="function graded(){const counts={A:0,B:0,C:0};return swales().map((f,index)=>{const p=f.properties||{},g=/^[ABC]$/.test(String(p.grade||''))?String(p.grade):'C';counts[g]++;p.display_rank=counts[g];p.display_code=g+counts[g];return {f,p,grade:g,rank:counts[g],code:g+counts[g],score:Math.round(Number(p.score||0)),km:lineLengthKm(f.geometry?.coordinates||[]),index}})}"
new="function graded(){const counts={A:0,B:0,C:0};return swales().map((f,index)=>{const p=Object.assign({},f.properties||{}),g=/^[ABC]$/.test(String(p.grade||''))?String(p.grade):'C';counts[g]++;p.display_rank=counts[g];p.display_code=g+counts[g];return {f,p,grade:g,rank:counts[g],code:g+counts[g],score:Math.round(Number(p.score||0)),km:lineLengthKm(f.geometry?.coordinates||[]),index}})}"
if old not in s:
    raise SystemExit("graded() mutation token missing")
s=s.replace(old,new,1)

start=s.index("function mapSvg(d,small=false){")
try:
    end=s.index("function gradeSummary",start)
except ValueError:
    end=s.index("  return parts.join('');\n}",start)+len("  return parts.join('');\n}")

fn=r'''function mapSvg(d,small=false){
  const W=1100,H=small?470:620;
  const mainX=28,mainY=42,mainW=790,mainH=H-78;
  const sideX=840,sideY=42,sideW=232,sideH=mainH;
  const rawB=reportBounds(d);
  const aquiferFeatures=reportAquifers();
  const reportContours=contours().filter(f=>f?.geometry?.type==='LineString').slice(0,220);
  const reportFlows=flows().filter(f=>{
    if(f?.geometry?.type!=='LineString')return false;
    const t=String(f?.properties?.feature_type||'').toLowerCase();
    return !t||t==='flow'||t.includes('water');
  }).slice(0,300);

  const text=JSON.stringify(d||{}).toLowerCase();
  const stateAbbr={al:'Alabama',ak:'Alaska',az:'Arizona',ar:'Arkansas',ca:'California',co:'Colorado',ct:'Connecticut',de:'Delaware',fl:'Florida',ga:'Georgia',hi:'Hawaii',id:'Idaho',il:'Illinois',in:'Indiana',ia:'Iowa',ks:'Kansas',ky:'Kentucky',la:'Louisiana',me:'Maine',md:'Maryland',ma:'Massachusetts',mi:'Michigan',mn:'Minnesota',ms:'Mississippi',mo:'Missouri',mt:'Montana',ne:'Nebraska',nv:'Nevada',nh:'New Hampshire',nj:'New Jersey',nm:'New Mexico',ny:'New York',nc:'North Carolina',nd:'North Dakota',oh:'Ohio',ok:'Oklahoma',or:'Oregon',pa:'Pennsylvania',ri:'Rhode Island',sc:'South Carolina',sd:'South Dakota',tn:'Tennessee',tx:'Texas',ut:'Utah',vt:'Vermont',va:'Virginia',wa:'Washington',wv:'West Virginia',wi:'Wisconsin',wy:'Wyoming',dc:'District of Columbia'};
  let stateName=(typeof EL_US_STATE_SHAPES!=='undefined'?Object.keys(EL_US_STATE_SHAPES):[]).find(n=>text.includes(n.toLowerCase()))||'';
  if(!stateName){
    for(const [ab,n] of Object.entries(stateAbbr)){
      const re=new RegExp('(^|[^a-z])'+ab+'([^a-z]|$)','i');
      if(re.test(String(d?.state||d?.query||d?.location||''))){stateName=n;break}
    }
  }
  const state=(typeof EL_US_STATE_SHAPES!=='undefined'&&stateName)?EL_US_STATE_SHAPES[stateName]:null;
  const modeText=String(d?.tier||d?.mode||d?.extentClass||'').toLowerCase();
  const propertyMode=modeText.includes('property')||modeText.includes('parcel')||modeText.includes('site');

  const allStatePts=state?state.rings.flat():[];
  let stateB=null;
  if(allStatePts.length){
    const xs=allStatePts.map(q=>+q[0]),ys=allStatePts.map(q=>+q[1]);
    stateB=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  }

  let b=propertyMode?rawB.slice():(stateB||rawB).slice();
  const pad=propertyMode?.10:.055,dx=Math.max(.0001,b[2]-b[0]),dy=Math.max(.0001,b[3]-b[1]);
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
  const slen=f=>{const a=f?.geometry?.coordinates||[];let L=0;for(let i=1;i<a.length;i++)L+=Math.hypot(sx(+a[i][0])-sx(+a[i-1][0]),sy(+a[i][1])-sy(+a[i-1][1]));return L};

  const ranked=reportFlows.map(f=>({
    f,
    rank:Number(f?.properties?.accumulation||0)*1000+Number(f?.properties?.strength||0)*100+slen(f)
  })).sort((a,b)=>b.rank-a.rank);
  const major=ranked.slice(0,Math.min(propertyMode?8:10,ranked.length));
  const secondary=ranked.slice(major.length,Math.min(propertyMode?28:36,ranked.length));

  const clip='elHydroClip16985',arrow='elHydroArrow16985',parts=[];
  parts.push('<svg class="el-report-hydro-aquifer-16985" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Earthline hydrology and aquifer context map">');
  parts.push('<defs><clipPath id="'+clip+'"><rect x="'+mainX+'" y="'+mainY+'" width="'+mainW+'" height="'+mainH+'" rx="4"/></clipPath><marker id="'+arrow+'" markerWidth="5.2" markerHeight="5.2" refX="4.5" refY="2.6" orient="auto" markerUnits="strokeWidth"><path d="M0 0 L5.2 2.6 L0 5.2 Z" fill="#166b8c"/></marker></defs>');
  parts.push('<rect width="'+W+'" height="'+H+'" fill="#ffffff"/>');
  parts.push('<text x="'+mainX+'" y="20" fill="#17343d" font-family="Noto Sans,Arial,sans-serif" font-size="12.2" font-weight="850" letter-spacing=".7">HYDROLOGY + AQUIFER CONTEXT</text>');
  parts.push('<text x="'+mainX+'" y="34" fill="#6e7975" font-family="Noto Sans,Arial,sans-serif" font-size="6.2">Earthline Screening Method v1.0 · modeled surface-water movement + mapped groundwater context</text>');
  parts.push('<rect x="'+mainX+'" y="'+mainY+'" width="'+mainW+'" height="'+mainH+'" rx="4" fill="#f6f7f3" stroke="#9fa9a3" stroke-width=".85"/>');
  parts.push('<g clip-path="url(#'+clip+')">');

  if(state&&!propertyMode){
    for(const ring of state.rings){
      const dp=pathCoords(ring);if(dp)parts.push('<path d="'+dp+' Z" fill="#eef1ed" stroke="#4f6259" stroke-width="1.45" vector-effect="non-scaling-stroke"/>');
    }
  }

  if(propertyMode){
    for(let i=0;i<reportContours.length;i+=18){
      const dp=path(reportContours[i]);
      if(dp)parts.push('<path d="'+dp+'" fill="none" stroke="#b6bbb5" stroke-width=".5" opacity=".28" vector-effect="non-scaling-stroke"/>');
    }
  }

  for(const f of aquiferFeatures){
    const g=f&&f.geometry;if(!g)continue;
    const polys=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
    for(const poly of polys){
      const rings=poly.filter(r=>Array.isArray(r)&&r.length>=3);if(!rings.length)continue;
      const dp=rings.map(r=>pathCoords(r)+' Z').join(' ');
      parts.push('<path d="'+dp+'" fill="#e6a35e" fill-opacity=".23" fill-rule="evenodd" stroke="#b96d31" stroke-width=".72" stroke-opacity=".72" vector-effect="non-scaling-stroke"/>');
    }
  }

  for(const row of secondary){
    const dp=path(row.f);if(dp)parts.push('<path d="'+dp+'" fill="none" stroke="#72a7b9" stroke-width=".72" opacity=".43" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>');
  }
  let fi=0;
  for(const row of major){
    const dp=path(row.f);if(!dp)continue;
    parts.push('<path d="'+dp+'" fill="none" stroke="#f8fbfb" stroke-width="4" opacity=".94" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>');
    parts.push('<path d="'+dp+'" fill="none" stroke="#166b8c" stroke-width="1.65" opacity=".98" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"'+(fi++<4?' marker-end="url(#'+arrow+')"':'')+'/>');
  }

  const rb=rawB;
  const ax=sx(rb[0]),ay=sy(rb[3]),aw=sx(rb[2])-sx(rb[0]),ah=sy(rb[1])-sy(rb[3]);
  parts.push('<rect x="'+ax.toFixed(1)+'" y="'+ay.toFixed(1)+'" width="'+Math.max(1,aw).toFixed(1)+'" height="'+Math.max(1,ah).toFixed(1)+'" fill="none" stroke="#273d37" stroke-width="1.65" stroke-dasharray="'+(propertyMode?'0':'5 3')+'" vector-effect="non-scaling-stroke"/>');
  parts.push('</g>');

  const kmWide=Math.max(.001,xSpan*111.32*cosLat),mWide=kmWide*1000;
  const candidates=[20,50,100,200,500,1000,2000,5000,10000,20000,50000,100000,200000];
  let niceM=candidates[0];for(const c of candidates){if(c<=mWide*.22)niceM=c;else break}
  const barPx=Math.max(48,Math.min(150,niceM/mWide*mainW)),barLabel=niceM>=1000?(niceM/1000)+' km':niceM+' m';
  parts.push('<g transform="translate('+(mainX+16)+','+(mainY+mainH-18)+')"><path d="M0 0 H'+barPx+'" stroke="#334a43" stroke-width="1.05"/><path d="M0 -3 V3 M'+barPx+' -3 V3" stroke="#334a43" stroke-width=".8"/><text x="'+(barPx/2)+'" y="11" text-anchor="middle" fill="#596861" font-family="Noto Sans,Arial,sans-serif" font-size="5.7" font-weight="700">'+barLabel+'</text></g>');
  parts.push('<g transform="translate('+(mainX+mainW-28)+','+(mainY+14)+')"><text x="7" y="5" text-anchor="middle" fill="#2f453e" font-family="Noto Sans,Arial,sans-serif" font-size="6.7" font-weight="850">N</text><path d="M7 10 V30" stroke="#2f453e" stroke-width="1"/><path d="M7 10 L3 18 L7 15 L11 18 Z" fill="#2f453e"/></g>');

  parts.push('<rect x="'+sideX+'" y="'+sideY+'" width="'+sideW+'" height="'+sideH+'" rx="5" fill="#fbfbf8" stroke="#d0d5d1" stroke-width=".75"/>');
  parts.push('<text x="'+(sideX+16)+'" y="'+(sideY+23)+'" fill="#213b35" font-family="Noto Sans,Arial,sans-serif" font-size="8.1" font-weight="850" letter-spacing=".7">GEOGRAPHIC CONTEXT</text>');
  parts.push('<path d="M'+(sideX+16)+' '+(sideY+31)+' H'+(sideX+sideW-16)+'" stroke="#75a8b9" stroke-width=".9"/>');

  if(state){
    const ix=sideX+18,iy=sideY+46,iw=sideW-36,ih=145;
    const sb=stateB,sdx=sb[2]-sb[0],sdy=sb[3]-sb[1];
    const sc=Math.min(iw/sdx,ih/sdy),ox=ix+(iw-sdx*sc)/2,oy=iy+(ih-sdy*sc)/2;
    const isx=x=>ox+(x-sb[0])*sc,isy=y=>oy+ih-(y-sb[1])*sc-(ih-sdy*sc)/2;
    for(const ring of state.rings){
      const dp=ring.map((q,i)=>(i?'L':'M')+isx(+q[0]).toFixed(1)+' '+isy(+q[1]).toFixed(1)).join(' ');
      parts.push('<path d="'+dp+' Z" fill="#edf1ed" stroke="#56675f" stroke-width=".9"/>');
    }
    const rcx=(rawB[0]+rawB[2])/2,rcy=(rawB[1]+rawB[3])/2;
    parts.push('<circle cx="'+isx(rcx).toFixed(1)+'" cy="'+isy(rcy).toFixed(1)+'" r="4.2" fill="#166b8c" stroke="#ffffff" stroke-width="1.2"/>');
    parts.push('<text x="'+(sideX+18)+'" y="'+(sideY+207)+'" fill="#30483f" font-family="Noto Sans,Arial,sans-serif" font-size="7.1" font-weight="800">'+stateName.toUpperCase()+'</text>');
    parts.push('<text x="'+(sideX+18)+'" y="'+(sideY+220)+'" fill="#6f7b76" font-family="Noto Sans,Arial,sans-serif" font-size="5.5">Analysis location shown in blue</text>');
  }else{
    parts.push('<text x="'+(sideX+18)+'" y="'+(sideY+72)+'" fill="#68766f" font-family="Noto Sans,Arial,sans-serif" font-size="6.1">Recorded analysis extent</text>');
  }

  const ky=sideY+252;
  parts.push('<text x="'+(sideX+16)+'" y="'+ky+'" fill="#213b35" font-family="Noto Sans,Arial,sans-serif" font-size="7.5" font-weight="850" letter-spacing=".6">MAP KEY</text>');
  parts.push('<path d="M'+(sideX+16)+' '+(ky+10)+' H'+(sideX+sideW-16)+'" stroke="#d3d8d4" stroke-width=".7"/>');
  parts.push('<path d="M'+(sideX+18)+' '+(ky+31)+' H'+(sideX+50)+'" stroke="#166b8c" stroke-width="1.7"/><text x="'+(sideX+60)+'" y="'+(ky+34)+'" fill="#4d5f57" font-family="Noto Sans,Arial,sans-serif" font-size="6.1">Principal water path</text>');
  parts.push('<path d="M'+(sideX+18)+' '+(ky+54)+' H'+(sideX+50)+'" stroke="#72a7b9" stroke-width=".8" opacity=".7"/><text x="'+(sideX+60)+'" y="'+(ky+57)+'" fill="#4d5f57" font-family="Noto Sans,Arial,sans-serif" font-size="6.1">Supporting water path</text>');
  parts.push('<rect x="'+(sideX+18)+'" y="'+(ky+72)+'" width="32" height="10" fill="#e6a35e" fill-opacity=".28" stroke="#b96d31" stroke-width=".55"/><text x="'+(sideX+60)+'" y="'+(ky+80)+'" fill="#4d5f57" font-family="Noto Sans,Arial,sans-serif" font-size="6.1">Mapped aquifer context</text>');
  parts.push('<rect x="'+(sideX+18)+'" y="'+(ky+96)+'" width="32" height="15" fill="none" stroke="#273d37" stroke-width="1.35" stroke-dasharray="'+(propertyMode?'0':'4 2')+'"/><text x="'+(sideX+60)+'" y="'+(ky+106)+'" fill="#4d5f57" font-family="Noto Sans,Arial,sans-serif" font-size="6.1">Analysis boundary</text>');

  const sy0=ky+146;
  parts.push('<text x="'+(sideX+16)+'" y="'+sy0+'" fill="#213b35" font-family="Noto Sans,Arial,sans-serif" font-size="7.5" font-weight="850" letter-spacing=".6">WHAT THIS FIGURE SHOWS</text>');
  parts.push('<path d="M'+(sideX+16)+' '+(sy0+10)+' H'+(sideX+sideW-16)+'" stroke="#d3d8d4" stroke-width=".7"/>');
  parts.push('<text x="'+(sideX+18)+'" y="'+(sy0+31)+'" fill="#5c6963" font-family="Noto Sans,Arial,sans-serif" font-size="5.8">Modeled surface-water movement</text>');
  parts.push('<text x="'+(sideX+18)+'" y="'+(sy0+49)+'" fill="#5c6963" font-family="Noto Sans,Arial,sans-serif" font-size="5.8">Mapped aquifer / groundwater context</text>');
  parts.push('<text x="'+(sideX+18)+'" y="'+(sy0+67)+'" fill="#5c6963" font-family="Noto Sans,Arial,sans-serif" font-size="5.8">Recorded analysis extent and location</text>');
  parts.push('<text x="'+(sideX+18)+'" y="'+(sy0+94)+'" fill="#315b4b" font-family="Noto Sans,Arial,sans-serif" font-size="5.7" font-weight="800">Bioswale corridors are intentionally omitted</text>');
  parts.push('<text x="'+(sideX+18)+'" y="'+(sy0+108)+'" fill="#66736d" font-family="Noto Sans,Arial,sans-serif" font-size="5.4">to keep hydrology and aquifer evidence readable.</text>');

  parts.push('<text x="'+(sideX+16)+'" y="'+(sideY+sideH-22)+'" fill="#78837e" font-family="Noto Sans,Arial,sans-serif" font-size="5.1">Screening output · field verification required before design</text>');
  parts.push('</svg>');
  return parts.join('');
}
'''
s=s[:start]+fn+s[end:]

s=s.replace("02 · Analysis Area and Technical Map","02 · Hydrology and Aquifer Context",1)
s=s.replace("Hydrology and Bioswale Opportunity Plan","Hydrology and Aquifer Context Map",1)
oldcap="Figure 1. Earthline recharge-opportunity map. The main frame establishes state or site context, the dark boundary shows the recorded analysis extent, green corridors show priority bioswale opportunities, blue lines show modeled surface-water paths, and pale orange areas show mapped aquifer context. Screening only; field verification is required before design."
newcap="Figure 1. Earthline hydrology and aquifer context. Blue lines show modeled surface-water movement, pale orange areas show mapped aquifer context, and the dark frame marks the recorded analysis extent. Bioswale corridors are intentionally omitted from this figure so the water and groundwater relationship remains legible. Screening only; field verification is required before design."
if oldcap not in s:
    raise SystemExit("figure caption token missing")
s=s.replace(oldcap,newcap,1)
oldinterp='<div class="el49-panel"><h3>Map interpretation</h3><p>Map IDs restart within grade: A1, A2… then B1, B2… Scores are intentionally removed from the regional map and appear in the corridor detail/report.</p></div>'
newinterp='<div class="el49-panel"><h3>Map interpretation</h3><p>This figure isolates modeled surface-water movement and mapped aquifer context. Bioswale opportunity corridors remain in the engine and report analysis, but are intentionally omitted here to preserve geographic and hydrogeologic readability.</p></div>'
if oldinterp not in s:
    raise SystemExit("map interpretation token missing")
s=s.replace(oldinterp,newinterp,1)

if "el-report-hydro-aquifer-16985" not in s:
    raise SystemExit("16985 renderer marker missing")
p.write_text(s,encoding="utf-8")
