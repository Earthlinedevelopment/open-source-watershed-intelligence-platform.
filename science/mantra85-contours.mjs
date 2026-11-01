// Earthline Mantra 85 — deterministic unsmoothed marching-squares contours.
// Ambiguous saddle cells are resolved locally; no full-contour fallback or renderer correction exists here.

export const CONTOUR_VERSION='m85-contours-1';
const EPS=1e-9;

function interp(a,b,level){const dz=b.z-a.z;if(Math.abs(dz)<EPS)return {x:(a.x+b.x)/2,y:(a.y+b.y)/2};const t=Math.max(0,Math.min(1,(level-a.z)/dz));return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
function key(p){return `${Math.round(p.x*1e8)},${Math.round(p.y*1e8)}`;}
function toLngLat(p,width,height,extent){const [w,s,e,n]=extent;return [w+(p.x/(width-1))*(e-w),n-(p.y/(height-1))*(n-s)];}

function cellSegments(z00,z10,z11,z01,x,y,level){
  const L=level+EPS;
  const b0=z00>=L?1:0,b1=z10>=L?1:0,b2=z11>=L?1:0,b3=z01>=L?1:0;
  const code=b0|(b1<<1)|(b2<<2)|(b3<<3);if(code===0||code===15)return [];
  const p0={x,y,z:z00},p1={x:x+1,y,z:z10},p2={x:x+1,y:y+1,z:z11},p3={x,y:y+1,z:z01};
  const edges=[()=>interp(p0,p1,level),()=>interp(p1,p2,level),()=>interp(p3,p2,level),()=>interp(p0,p3,level)];
  const crosses=[];const bits=[b0,b1,b3,b0],bits2=[b1,b2,b2,b3];for(let i=0;i<4;i++)if(bits[i]!==bits2[i])crosses.push(i);
  if(crosses.length===2)return [[edges[crosses[0]](),edges[crosses[1]]()]];
  if(crosses.length!==4)return [];
  const center=(z00+z10+z11+z01)/4;
  // Cases 5 and 10. The center-level comparison selects one of the two local pairings deterministically.
  if(center>=level)return [[edges[0](),edges[1]()],[edges[2](),edges[3]()]];
  return [[edges[0](),edges[3]()],[edges[1](),edges[2]()]];
}

function connectSegments(segments){
  const byKey=new Map();segments.forEach((s,i)=>s.forEach((p,end)=>{const k=key(p);if(!byKey.has(k))byKey.set(k,[]);byKey.get(k).push({i,end});}));
  const used=new Uint8Array(segments.length),lines=[];
  const trace=(startIndex,startEnd)=>{const line=[];let i=startIndex,end=startEnd;while(i>=0&&!used[i]){used[i]=1;const seg=segments[i],a=seg[end],b=seg[1-end];if(!line.length)line.push(a);line.push(b);const next=(byKey.get(key(b))||[]).filter(x=>!used[x.i]).sort((u,v)=>u.i-v.i||u.end-v.end)[0];if(!next)break;i=next.i;end=next.end;}return line;};
  const starts=[];for(const [k,refs] of byKey)if(refs.length===1)starts.push(refs[0]);starts.sort((a,b)=>a.i-b.i||a.end-b.end);
  for(const s of starts)if(!used[s.i]){const l=trace(s.i,s.end);if(l.length>1)lines.push(l);}
  for(let i=0;i<segments.length;i++)if(!used[i]){const l=trace(i,0);if(l.length>1)lines.push(l);}
  return lines;
}

export function generateContours({elevation,width,height,extent,intervalM,baseM=null,validMask=null}){
  if(!elevation||elevation.length!==width*height)throw new Error('contour DEM mismatch');
  if(!Number.isFinite(intervalM)||intervalM<=0)throw new Error('invalid contour interval');
  let min=Infinity,max=-Infinity;for(let i=0;i<elevation.length;i++){if(validMask&&!validMask[i])continue;const z=Number(elevation[i]);if(Number.isFinite(z)){min=Math.min(min,z);max=Math.max(max,z);}}
  if(!Number.isFinite(min)||!Number.isFinite(max)||min===max)return Object.freeze([]);
  const start=Number.isFinite(baseM)?Math.ceil((min-baseM)/intervalM)*intervalM+baseM:Math.ceil(min/intervalM)*intervalM;
  const out=[];let levelIndex=0;
  for(let level=start;level<=max+EPS;level+=intervalM,levelIndex++){
    const segs=[];
    for(let y=0;y<height-1;y++)for(let x=0;x<width-1;x++){
      const ids=[y*width+x,y*width+x+1,(y+1)*width+x+1,(y+1)*width+x];
      if(validMask&&ids.some(i=>!validMask[i]))continue;
      const zs=ids.map(i=>Number(elevation[i]));if(zs.some(z=>!Number.isFinite(z)))continue;
      segs.push(...cellSegments(zs[0],zs[1],zs[2],zs[3],x,y,level));
    }
    const lines=connectSegments(segs);
    lines.forEach((line,i)=>out.push(Object.freeze({id:`c${levelIndex}-${i}`,elevationM:level,coordinates:Object.freeze(line.map(p=>Object.freeze(toLngLat(p,width,height,extent))))})));
  }
  return Object.freeze(out);
}
