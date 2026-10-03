from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(errors='ignore')

# 1. BIOSWALE IMPACT REPORT — one map, exact geometry, stronger presentation.
s=s.replace('<div class="el49-cover-map">${mapSvg(d,true)}</div>','',1)

pat=re.compile(r"function reportAquifers\(\)\{\s*const v=visual\(\);[\s\S]*?\n\s*\}\n\s*function graded\(\)")
rep="""function reportAquifers(){
    const out=[],seen=new Set();
    const addFeature=f=>{const g=f&&f.geometry;if(!g||!['Polygon','MultiPolygon'].includes(g.type)||!Array.isArray(g.coordinates))return;let key='';try{key=JSON.stringify([g.type,g.coordinates])}catch(_){key=String(out.length)}if(seen.has(key))return;seen.add(key);out.push(f)};
    const v=visual();if(v&&v.aquifers&&Array.isArray(v.aquifers.features))v.aquifers.features.forEach(addFeature);
    const rows=(typeof M!=="undefined"&&Array.isArray(M.usgsAquifers))?M.usgsAquifers:[];
    rows.map((poly,i)=>({type:"Feature",properties:{name:String(poly&&poly.name||"Mapped aquifer context"),source:String(poly&&poly.source||poly&&poly.dataSource||"Mapped groundwater context"),report_context_only:true,index:i},geometry:{type:"Polygon",coordinates:[(poly&&Array.isArray(poly.lngLatPts)?poly.lngLatPts:[]).map(c=>[Number(c[0]),Number(c[1])]).filter(c=>Number.isFinite(c[0])&&Number.isFinite(c[1]))]}})).forEach(addFeature);
    try{const m=map(),ids=Object.keys(m?.getStyle?.().sources||{}).filter(id=>/aquifer/i.test(id));for(const id of ids){const src=m?.getSource?.(id),data=src&&src._data;if(data&&Array.isArray(data.features))data.features.forEach(addFeature)}}catch(_){}
    return out;
  }
  function graded()"""
s,n=pat.subn(rep,s,count=1)
if n!=1: raise SystemExit('reportAquifers owner not replaced')

pat2=re.compile(r"const aquiferSvg=aquiferFeatures\.map\(\(f,i\)=>\{[\s\S]*?\}\)\.join\(''\);")
rep2="""const aquiferSvg=aquiferFeatures.map((f,i)=>{const g=f&&f.geometry;if(!g)return '';const polys=g.type==='Polygon'?[g.coordinates]:(g.type==='MultiPolygon'?g.coordinates:[]);return polys.map(poly=>{if(!Array.isArray(poly)||!poly.length)return '';const rings=poly.filter(r=>Array.isArray(r)&&r.length>=3);if(!rings.length)return '';const dpath=rings.map(r=>pathCoords(r)+' Z').join(' ');return '<path d="'+dpath+'" fill="rgba(35,126,196,.22)" fill-rule="evenodd" stroke="#236fa8" stroke-width="'+(small?1.8:2.15)+'" stroke-dasharray="7 3" vector-effect="non-scaling-stroke" opacity=".98"><title>'+esc(f.properties?.name||'Mapped aquifer context')+' — context only</title></path>'}).join('')}).join('');"""
s,n=pat2.subn(rep2,s,count=1)
if n!=1: raise SystemExit('aquifer SVG owner not replaced')

s=s.replace('<stop offset="0" stop-color="#edf1ee"/><stop offset="1" stop-color="#d5e0da"/>','<stop offset="0" stop-color="#f7f5ed"/><stop offset="1" stop-color="#e2ebe3"/>',1)
s=s.replace('stroke="#738883" stroke-width=".52" opacity=".34"','stroke="#74847e" stroke-width=".58" opacity=".43"',1)
s=s.replace('stroke="#f4fbff" stroke-width="2.7" opacity=".62"','stroke="#f8fdff" stroke-width="3.4" opacity=".84"',1)
s=s.replace('stroke="#178fc4" stroke-width="1.35" opacity=".9"','stroke="#087fb8" stroke-width="1.75" opacity=".98"',1)
s=s.replace('stroke="#cbdad4" stroke-width=".65" opacity=".7"','stroke="#c6d1cb" stroke-width=".5" opacity=".16"',1)
anchor='<rect width="${W}" height="${H}" fill="url(#elmapbg)"/>${aquiferSvg}<text'
if anchor not in s: raise SystemExit('map frame anchor not found')
s=s.replace(anchor,'<rect width="${W}" height="${H}" fill="url(#elmapbg)"/><rect x="14" y="14" width="${W-28}" height="${H-28}" rx="5" fill="none" stroke="#9fb2aa" stroke-width=".9" opacity=".85"/>${aquiferSvg}<text',1)

# 2. HOW BIOSWALES WORK — pictures first, stronger publication typography/layout.
old='+canonicalBlock+preserved+sourceBlock+src.slice(mainClose)'
if old not in s: raise SystemExit('How Swales order owner not found')
s=s.replace(old,'+preserved+canonicalBlock+sourceBlock+src.slice(mainClose)',1)

css='html,body{font-family:"Noto Sans","Segoe UI",Arial,sans-serif!important;background:#f1f2ed!important;color:#243a42!important}main{padding:28px 20px 80px!important;background:#f1f2ed!important}.earthline-swale-examples,.earthline-swale-restored{max-width:1120px!important;margin:0 auto 34px!important;padding:30px 32px 34px!important;background:#fff!important;border:1px solid #c8d0cb!important;border-radius:16px!important;box-shadow:0 12px 34px rgba(28,48,55,.09)!important}.earthline-swale-examples .ehead h2,.earthline-swale-restored .ehead h2{font:700 clamp(30px,4vw,42px)/1.12 Fraunces,Georgia,serif!important;color:#17323d!important}.earthline-swale-examples .ehead p,.earthline-swale-restored .ehead p{font:400 17px/1.65 "Noto Sans","Segoe UI",Arial,sans-serif!important;color:#4a6168!important}.eswale-sequence{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:20px!important}.eswale-card{overflow:hidden!important;border:1px solid #c7d0cb!important;border-radius:13px!important;background:#fff!important;box-shadow:0 7px 20px rgba(24,47,55,.08)!important}.eswale-card img{display:block!important;width:100%!important;aspect-ratio:4/3!important;object-fit:cover!important}.eswale-cap{padding:17px 18px 20px!important}.eswale-cap b{font:700 18px/1.25 Fraunces,Georgia,serif!important;color:#17323d!important}.eswale-cap span{display:block!important;margin-top:6px!important;font:400 14.5px/1.55 "Noto Sans","Segoe UI",Arial,sans-serif!important;color:#52656d!important}.earthline-canonical-how-16923{max-width:1040px!important;margin:0 auto 30px!important;padding:48px 56px 54px!important;border:1px solid #c8d0cb!important;border-radius:16px!important;background:#fff!important;box-shadow:0 12px 34px rgba(28,48,55,.08)!important}.earthline-canonical-how-16923>.ehead{max-width:820px!important;margin:0 0 34px!important;padding-bottom:24px!important;border-bottom:2px solid #9eb8a9!important}.earthline-canonical-how-16923>.ehead h1{margin:0 0 12px!important;font:700 clamp(40px,5vw,58px)/1.04 Fraunces,Georgia,serif!important;color:#17323d!important}.earthline-canonical-how-16923>.ehead p{margin:0!important;font:500 18px/1.55 "Noto Sans","Segoe UI",Arial,sans-serif!important;color:#476068!important}.earthline-canonical-how-16923 h2{margin:38px 0 13px!important;font:700 28px/1.18 Fraunces,Georgia,serif!important;color:#17323d!important}.earthline-canonical-how-16923 h3{margin:28px 0 10px!important;font:700 21px/1.25 Fraunces,Georgia,serif!important;color:#23424b!important}.earthline-canonical-how-16923 p,.earthline-canonical-how-16923 li{font:400 17.5px/1.72 "Noto Sans","Segoe UI",Arial,sans-serif!important;color:#354a52!important}.earthline-canonical-how-16923 p{margin:0 0 17px!important}.earthline-canonical-how-16923 hr{margin:34px 0!important;border:0!important;border-top:1px solid #cbd5d0!important}.earthline-canonical-sources-16923{max-width:1040px!important;margin:0 auto 28px!important;padding:34px 42px!important;border:1px solid #c8d0cb!important;border-radius:14px!important;background:#fafbf8!important}.earthline-canonical-sources-16923 p{font:400 14.5px/1.6 "Noto Sans","Segoe UI",Arial,sans-serif!important;color:#4c6269!important}@media(max-width:900px){.eswale-sequence{grid-template-columns:1fr!important}.earthline-canonical-how-16923{padding:36px 28px 42px!important}.earthline-swale-examples,.earthline-swale-restored{padding:24px 22px 28px!important}}'
insert="src=src.replace('</head>','<style id=\"earthline-swales-layout-16934\">'+css+'</style></head>');"
mark='const howBioswalesApproved16388='
i=s.find(mark)
if i<0: raise SystemExit('How Swales style anchor not found')
s=s[:i]+insert+s[i:]
p.write_text(s)
