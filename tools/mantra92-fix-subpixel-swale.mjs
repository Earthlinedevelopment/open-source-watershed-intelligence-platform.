import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const original=readFileSync('index.html','utf8');
const needle="const activeTier=activeTier16168(),rawCoords=f.geometry.coordinates,renderCoords=activeTier==='focus'?rawCoords:earthlineRegionalLocalDisplay16020(rawCoords),pts=points(renderCoords),len=polyLength(pts);";
if(original.split(needle).length!==2)throw Error('Regional renderer source owner unexpected');
const replacement=String.raw`
const activeTier=activeTier16168(),rawCoords=f.geometry.coordinates,
  renderCoords=activeTier==='focus'?rawCoords:earthlineRegionalLocalDisplay16020(rawCoords),
  pts=points(renderCoords);
/* M92: Mapbox source geometry with two valid positions can collapse to one
   rounded SVG point in a statewide overview. Recover the exact fractional
   Mapbox projection rather than silently omitting a scientifically valid
   corridor. This affects presentation only; source coordinates are unchanged. */
if(activeTier==='regional'&&pts.length===1&&Array.isArray(renderCoords)&&renderCoords.length===2){
  try{
    const a=map.project(renderCoords[0]),b=map.project(renderCoords[1]);
    const valid=[a.x,a.y,b.x,b.y].every(Number.isFinite);
    const within=[a,b].every(p=>p.x>=0&&p.x<=w&&p.y>=0&&p.y<=hh);
    if(valid&&within&&Math.hypot(b.x-a.x,b.y-a.y)>=0.1){
      const tuple=Array.isArray(pts[0]);
      pts.splice(0,pts.length,tuple?[a.x,a.y]:{x:a.x,y:a.y},
        tuple?[b.x,b.y]:{x:b.x,y:b.y});
    }
  }catch(_){}
}
const len=polyLength(pts);
`;
const out=original.replace(needle,replacement);
if(!out.includes("if(activeTier==='focus'?(pts.length<3||len<22):(pts.length<2||len<0.1))continue;")||
   !out.includes("metricLengthM92>=250&&metricLengthM92<=4005")||
   !out.includes('(++yieldCount16661%1536)===0'))throw Error('Unapproved regression in product owner');
writeFileSync('index.html',out);
const sha=s=>createHash('sha256').update(s).digest('hex');
console.log('M92_SVG_REPAIR '+JSON.stringify({before:sha(original),after:sha(out),
  scope:'fractional SVG presentation recovery only',hydrologyChanged:false}));
