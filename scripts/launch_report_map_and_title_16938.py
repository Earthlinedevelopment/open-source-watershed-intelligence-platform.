from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(errors='ignore')

# Professional browser title.
s,n=re.subn(r'<title>[^<]*</title>','<title>Earthline — Aquifer Recharging Starts Here.</title>',s,count=1,flags=re.I)
if n!=1: raise SystemExit('document title not found')

# Report aquifer owner: use the authoritative accepted geometry first, then current visual/native/property context.
i=s.index('function reportAquifers(){')
j=s.index('function graded()',i)
new_owner="""function reportAquifers(){
    const out=[],seen=new Set(),token=String(activeToken()||snapshot()?.runToken||'');
    const addFeature=f=>{const g=f&&f.geometry;if(!g||!['Polygon','MultiPolygon'].includes(g.type)||!Array.isArray(g.coordinates))return;let key='';try{key=JSON.stringify([g.type,g.coordinates])}catch(_){key=String(out.length)}if(seen.has(key))return;seen.add(key);out.push(f)};
    const acceptedAudit=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_AUDIT_16373||null;
    const accepted=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_GEOJSON_16373||null;
    if(accepted&&Array.isArray(accepted.features)&&(!acceptedAudit?.runToken||String(acceptedAudit.runToken)===token))accepted.features.forEach(addFeature);
    const v=visual();if(v&&v.aquifers&&Array.isArray(v.aquifers.features))v.aquifers.features.forEach(addFeature);
    const rows=(typeof M!=="undefined"&&Array.isArray(M.usgsAquifers))?M.usgsAquifers:[];
    rows.map((poly,k)=>({type:"Feature",properties:{name:String(poly&&poly.name||"Mapped aquifer context"),source:String(poly&&poly.source||poly&&poly.dataSource||"Mapped groundwater context"),report_context_only:true,index:k},geometry:{type:"Polygon",coordinates:[(poly&&Array.isArray(poly.lngLatPts)?poly.lngLatPts:[]).map(c=>[Number(c[0]),Number(c[1])]).filter(c=>Number.isFinite(c[0])&&Number.isFinite(c[1]))]}})).forEach(addFeature);
    try{
      const m=map();
      for(const id of ['el-live-aquifer-15970','earthline-aquifer-evidence','earthline-aquifer-material','earthline-recharge-zones']){
        const src=m?.getSource?.(id),data=src&&(src._data||src._options&&src._options.data);
        if(data&&Array.isArray(data.features))data.features.forEach(addFeature);
      }
      for(const id of Object.keys(m?.getStyle?.().sources||{}).filter(id=>/aquifer/i.test(id))){
        const src=m?.getSource?.(id),data=src&&(src._data||src._options&&src._options.data);
        if(data&&Array.isArray(data.features))data.features.forEach(addFeature);
      }
    }catch(_){}
    return out;
  }
  """
s=s[:i]+new_owner+s[j:]

# Aquifer presentation: soft professional fill + clear label.
i=s.index('const aquiferSvg=')
j=s.index('const towns=',i)
new_aq="""const aquiferSvg=aquiferFeatures.map((f,k)=>{const g=f&&f.geometry;if(!g)return '';const polys=g.type==='Polygon'?[g.coordinates]:(g.type==='MultiPolygon'?g.coordinates:[]);return polys.map(poly=>{if(!Array.isArray(poly)||!poly.length)return '';const rings=poly.filter(r=>Array.isArray(r)&&r.length>=3);if(!rings.length)return '';const dpath=rings.map(r=>pathCoords(r)+' Z').join(' '),outer=rings[0],cx=outer.reduce((a,p)=>a+Number(p[0]||0),0)/outer.length,cy=outer.reduce((a,p)=>a+Number(p[1]||0),0)/outer.length,visible=inside([cx,cy]);return '<path d="'+dpath+'" fill="rgba(69,151,207,.17)" fill-rule="evenodd" stroke="#3f83ad" stroke-width="'+(small?1.2:1.45)+'" vector-effect="non-scaling-stroke" opacity=".96"><title>'+esc(f.properties?.name||'Mapped aquifer context')+' — context only</title></path>'+(visible?'<g class="el-report-aquifer-label"><rect x="'+(sx(cx)-44).toFixed(1)+'" y="'+(sy(cy)-9).toFixed(1)+'" width="88" height="15" rx="4" fill="#f7fbfd" fill-opacity=".94" stroke="#8eb8d2" stroke-width=".55"/><text x="'+sx(cx).toFixed(1)+'" y="'+(sy(cy)+1.5).toFixed(1)+'" text-anchor="middle" fill="#215f86" font-size="'+(small?6.7:7.4)+'" font-weight="800">AQUIFER CONTEXT</text></g>':'')}).join('')}).join('');     """
s=s[:i]+new_aq+s[j:]

# Reduce the "can of worms" effect without changing any geometry.
s=s.replace('stroke="#74847e" stroke-width=".58" opacity=".43"','stroke="#7b8a84" stroke-width=".34" opacity=".19"',1)
s=s.replace('stroke="#f8fdff" stroke-width="3.4" opacity=".84"','stroke="#ffffff" stroke-width="1.65" opacity=".46"',1)
s=s.replace('stroke="#087fb8" stroke-width="1.75" opacity=".98"','stroke="#2188b2" stroke-width=".88" opacity=".72"',1)

a=s.index('const rows=graded();for(const r of rows)')
b=s.index('if(isVermont)for(const [name,x,y] of towns)',a)
new_swales="""const rows=graded();for(const r of rows){const color=r.grade==='A'?'#177c58':r.grade==='B'?'#ad842e':'#aa6846',mainW=r.grade==='A'?2.2:r.grade==='B'?1.7:1.25,haloW=mainW+1.15,alpha=r.grade==='A'?'.9':r.grade==='B'?'.77':'.48',dpath=smoothPath(r.f);parts.push('<path d="'+dpath+'" fill="none" stroke="#fffdf8" stroke-width="'+haloW+'" stroke-linecap="round" stroke-linejoin="round" opacity=".74"/><path d="'+dpath+'" fill="none" stroke="'+color+'" stroke-width="'+mainW+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+alpha+'"/>')}     """
s=s[:a]+new_swales+s[b:]

# Add a restrained map key only on the one technical map.
anchor="parts.push(`<g transform=\"translate(${W-54},38)\">"
idx=s.index(anchor)
legend="""if(aquiferFeatures.length||flows().length||rows.length)parts.push('<g transform="translate('+(W-224)+','+(H-111)+')"><rect width="202" height="47" rx="6" fill="#fbfcf8" fill-opacity=".94" stroke="#b7c5be" stroke-width=".7"/><rect x="10" y="9" width="17" height="7" rx="2" fill="rgba(69,151,207,.17)" stroke="#3f83ad"/><text x="33" y="15" fill="#405760" font-size="7.2">Aquifer context</text><path d="M10 27 H27" stroke="#2188b2" stroke-width="1.2"/><text x="33" y="30" fill="#405760" font-size="7.2">Water path</text><path d="M104 12 H121" stroke="#177c58" stroke-width="2.2"/><text x="127" y="15" fill="#405760" font-size="7.2">Bioswale</text><path d="M104 27 H121" stroke="#7b8a84" stroke-width=".5"/><text x="127" y="30" fill="#405760" font-size="7.2">Contour</text></g>');     """
s=s[:idx]+legend+s[idx:]

p.write_text(s)
