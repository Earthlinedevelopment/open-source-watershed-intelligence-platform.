from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
marker = 'EARTHLINE 16634 — EXACT REGIONAL HOT-PATH OPTIMIZATION.'
if marker in s:
    print('16634 already installed')
    raise SystemExit(0)


def replace_once(old, new, label):
    global s
    n = s.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {n}')
    s = s.replace(old, new, 1)

# 1) Administrative-boundary containment: prepare numeric edges once and reuse them.
old_prepare = '''  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];for(const rings of rawPolys){if(!Array.isArray(rings)||!rings.length)continue;const outer=rings[0],bbox=earthlineRingBounds16539(outer);if(!bbox)continue;const holes=[];for(let i=1;i<rings.length;i++){const hb=earthlineRingBounds16539(rings[i]);if(hb)holes.push({ring:rings[i],bbox:hb});}polygons.push({outer,bbox,holes});}
    return {prepared16539:true,polygons};
  }'''
new_prepare = '''  /* EARTHLINE 16634 — EXACT REGIONAL HOT-PATH OPTIMIZATION.
     Administrative rings are immutable during a run. Convert their valid edge
     coordinates once, then reuse the identical 16539 boundary and ray-cast verdicts.
     No containment rule or tolerance changes. */
  function earthlinePreparedRing16539(ring){
    if(!Array.isArray(ring)||ring.length<3)return null;
    const edges=[];
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const a=ring[j],b=ring[i];if(!earthlineFinitePoint16539(a)||!earthlineFinitePoint16539(b))continue;
      edges.push([Number(a[0]),Number(a[1]),Number(b[0]),Number(b[1])]);
    }
    return edges.length?{edges}:null;
  }
  function earthlinePointInPreparedRing16539(p,prepared){
    if(!earthlineFinitePoint16539(p)||!prepared||!Array.isArray(prepared.edges))return false;
    const x=Number(p[0]),y=Number(p[1]);let inside=false;
    for(const e of prepared.edges){
      const x1=e[0],y1=e[1],x2=e[2],y2=e[3],dx=x2-x1,dy=y2-y1,len=dx*dx+dy*dy;
      if(len<1e-20){if(Math.hypot(x-x1,y-y1)<1e-10)return true;}
      else{
        const cross=(x-x1)*dy-(y-y1)*dx;
        if(Math.abs(cross)<=1e-10){const dot=(x-x1)*dx+(y-y1)*dy;if(dot>=0&&dot<=len)return true;}
      }
      if(((y2>y)!==(y1>y))&&(x<(x1-x2)*(y-y2)/((y1-y2)||1e-15)+x2))inside=!inside;
    }
    return inside;
  }
  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];
    for(const rings of rawPolys){
      if(!Array.isArray(rings)||!rings.length)continue;
      const outer=rings[0],bbox=earthlineRingBounds16539(outer),outerPrepared=earthlinePreparedRing16539(outer);
      if(!bbox||!outerPrepared)continue;
      const holes=[];
      for(let i=1;i<rings.length;i++){
        const hb=earthlineRingBounds16539(rings[i]),prepared=earthlinePreparedRing16539(rings[i]);
        if(hb&&prepared)holes.push({ring:rings[i],prepared,bbox:hb});
      }
      polygons.push({outer,outerPrepared,bbox,holes});
    }
    return {prepared16539:true,polygons};
  }'''
replace_once(old_prepare, new_prepare, 'prepare jurisdiction')

old_point = '''  function earthlinePointInJurisdiction16539(p,g){
    if(!g)return false;
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return false;
    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRing16539(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRing16539(p,h.ring)){inHole=true;break;}}if(!inHole)return true;}
    return false;
  }'''
new_point = '''  function earthlinePointInJurisdiction16539(p,g){
    if(!g)return false;
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return false;
    for(const poly of prepared.polygons||[]){
      if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInPreparedRing16539(p,poly.outerPrepared))continue;
      let inHole=false;
      for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInPreparedRing16539(p,h.prepared)){inHole=true;break;}}
      if(!inHole)return true;
    }
    return false;
  }'''
replace_once(old_point, new_point, 'point in jurisdiction')

# Fast fail for lines whose complete bbox cannot intersect any prepared polygon bbox.
old_clip_head = '''  function earthlineClipLine16539(coords,g){
    const raw=(coords||[]).filter(earthlineFinitePoint16539);if(raw.length<2)return [];
    const pts=[raw[0]];'''
new_clip_head = '''  function earthlineClipLine16539(coords,g){
    const raw=(coords||[]).filter(earthlineFinitePoint16539);if(raw.length<2)return [];
    const prepared16539=earthlinePrepareJurisdiction16539(g);
    let minX16539=Infinity,minY16539=Infinity,maxX16539=-Infinity,maxY16539=-Infinity;
    for(const p16539 of raw){const x16539=Number(p16539[0]),y16539=Number(p16539[1]);minX16539=Math.min(minX16539,x16539);minY16539=Math.min(minY16539,y16539);maxX16539=Math.max(maxX16539,x16539);maxY16539=Math.max(maxY16539,y16539);}
    const intersectsBBox16539=(prepared16539&&prepared16539.polygons||[]).some(poly16539=>!(maxX16539<poly16539.bbox[0]||minX16539>poly16539.bbox[2]||maxY16539<poly16539.bbox[1]||minY16539>poly16539.bbox[3]));
    if(!intersectsBBox16539)return [];
    const pts=[raw[0]];'''
replace_once(old_clip_head, new_clip_head, 'clip bbox proof')

# 2) Natural Earth ring predicate: cache numeric valid edges. Same ray-cast expression.
old_ring16584 = '''  function earthlinePointInRing16584(x16584,y16584,ring16584){
    if(!Array.isArray(ring16584)||ring16584.length<3)return false;
    let inside16584=false;
    for(let i16584=0,j16584=ring16584.length-1;i16584<ring16584.length;j16584=i16584++){
      const a16584=ring16584[i16584]||[],b16584=ring16584[j16584]||[];
      const xi16584=Number(a16584[0]),yi16584=Number(a16584[1]),
            xj16584=Number(b16584[0]),yj16584=Number(b16584[1]);
      if(![xi16584,yi16584,xj16584,yj16584].every(Number.isFinite))continue;
      if(((yi16584>y16584)!==(yj16584>y16584))&&
         (x16584<(xj16584-xi16584)*(y16584-yi16584)/((yj16584-yi16584)||1e-15)+xi16584))
        inside16584=!inside16584;
    }
    return inside16584;
  }'''
new_ring16584 = '''  const earthlineRingNumericCache16634=new WeakMap();
  function earthlinePointInRing16584(x16584,y16584,ring16584){
    if(!Array.isArray(ring16584)||ring16584.length<3)return false;
    let edges16584=earthlineRingNumericCache16634.get(ring16584);
    if(!edges16584){
      edges16584=[];
      for(let i16584=0,j16584=ring16584.length-1;i16584<ring16584.length;j16584=i16584++){
        const a16584=ring16584[i16584]||[],b16584=ring16584[j16584]||[],
              xi16584=Number(a16584[0]),yi16584=Number(a16584[1]),xj16584=Number(b16584[0]),yj16584=Number(b16584[1]);
        if(![xi16584,yi16584,xj16584,yj16584].every(Number.isFinite))continue;
        edges16584.push([xi16584,yi16584,xj16584,yj16584]);
      }
      earthlineRingNumericCache16634.set(ring16584,edges16584);
    }
    let inside16584=false;
    for(const e16584 of edges16584){
      const xi16584=e16584[0],yi16584=e16584[1],xj16584=e16584[2],yj16584=e16584[3];
      if(((yi16584>y16584)!==(yj16584>y16584))&&
         (x16584<(xj16584-xi16584)*(y16584-yi16584)/((yj16584-yi16584)||1e-15)+xi16584))inside16584=!inside16584;
    }
    return inside16584;
  }'''
replace_once(old_ring16584, new_ring16584, 'Natural Earth ring cache')

# 3) D8 flow edge ownership: one outgoing edge per grid cell means source index is exact edge identity.
old_flow_decl = "    const features=[],usedEdges=new Set();let lineCount=0;"
new_flow_decl = "    const features=[],usedEdges=new Uint8Array(N);let lineCount=0; /* 16634: D8 has exactly one outgoing edge per source cell. */"
replace_once(old_flow_decl, new_flow_decl, 'flow edge storage')
old_flow_edge = "        const j=hy.to[i];if(j<0||j===i)break;const edge=i+'>'+j;\n        if(usedEdges.has(edge)){raw.push(gridLL(hy,j%hy.w,(j/hy.w)|0));break;}\n        usedEdges.add(edge);i=j;"
new_flow_edge = "        const j=hy.to[i];if(j<0||j===i)break;\n        if(usedEdges[i]){raw.push(gridLL(hy,j%hy.w,(j/hy.w)|0));break;}\n        usedEdges[i]=1;i=j;"
replace_once(old_flow_edge, new_flow_edge, 'flow edge lookup')
replace_once("if(j<0||usedEdges.has(seed+'>'+j))continue;trace(seed);", "if(j<0||usedEdges[seed])continue;trace(seed);", 'flow extra lookup')

# 4) Exact contour cell-range prefilter. A cell can cross a level iff min < level <= max.
old_contour_head = '''  async function makeContours(hy){
    const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,20),levels=[];
    for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);
    const features=[],majorEvery=levels.length>20?4:3,labelEvery=2;let labelCount=0;
    function interp(a,b,l){const d=b-a;return Math.abs(d)<1e-9?.5:Math.max(0,Math.min(1,(l-a)/d));}
    for(let li=0;li<levels.length;li++){
      const level=levels[li],major=(li%majorEvery===0)?1:0,labelable=(li%labelEvery===0)?1:0,segments=[];
      for(let y=0;y<hy.h-1;y++)for(let x=0;x<hy.w-1;x++){
        if(hy.validityMask16584){
          const i016584=y*hy.w+x,i116584=i016584+1,i316584=(y+1)*hy.w+x,i216584=i316584+1;
          if(!hy.validityMask16584[i016584]||!hy.validityMask16584[i116584]||!hy.validityMask16584[i216584]||!hy.validityMask16584[i316584])continue;
        }
        const a=hy.elev[y*hy.w+x],bb=hy.elev[y*hy.w+x+1],c=hy.elev[(y+1)*hy.w+x+1],d=hy.elev[(y+1)*hy.w+x],pts=[];'''
new_contour_head = '''  async function makeContours(hy){
    const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,20),levels=[];
    for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);
    const features=[],majorEvery=levels.length>20?4:3,labelEvery=2;let labelCount=0;
    function interp(a,b,l){const d=b-a;return Math.abs(d)<1e-9?.5:Math.max(0,Math.min(1,(l-a)/d));}
    /* 16634: exact Marching-Squares range proof. Precompute the validity and
       finite min/max of each terrain cell once; levels outside that range cannot
       create any of the four original edge crossings and are skipped. */
    const cw16634=hy.w-1,ch16634=hy.h-1,cellCount16634=Math.max(0,cw16634*ch16634),
          cellMin16634=new Float64Array(cellCount16634),cellMax16634=new Float64Array(cellCount16634),
          cellState16634=new Uint8Array(cellCount16634);
    for(let y16634=0;y16634<ch16634;y16634++)for(let x16634=0;x16634<cw16634;x16634++){
      const ci16634=y16634*cw16634+x16634,i016634=y16634*hy.w+x16634,i116634=i016634+1,i316634=(y16634+1)*hy.w+x16634,i216634=i316634+1;
      if(hy.validityMask16584&&(!hy.validityMask16584[i016634]||!hy.validityMask16584[i116634]||!hy.validityMask16584[i216634]||!hy.validityMask16584[i316634]))continue;
      const a16634=hy.elev[i016634],b16634=hy.elev[i116634],c16634=hy.elev[i216634],d16634=hy.elev[i316634];
      cellState16634[ci16634]=1;
      if([a16634,b16634,c16634,d16634].every(Number.isFinite)){
        cellMin16634[ci16634]=Math.min(a16634,b16634,c16634,d16634);cellMax16634[ci16634]=Math.max(a16634,b16634,c16634,d16634);
      }else cellState16634[ci16634]=2; /* force original comparisons for any non-finite cell */
    }
    for(let li=0;li<levels.length;li++){
      const level=levels[li],major=(li%majorEvery===0)?1:0,labelable=(li%labelEvery===0)?1:0,segments=[];
      for(let y=0;y<hy.h-1;y++)for(let x=0;x<hy.w-1;x++){
        const ci16634=y*cw16634+x,state16634=cellState16634[ci16634];if(!state16634)continue;
        if(state16634===1&&!(cellMin16634[ci16634]<level&&cellMax16634[ci16634]>=level))continue;
        const a=hy.elev[y*hy.w+x],bb=hy.elev[y*hy.w+x+1],c=hy.elev[(y+1)*hy.w+x+1],d=hy.elev[(y+1)*hy.w+x],pts=[];'''
replace_once(old_contour_head, new_contour_head, 'contour range prefilter')

# 5) Mapped-water line intersection: retain raw geometry, add exact bbox rejection before edge scan.
replace_once("const before16609=Number(swales16609&&swales16609.features&&swales16609.features.length||0),polys16609=[],lines16609=[];", "const before16609=Number(swales16609&&swales16609.features&&swales16609.features.length||0),polys16609=[],lines16609=[],lineBBoxes16634=[];", 'water line bbox declaration')
old_bbox_line = "    const bbox16609=ring=>{let w=Infinity,s=Infinity,e=-Infinity,n=-Infinity;for(const p of ring||[]){if(!finite16609(p))continue;w=Math.min(w,+p[0]);s=Math.min(s,+p[1]);e=Math.max(e,+p[0]);n=Math.max(n,+p[1]);}return Number.isFinite(w)?[w,s,e,n]:null;};"
new_bbox_line = old_bbox_line + "\n    const addLine16634=c=>{if(!Array.isArray(c)||c.length<2)return;const bb16634=bbox16609(c);lines16609.push(c);lineBBoxes16634.push(bb16634);};"
replace_once(old_bbox_line, new_bbox_line, 'water addLine helper')
replace_once("for(const c of ls){if(Array.isArray(c)&&c.length>1)lines16609.push(c);}", "for(const c of ls)addLine16634(c);", 'water add geometry lines')
replace_once("for(const line16616 of deterministicRiverLines16616)if(Array.isArray(line16616)&&line16616.length>1)lines16609.push(line16616);", "for(const line16616 of deterministicRiverLines16616)addLine16634(line16616);", 'deterministic river lines')
old_line_scan = "      for(const line of lines16609)for(let i=1;i<line.length;i++)if(finite16609(line[i-1])&&finite16609(line[i])&&segInter16609(a,b,line[i-1],line[i]))return true;"
new_line_scan = "      for(let li16634=0;li16634<lines16609.length;li16634++){const line=lines16609[li16634],lbb16634=lineBBoxes16634[li16634];if(lbb16634&&(sb[2]<lbb16634[0]||sb[0]>lbb16634[2]||sb[3]<lbb16634[1]||sb[1]>lbb16634[3]))continue;for(let i=1;i<line.length;i++)if(finite16609(line[i-1])&&finite16609(line[i])&&segInter16609(a,b,line[i-1],line[i]))return true;}"
replace_once(old_line_scan, new_line_scan, 'water line bbox scan')

# Invariants: owners remain single and science constants remain unchanged.
if s.count('function makeFlows(hy){') != 1: raise SystemExit('makeFlows owner count changed')
if s.count('async function makeContours(hy){') != 1: raise SystemExit('makeContours owner count changed')
if s.count('function earthlinePointInJurisdiction16539(') != 1: raise SystemExit('jurisdiction owner count changed')
if s.count('async function earthlineMappedWaterSwaleGate16609(') != 1: raise SystemExit('mapped-water owner count changed')
for required in [
    'percentile(hy.acc,0.84)', 'lineCount>=230', 'lineCount<55', 'lineCount>=180',
    'niceInterval(range,20)', 'earthlineRegionalSegmentValid16584',
    'EARTHLINE 16633 — EXACT PREFIX-PRUNED SAMPLE WALK.', marker
]:
    if required not in s: raise SystemExit('required invariant missing: '+required)

p.write_text(s, encoding='utf-8')
print('16634 exact hot-path optimization written')
