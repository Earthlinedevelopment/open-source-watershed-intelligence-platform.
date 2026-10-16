from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name, old, new):
    global s
    n=s.count(old)
    print(name, n)
    if n!=1:
        raise SystemExit(f"{name}: expected exactly one anchor, found {n}")
    s=s.replace(old,new,1)

patch("memoize prepared jurisdiction",
"""  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];for(const rings of rawPolys){if(!Array.isArray(rings)||!rings.length)continue;const outer=rings[0],bbox=earthlineRingBounds16539(outer);if(!bbox)continue;const holes=[];for(let i=1;i<rings.length;i++){const hb=earthlineRingBounds16539(rings[i]);if(hb)holes.push({ring:rings[i],bbox:hb});}polygons.push({outer,bbox,holes});}
    return {prepared16539:true,polygons};
  }""",
"""  const earthlinePreparedJurisdictionCache17270=new WeakMap();
  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    const cacheable17270=(typeof g==='object'&&g!==null);
    if(cacheable17270){const cached17270=earthlinePreparedJurisdictionCache17270.get(g);if(cached17270)return cached17270;}
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];for(const rings of rawPolys){if(!Array.isArray(rings)||!rings.length)continue;const outer=rings[0],bbox=earthlineRingBounds16539(outer);if(!bbox)continue;const holes=[];for(let i=1;i<rings.length;i++){const hb=earthlineRingBounds16539(rings[i]);if(hb)holes.push({ring:rings[i],bbox:hb});}polygons.push({outer,bbox,holes});}
    const prepared17270={prepared16539:true,polygons};
    if(cacheable17270)earthlinePreparedJurisdictionCache17270.set(g,prepared17270);
    return prepared17270;
  }""")

point_fn="""  function earthlinePointInJurisdiction16539(p,g){
    if(!g)return false;
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return false;
    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRingIndexed16722(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRingIndexed16722(p,h.ring)){inHole=true;break;}}if(!inHole)return true;}
    return false;
  }"""

helpers=point_fn+"""
  /* EARTHLINE 17270 — exact interior/exterior certification for candidate screening.
     A candidate can bypass the expensive exact clip only when its entire bbox contains
     no jurisdiction boundary edge. One exact point test then proves the connected
     candidate bbox is wholly inside or wholly outside. Boundary-adjacent candidates
     still use the frozen exact clip owner. */
  const earthlineBoundaryEdgeIndexCache17270=new WeakMap();
  function earthlineBoundaryEdgeIndex17270(g17270){
    if(!g17270||typeof g17270!=='object')return null;
    const cached17270=earthlineBoundaryEdgeIndexCache17270.get(g17270);if(cached17270)return cached17270;
    const prepared17270=earthlinePrepareJurisdiction16539(g17270);if(!prepared17270)return null;
    const scale17270=16,bins17270=new Map();let ambiguous17270=false,edgeCount17270=0;
    const addRing17270=ring17270=>{
      if(!Array.isArray(ring17270)||ring17270.length<2)return;
      for(let i17270=0,j17270=ring17270.length-1;i17270<ring17270.length;j17270=i17270++){
        const a17270=ring17270[j17270],b17270=ring17270[i17270];
        if(!earthlineFinitePoint16539(a17270)||!earthlineFinitePoint16539(b17270))continue;
        const x117270=Number(a17270[0]),y117270=Number(a17270[1]),x217270=Number(b17270[0]),y217270=Number(b17270[1]);
        if(Math.abs(x217270-x117270)>180){ambiguous17270=true;continue;}
        const edge17270={minX:Math.min(x117270,x217270),maxX:Math.max(x117270,x217270),minY:Math.min(y117270,y217270),maxY:Math.max(y117270,y217270)};
        const lo17270=Math.floor(edge17270.minY*scale17270),hi17270=Math.floor(edge17270.maxY*scale17270);
        if(hi17270-lo17270>512){ambiguous17270=true;continue;}
        for(let k17270=lo17270;k17270<=hi17270;k17270++){let list17270=bins17270.get(k17270);if(!list17270)bins17270.set(k17270,list17270=[]);list17270.push(edge17270);}
        edgeCount17270++;
      }
    };
    for(const poly17270 of (prepared17270.polygons||[])){addRing17270(poly17270.outer);for(const h17270 of (poly17270.holes||[]))addRing17270(h17270.ring);}
    const out17270={prepared:prepared17270,scale:scale17270,bins:bins17270,ambiguous:ambiguous17270,edges:edgeCount17270};
    earthlineBoundaryEdgeIndexCache17270.set(g17270,out17270);return out17270;
  }
  function earthlineCandidateBBox17270(coords17270){
    let w17270=Infinity,s17270=Infinity,e17270=-Infinity,n17270=-Infinity;
    for(const p17270 of (coords17270||[])){if(!earthlineFinitePoint16539(p17270))continue;const x17270=Number(p17270[0]),y17270=Number(p17270[1]);if(x17270<w17270)w17270=x17270;if(x17270>e17270)e17270=x17270;if(y17270<s17270)s17270=y17270;if(y17270>n17270)n17270=y17270;}
    return Number.isFinite(w17270)?[w17270,s17270,e17270,n17270]:null;
  }
  function earthlineBoundaryTouchesBBox17270(index17270,bbox17270){
    if(!index17270||index17270.ambiguous||!bbox17270||bbox17270[2]-bbox17270[0]>180)return true;
    const eps17270=1e-12,lo17270=Math.floor((bbox17270[1]-eps17270)*index17270.scale),hi17270=Math.floor((bbox17270[3]+eps17270)*index17270.scale);
    for(let k17270=lo17270;k17270<=hi17270;k17270++)for(const edge17270 of (index17270.bins.get(k17270)||[])){
      if(edge17270.maxX+eps17270>=bbox17270[0]&&edge17270.minX-eps17270<=bbox17270[2]&&edge17270.maxY+eps17270>=bbox17270[1]&&edge17270.minY-eps17270<=bbox17270[3])return true;
    }
    return false;
  }
  function earthlineCandidateJurisdictionClass17270(candidate17270,g17270){
    const coords17270=candidate17270&&candidate17270.segment;
    if(!Array.isArray(coords17270)||coords17270.length<2)return 0;
    const index17270=earthlineBoundaryEdgeIndex17270(g17270),bbox17270=earthlineCandidateBBox17270(coords17270);
    if(!index17270||!bbox17270||earthlineBoundaryTouchesBBox17270(index17270,bbox17270))return 0;
    return earthlinePointInJurisdiction16539(coords17270[0],index17270.prepared)?1:-1;
  }
  function earthlineDensifyCandidate17270(coords17270){
    const raw17270=(coords17270||[]).filter(earthlineFinitePoint16539);if(raw17270.length<2)return [];
    const pts17270=[raw17270[0]];
    for(let i17270=1;i17270<raw17270.length;i17270++){const a17270=raw17270[i17270-1],b17270=raw17270[i17270],steps17270=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b17270[0])-Number(a17270[0])),Math.abs(Number(b17270[1])-Number(a17270[1])))/.01));for(let k17270=1;k17270<=steps17270;k17270++)pts17270.push(earthlineInterpolate16539(a17270,b17270,k17270/steps17270));}
    return pts17270;
  }"""
patch("install exact candidate bbox fast screen helpers",point_fn,helpers)

old_prefix="""      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);
      const runs16539=(jurisdictionGeometry16539&&jurisdictionGeometry16539.earthlineVermontExactClip16750===true&&typeof window.earthlineClipVermontLine16178==='function')
        ?window.earthlineClipVermontLine16178(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539.earthlineVermontGeometry16750)
        :earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);"""

new_prefix="""      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);
      window.EARTHLINE_JURISDICTION_FAST_SCREEN_17270=window.EARTHLINE_JURISDICTION_FAST_SCREEN_17270||{inside:0,outside:0,uncertain:0,at:new Date().toISOString()};
      const fastClass17270=earthlineCandidateJurisdictionClass17270(candidate16539,jurisdictionGeometry16539);
      if(fastClass17270!==0){
        const audit17270=window.EARTHLINE_JURISDICTION_FAST_SCREEN_17270;
        if(fastClass17270<0){audit17270.outside++;if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}
        const segment17270=earthlineDensifyCandidate17270(candidate16539&&candidate16539.segment||[]);
        const minimumScreenPx17270=candidate16539&&candidate16539.coverageGap16731?0.75:Math.max(4,Math.min(10,Number(candidate16539&&candidate16539.minLinePx16632)||10));
        if(segment17270.length<2||lineLengthPixels(hy,segment17270)<minimumScreenPx17270){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}
        const mid17270=segment17270[Math.floor((segment17270.length-1)/2)],grid17270=llGrid(hy,mid17270);
        if(!grid17270||!Number.isFinite(grid17270.x)||!Number.isFinite(grid17270.y)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}
        const screened17270=Object.assign({},candidate16539,{segment:segment17270,x:Math.max(1,Math.min(hy.w-2,Math.round(grid17270.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(grid17270.y))),jurisdiction_screened:true});
        audit17270.inside++;if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screened17270);return screened17270;
      }
      window.EARTHLINE_JURISDICTION_FAST_SCREEN_17270.uncertain++;
      const preparedClip17270=earthlineBoundaryEdgeIndex17270(jurisdictionGeometry16539)?.prepared||jurisdictionGeometry16539;
      const runs16539=(jurisdictionGeometry16539&&jurisdictionGeometry16539.earthlineVermontExactClip16750===true&&typeof window.earthlineClipVermontLine16178==='function')
        ?window.earthlineClipVermontLine16178(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539.earthlineVermontGeometry16750)
        :earthlineClipLine16539(candidate16539&&candidate16539.segment||[],preparedClip17270);"""

patch("fast-path exact candidate screen",old_prefix,new_prefix)

s="/* EARTHLINE_EXACT_JURISDICTION_FAST_SCREEN_17270 — provably interior/exterior candidate bboxes bypass repeated exact clipping; all boundary-adjacent candidates retain frozen exact clip. */\n"+s
p.write_text(s,encoding="utf-8")
print("17270 exact jurisdiction fast-screen candidate applied")
