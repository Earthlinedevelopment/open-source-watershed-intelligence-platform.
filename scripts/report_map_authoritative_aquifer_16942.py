from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(errors='ignore')

pat=re.compile(r"function reportAquifers\(\)\{[\s\S]*?\n\s*\}\n\s*function graded\(\)")
new="""function reportAquifers(){
    const out=[],seen=new Set();
    const addFeature=f=>{
      const g=f&&f.geometry;
      if(!g||!['Polygon','MultiPolygon'].includes(g.type)||!Array.isArray(g.coordinates))return;
      let key='';try{key=JSON.stringify([g.type,g.coordinates])}catch(_){key=String(out.length)}
      if(seen.has(key))return;seen.add(key);
      out.push({type:'Feature',properties:Object.assign({},f.properties||{}),geometry:g});
    };
    const v=visual();
    if(v&&v.aquifers&&Array.isArray(v.aquifers.features))v.aquifers.features.forEach(addFeature);
    const rows=(typeof M!=="undefined"&&Array.isArray(M.usgsAquifers))?M.usgsAquifers:[];
    rows.map((poly,i)=>({type:"Feature",properties:{name:String(poly&&poly.name||"Mapped aquifer context"),source:String(poly&&poly.source||poly&&poly.dataSource||"Mapped groundwater context"),report_context_only:true,index:i},geometry:{type:"Polygon",coordinates:[(poly&&Array.isArray(poly.lngLatPts)?poly.lngLatPts:[]).map(c=>[Number(c[0]),Number(c[1])]).filter(c=>Number.isFinite(c[0])&&Number.isFinite(c[1]))]}})).forEach(addFeature);
    try{
      const m=map(),style=m?.getStyle?.()||{},layers=(style.layers||[]).filter(l=>/aquifer/i.test(String(l?.id||'')+' '+String(l?.source||'')+' '+String(l&&l['source-layer']||'')));
      const layerIds=layers.map(l=>l.id).filter(Boolean);
      if(layerIds.length&&m?.queryRenderedFeatures){
        try{(m.queryRenderedFeatures({layers:layerIds})||[]).forEach(addFeature)}catch(_){}
      }
      for(const l of layers){
        if(!l?.source||!m?.querySourceFeatures)continue;
        const opts=l['source-layer']?{sourceLayer:l['source-layer']}:{};
        try{(m.querySourceFeatures(l.source,opts)||[]).forEach(addFeature)}catch(_){}
      }
      for(const id of Object.keys(style.sources||{}).filter(id=>/aquifer/i.test(id))){
        const src=m?.getSource?.(id),data=src&&src._data;
        if(data&&Array.isArray(data.features))data.features.forEach(addFeature);
      }
    }catch(_){}
    return out;
  }
  function graded()"""
s,n=pat.subn(new,s,count=1)
if n!=1:
    raise SystemExit('reportAquifers owner not replaced')

s=s.replace("const b=reportBounds(d),W=760,H=small?360:440,pad=30;","const b=reportBounds(d),W=820,H=small?360:500,pad=34;",1)

pat2=re.compile(r"const aquiferSvg=aquiferFeatures\.map\(\(f,i\)=>\{[\s\S]*?\}\)\.join\(''\);")
new2="""const aquiferSvg=aquiferFeatures.map((f,i)=>{
      const g=f&&f.geometry;if(!g)return '';
      const polys=g.type==='Polygon'?[g.coordinates]:(g.type==='MultiPolygon'?g.coordinates:[]);
      let label='';
      const shapes=polys.map(poly=>{
        if(!Array.isArray(poly)||!poly.length)return '';
        const rings=poly.filter(r=>Array.isArray(r)&&r.length>=3);
        if(!rings.length)return '';
        const dpath=rings.map(r=>pathCoords(r)+' Z').join(' ');
        if(!label){
          const ring=rings[0],xs=ring.map(q=>Number(q&&q[0])).filter(Number.isFinite),ys=ring.map(q=>Number(q&&q[1])).filter(Number.isFinite);
          if(xs.length&&ys.length){
            const lng=Math.max(b[0],Math.min(b[2],(Math.min(...xs)+Math.max(...xs))/2));
            const lat=Math.max(b[1],Math.min(b[3],(Math.min(...ys)+Math.max(...ys))/2));
            const name=String(f.properties?.name||f.properties?.Name||f.properties?.AQUIFER||'AQUIFER CONTEXT').replace(/^AQUIFER\\s*[·:-]?\\s*/i,'').trim();
            label='<g class="el-report-aquifer-label"><rect x="'+(sx(lng)-56).toFixed(1)+'" y="'+(sy(lat)-12).toFixed(1)+'" width="112" height="21" rx="4" fill="rgba(250,253,255,.94)" stroke="#1d6faa" stroke-width=".9"/><text x="'+sx(lng).toFixed(1)+'" y="'+(sy(lat)+3).toFixed(1)+'" text-anchor="middle" fill="#155f91" font-size="8.7" font-weight="850">AQUIFER · '+esc(name).slice(0,32)+'</text></g>';
          }
        }
        return '<path d="'+dpath+'" fill="rgba(43,132,199,.25)" fill-rule="evenodd" stroke="#1d6faa" stroke-width="'+(small?1.9:2.35)+'" stroke-dasharray="7 3" vector-effect="non-scaling-stroke" opacity=".99"><title>'+esc(f.properties?.name||'Mapped aquifer context')+' — context only</title></path>';
      }).join('');
      return shapes+label;
    }).join('');"""
s,n=pat2.subn(new2,s,count=1)
if n!=1:
    raise SystemExit('aquifer SVG owner not replaced')

# Make the technical hierarchy visibly different without changing a coordinate.
for a,b in [
 ('<stop offset="0" stop-color="#f7f5ed"/><stop offset="1" stop-color="#e2ebe3"/>','<stop offset="0" stop-color="#f7f4ea"/><stop offset="1" stop-color="#e7ece4"/>'),
 ('stroke="#74847e" stroke-width=".58" opacity=".43"','stroke="#7d8982" stroke-width=".55" opacity=".32"'),
 ('stroke="#087fb8" stroke-width="1.75" opacity=".98"','stroke="#087bb4" stroke-width="1.95" opacity=".99"'),
 ('stroke="#c6d1cb" stroke-width=".5" opacity=".16"','stroke="#c6d1cb" stroke-width=".4" opacity=".08"')
]:
    s=s.replace(a,b,1)

p.write_text(s)
