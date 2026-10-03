from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(errors='ignore')

old="""try{const m=map(),ids=Object.keys(m?.getStyle?.().sources||{}).filter(id=>/aquifer/i.test(id));for(const id of ids){const src=m?.getSource?.(id),data=src&&src._data;if(data&&Array.isArray(data.features))data.features.forEach(addFeature)}}catch(_){}"""
new="""try{
      const m=map(),ids=Object.keys(m?.getStyle?.().sources||{}).filter(id=>/aquifer/i.test(id));
      for(const id of ids){
        const src=m?.getSource?.(id);
        const candidates=[];
        const direct=src&&src._data;
        if(direct&&Array.isArray(direct.features))candidates.push(...direct.features);
        try{const ser=src?.serialize?.(),data=ser&&ser.data;if(data&&Array.isArray(data.features))candidates.push(...data.features)}catch(_){}
        try{const q=m?.querySourceFeatures?.(id)||[];if(Array.isArray(q))candidates.push(...q)}catch(_){}
        for(const f of candidates){
          if(f&&f.type==='Feature')addFeature({type:'Feature',properties:Object.assign({},f.properties||{}),geometry:f.geometry});
        }
      }
    }catch(_){}"""
if old not in s: raise SystemExit('report aquifer fallback owner not found')
s=s.replace(old,new,1)

# Stronger but still restrained landscape-architecture aquifer treatment.
s=s.replace('fill="rgba(35,126,196,.22)" fill-rule="evenodd" stroke="#236fa8" stroke-width="'+(small?1.8:2.15)+'" stroke-dasharray="7 3" vector-effect="non-scaling-stroke" opacity=".98"',
            'fill="rgba(38,126,190,.28)" fill-rule="evenodd" stroke="#1f6f9f" stroke-width="'+(small?2.0:2.4)+'" stroke-dasharray="8 3" vector-effect="non-scaling-stroke" opacity=".98"',1)

# Add an aquifer label to each mapped polygon using its first ring centroid-ish midpoint.
needle="""return '<path d="'+dpath+'" fill="rgba(38,126,190,.28)" fill-rule="evenodd" stroke="#1f6f9f" stroke-width="'+(small?2.0:2.4)+'" stroke-dasharray="8 3" vector-effect="non-scaling-stroke" opacity=".98"><title>'+esc(f.properties?.name||'Mapped aquifer context')+' — context only</title></path>'"""
repl="""const ring=rings[0],mid=ring[Math.floor((ring.length-1)/2)]||ring[0],label=(mid&&Number.isFinite(+mid[0])&&Number.isFinite(+mid[1]))?'<g class="el-report-aquifer-label"><rect x="'+(sx(+mid[0])-42).toFixed(1)+'" y="'+(sy(+mid[1])-10).toFixed(1)+'" width="84" height="17" rx="8.5" fill="#f7fbfd" fill-opacity=".93" stroke="#7daac2" stroke-width=".7"/><text x="'+sx(+mid[0]).toFixed(1)+'" y="'+(sy(+mid[1])+2).toFixed(1)+'" text-anchor="middle" fill="#165f86" font-size="7.5" font-weight="800">AQUIFER CONTEXT</text></g>':'';return '<path d="'+dpath+'" fill="rgba(38,126,190,.28)" fill-rule="evenodd" stroke="#1f6f9f" stroke-width="'+(small?2.0:2.4)+'" stroke-dasharray="8 3" vector-effect="non-scaling-stroke" opacity=".98"><title>'+esc(f.properties?.name||'Mapped aquifer context')+' — context only</title></path>'+label"""
if needle not in s: raise SystemExit('aquifer renderer owner not found')
s=s.replace(needle,repl,1)

# Restore a more refined, inspiring landscape-plan palette without changing geometry.
s=s.replace('<stop offset="0" stop-color="#f7f5ed"/><stop offset="1" stop-color="#e2ebe3"/>',
            '<stop offset="0" stop-color="#f7f4e9"/><stop offset=".52" stop-color="#edf2e8"/><stop offset="1" stop-color="#dde9e2"/>',1)
s=s.replace('stroke="#74847e" stroke-width=".58" opacity=".43"',
            'stroke="#6f8179" stroke-width=".62" opacity=".46"',1)
s=s.replace('stroke="#087fb8" stroke-width="1.75" opacity=".98"',
            'stroke="#087fb8" stroke-width="1.9" opacity=".98"',1)

p.write_text(s)
