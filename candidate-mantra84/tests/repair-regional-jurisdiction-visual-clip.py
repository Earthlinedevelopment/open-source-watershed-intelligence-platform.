from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

old_points="function points(coords){const out=[];for(const ll of coords||[]){const p=project(ll);if(p){const q=out[out.length-1];if(!q||Math.hypot(q.x-p.x,q.y-p.y)>.35)out.push(p);}}return out;}"
new_points="function points(coords){const out=[];for(const ll of coords||[]){const p=project(ll);if(p){const q=out[out.length-1];if(!q||Math.hypot(q.x-p.x,q.y-p.y)>.35)out.push(p);}}return out;}\n  function jurisdictionClipD16020(){try{const pkg=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null,g=pkg&&pkg.boundary&&pkg.boundary.geometry;if(!g)return '';const polys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];let d='';for(const rings of polys)for(const ring of (rings||[])){const pts=points(ring);if(pts.length<3)continue;d+='M '+pts[0].x.toFixed(1)+' '+pts[0].y.toFixed(1);for(let i=1;i<pts.length;i++)d+=' L '+pts[i].x.toFixed(1)+' '+pts[i].y.toFixed(1);d+=' Z ';}return d.trim();}catch(_){return '';}}"
if s.count(old_points)!=1:
    raise SystemExit(f'expected one points helper, found {s.count(old_points)}')
s=s.replace(old_points,new_points,1)

old_defs="const defs=svgEl('defs');const glow=svgEl('filter',{id:'elGlow16020',x:'-30%',y:'-30%',width:'160%',height:'160%'});glow.appendChild(svgEl('feGaussianBlur',{stdDeviation:'1.6',result:'b'}));const merge=svgEl('feMerge');merge.appendChild(svgEl('feMergeNode',{in:'b'}));merge.appendChild(svgEl('feMergeNode',{in:'SourceGraphic'}));glow.appendChild(merge);defs.appendChild(glow);el.appendChild(defs);\n    const cg=svgEl('g',{'data-layer':'numbered-elevation-contours'}),sg=svgEl('g',{'data-layer':'swale-opportunities'}),lg=svgEl('g',{'data-layer':'always-visible-labels'});el.append(cg,sg,lg);"
new_defs="const defs=svgEl('defs');const glow=svgEl('filter',{id:'elGlow16020',x:'-30%',y:'-30%',width:'160%',height:'160%'});glow.appendChild(svgEl('feGaussianBlur',{stdDeviation:'1.6',result:'b'}));const merge=svgEl('feMerge');merge.appendChild(svgEl('feMergeNode',{in:'b'}));merge.appendChild(svgEl('feMergeNode',{in:'SourceGraphic'}));glow.appendChild(merge);defs.appendChild(glow);const jurisdictionClipD=jurisdictionClipD16020(),jurisdictionClipId='earthlineJurisdictionClip16020';if(jurisdictionClipD){const cp=svgEl('clipPath',{id:jurisdictionClipId,clipPathUnits:'userSpaceOnUse'});cp.appendChild(svgEl('path',{d:jurisdictionClipD,'fill-rule':'evenodd','clip-rule':'evenodd'}));defs.appendChild(cp);}el.appendChild(defs);\n    const clipAttrs=jurisdictionClipD?{'clip-path':'url(#'+jurisdictionClipId+')'}:{},cg=svgEl('g',Object.assign({'data-layer':'numbered-elevation-contours'},clipAttrs)),sg=svgEl('g',Object.assign({'data-layer':'swale-opportunities'},clipAttrs)),lg=svgEl('g',Object.assign({'data-layer':'always-visible-labels'},clipAttrs));el.append(cg,sg,lg);"
if s.count(old_defs)!=1:
    raise SystemExit(f'expected one renderer defs/group block, found {s.count(old_defs)}')
s=s.replace(old_defs,new_defs,1)

p.write_text(s,encoding='utf-8')
print('added authoritative jurisdiction clipPath to existing Regional SVG renderer')
