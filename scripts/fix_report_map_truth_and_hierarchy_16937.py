from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(errors='ignore')

pat=re.compile(r"function reportAquifers\\(\\)\\{[\\s\\S]*?\\n\\s*return out;\\n\\s*\\}\\n\\s*function graded\\(\\)")
rep="""function reportAquifers(){
    const out=[],seen=new Set(),token=String(activeToken()||snapshot()?.runToken||'');
    const addFeature=f=>{const g=f&&f.geometry;if(!g||!['Polygon','MultiPolygon'].includes(g.type)||!Array.isArray(g.coordinates))return;let key='';try{key=JSON.stringify([g.type,g.coordinates])}catch(_){key=String(out.length)}if(seen.has(key))return;seen.add(key);out.push(f)};
    const acceptedAudit=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_AUDIT_16373||null;
    const accepted=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_GEOJSON_16373||null;
    if(accepted&&Array.isArray(accepted.features)&&(!acceptedAudit?.runToken||String(acceptedAudit.runToken)===token))accepted.features.forEach(addFeature);
    const v=visual();if(v&&v.aquifers&&Array.isArray(v.aquifers.features))v.aquifers.features.forEach(addFeature);
    const rows=(typeof M!=="undefined"&&Array.isArray(M.usgsAquifers))?M.usgsAquifers:[];
    rows.map((poly,i)=>({type:"Feature",properties:{name:String(poly&&poly.name||"Mapped aquifer context"),source:String(poly&&poly.source||poly&&poly.dataSource||"Mapped groundwater context"),report_context_only:true,index:i},geometry:{type:"Polygon",coordinates:[(poly&&Array.isArray(poly.lngLatPts)?poly.lngLatPts:[]).map(c=>[Number(c[0]),Number(c[1])]).filter(c=>Number.isFinite(c[0])&&Number.isFinite(c[1]))]}})).forEach(addFeature);
    try{const src=map()?.getSource?.('el-live-aquifer-15970'),data=src&&(src._data||src._options&&src._options.data);if(data&&Array.isArray(data.features))data.features.forEach(addFeature)}catch(_){}
    return out;
  }
  function graded()"""
s,n=pat.subn(rep,s,count=1)
if n!=1: raise SystemExit('reportAquifers owner not replaced')

pat2=re.compile(r"const aquiferSvg=aquiferFeatures\\.map\\(\\(f,i\\)=>\\{[\\s\\S]*?\\}\\)\\.join\\(''\\);")
rep2="""const aquiferSvg=aquiferFeatures.map((f,i)=>{const g=f&&f.geometry;if(!g)return '';const polys=g.type==='Polygon'?[g.coordinates]:(g.type==='MultiPolygon'?g.coordinates:[]);return polys.map(poly=>{if(!Array.isArray(poly)||!poly.length)return '';const rings=poly.filter(r=>Array.isArray(r)&&r.length>=3);if(!rings.length)return '';const dpath=rings.map(r=>pathCoords(r)+' Z').join(' '),outer=rings[0],cx=outer.reduce((a,p)=>a+Number(p[0]||0),0)/outer.length,cy=outer.reduce((a,p)=>a+Number(p[1]||0),0)/outer.length,visible=inside([cx,cy]);return '<path d="'+dpath+'" fill="rgba(58,142,199,.18)" fill-rule="evenodd" stroke="#2f78a8" stroke-width="'+(small?1.5:1.8)+'" vector-effect="non-scaling-stroke" opacity=".95"><title>'+esc(f.properties?.name||'Mapped aquifer context')+' — context only</title></path>'+(visible?'<g class="el-report-aquifer-label"><rect x="'+(sx(cx)-42).toFixed(1)+'" y="'+(sy(cy)-9).toFixed(1)+'" width="84" height="15" rx="4" fill="#f7fbfd" fill-opacity=".9" stroke="#7fb1cf" stroke-width=".6"/><text x="'+sx(cx).toFixed(1)+'" y="'+(sy(cy)+1.5).toFixed(1)+'" text-anchor="middle" fill="#1f5f86" font-size="'+(small?6.7:7.5)+'" font-weight="800">AQUIFER CONTEXT</text></g>':'')}).join('')}).join('');"""
s,n=pat2.subn(rep2,s,count=1)
if n!=1: raise SystemExit('aquifer rendering owner not replaced')

s=s.replace('stroke="#7f8c87" stroke-width=".38" opacity=".24"','stroke="#7f8c87" stroke-width=".34" opacity=".20"',1)
s=s.replace('stroke="#ffffff" stroke-width="2.15" opacity=".58"','stroke="#ffffff" stroke-width="1.8" opacity=".48"',1)
s=s.replace('stroke="#1889b7" stroke-width="1.05" opacity=".82"','stroke="#1889b7" stroke-width=".9" opacity=".74"',1)

pat3=re.compile(r"const rows=graded\\(\\);for\\(const r of rows\\)\\{const color=r\\.grade==='A'\\?'#18875f':r\\.grade==='B'\\?'#b4872d':'#b7683b',[\\s\\S]*?\\}\\)")
rep3="""const rows=graded();for(const r of rows){const color=r.grade==='A'?'#18875f':r.grade==='B'?'#b4872d':'#b7683b',mainW=r.grade==='A'?2.15:r.grade==='B'?1.75:1.45,haloW=mainW+1.35,dpath=smoothPath(r.f);parts.push('<path d="'+dpath+'" fill="none" stroke="#fffdf8" stroke-width="'+haloW+'" stroke-linecap="round" stroke-linejoin="round" opacity=".88"/><path d="'+dpath+'" fill="none" stroke="'+color+'" stroke-width="'+mainW+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+(r.grade==='C'?'.62':'.86')+'"/>')}"""
s,n=pat3.subn(rep3,s,count=1)
if n!=1: raise SystemExit('swale report render owner not replaced')

p.write_text(s)
