from pathlib import Path

p = Path("index.html")
s = p.read_text(encoding="utf-8")

old_ring_index = "const scale16722=4,bins16722=new Map();"
new_ring_index = "const scale16722=64,bins16722=new Map();"
assert old_ring_index in s, "ring index owner missing"
s = s.replace(old_ring_index, new_ring_index, 1)

target = "  function earthlineClipLine16539(coords,g){"
assert target in s, "clip owner missing"
s = s.replace(target, "  function earthlineClipLineOriginal17247(coords,g){", 1)
insert_at = s.index("  async function earthlineClipFeatureCollection16539")
helper = r'''
  const earthlineBoundaryEdgeGrid17247=new WeakMap();
  function earthlineBoundaryEdgeIndex17247(g){
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return null;
    let idx=earthlineBoundaryEdgeGrid17247.get(prepared);if(idx)return idx;
    const scale=32,cells=new Map();let edgeId=0;
    const addRing=ring=>{
      if(!Array.isArray(ring)||ring.length<2)return;
      for(let i=0,j=ring.length-1;i<ring.length;j=i++){
        const a=ring[j],b=ring[i];if(!earthlineFinitePoint16539(a)||!earthlineFinitePoint16539(b))continue;
        const minX=Math.min(Number(a[0]),Number(b[0])),maxX=Math.max(Number(a[0]),Number(b[0])),minY=Math.min(Number(a[1]),Number(b[1])),maxY=Math.max(Number(a[1]),Number(b[1]));
        const edge={id:edgeId++,minX,maxX,minY,maxY};
        const x0=Math.floor(minX*scale),x1=Math.floor(maxX*scale),y0=Math.floor(minY*scale),y1=Math.floor(maxY*scale);
        for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=x+','+y;let list=cells.get(k);if(!list)cells.set(k,list=[]);list.push(edge);}
      }
    };
    for(const poly of prepared.polygons||[]){addRing(poly.outer);for(const h of poly.holes||[])addRing(h.ring);}
    idx={scale,cells};earthlineBoundaryEdgeGrid17247.set(prepared,idx);return idx;
  }
  function earthlineLineMayTouchBoundary17247(raw,g){
    const idx=earthlineBoundaryEdgeIndex17247(g);if(!idx)return true;
    for(let i=1;i<raw.length;i++){
      const a=raw[i-1],b=raw[i],minX=Math.min(Number(a[0]),Number(b[0])),maxX=Math.max(Number(a[0]),Number(b[0])),minY=Math.min(Number(a[1]),Number(b[1])),maxY=Math.max(Number(a[1]),Number(b[1]));
      const x0=Math.floor(minX*idx.scale),x1=Math.floor(maxX*idx.scale),y0=Math.floor(minY*idx.scale),y1=Math.floor(maxY*idx.scale),seen=new Set();
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)for(const edge of (idx.cells.get(x+','+y)||[])){
        if(seen.has(edge.id))continue;seen.add(edge.id);
        if(edge.maxX>=minX&&edge.minX<=maxX&&edge.maxY>=minY&&edge.minY<=maxY)return true;
      }
    }
    return false;
  }
  function earthlineClipLine16539(coords,g){
    const raw=(coords||[]).filter(earthlineFinitePoint16539);if(raw.length<2)return [];
    if(earthlineLineMayTouchBoundary17247(raw,g))return earthlineClipLineOriginal17247(coords,g);
    const pts=[raw[0]];for(let i=1;i<raw.length;i++){const a=raw[i-1],b=raw[i],steps=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b[0])-Number(a[0])),Math.abs(Number(b[1])-Number(a[1])))/.01));for(let k=1;k<=steps;k++)pts.push(earthlineInterpolate16539(a,b,k/steps));}
    return earthlinePointInJurisdiction16539(raw[0],g)?[pts]:[];
  }
'''
s = s[:insert_at] + helper + s[insert_at:]
p.write_text(s, encoding="utf-8")
print("EARTHLINE 17247 exact clip + high-resolution ring index applied")
