from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

old1="const features=[],usedEdges=new Set();let lineCount=0;"
new1="const features=[],usedEdges=new Set();let lineCount=0,tributaryCount16921=0;"
if "tributaryCount16921" not in s:
    if old1 not in s: raise SystemExit("16921 line-count anchor missing")
    s=s.replace(old1,new1,1)

old2="let i=seed,raw=[],guard=0,maxAcc=hy.acc[seed];"
new2="let i=seed,raw=[],guard=0,maxAcc=hy.acc[seed],metConfluence16921=false;"
if "metConfluence16921=false" not in s:
    if old2 not in s: raise SystemExit("16921 trace anchor missing")
    s=s.replace(old2,new2,1)

old3="if(usedEdges.has(edge)){raw.push(gridLL(hy,j%hy.w,(j/hy.w)|0));break;}"
new3="if(usedEdges.has(edge)){metConfluence16921=true;raw.push(gridLL(hy,j%hy.w,(j/hy.w)|0));break;}"
if "metConfluence16921=true" not in s:
    if old3 not in s: raise SystemExit("16921 confluence anchor missing")
    s=s.replace(old3,new3,1)

old4="""      if(raw.length<5)return false;
      const coords=earthlineRegionalSmoothFlow16584(hy,raw);if(coords.length<8)return false;
      const rank=Math.min(1,Math.log1p(maxAcc)/Math.log1p(hy.w*hy.h));
      features.push({type:'Feature',properties:{feature_type:'flow',rank,downstream:1},geometry:{type:'LineString',coordinates:coords}});lineCount++;
      const desired=Math.max(3,Math.min(12,Math.floor(coords.length/14))),stride=(coords.length-1)/(desired+1);
      for(let a=1;a<=desired;a++){
        const pos=Math.max(2,Math.min(coords.length-3,Math.round(stride*a))),bearing=flowBearing(coords[pos-2],coords[pos+2]);
        features.push({type:'Feature',properties:{feature_type:'flow-arrow',rank,bearing,rotation:(bearing+270)%360},geometry:{type:'Point',coordinates:coords[pos]}});
      }
      return true;"""
new4="""      /* EARTHLINE 16921 — shared branch-preserving Regional drainage topology.
         A valid channel branch that terminates at an already-published downstream edge is a
         tributary, not a failed trace. Preserve those confluence-ending branch segments even
         when they are shorter than a trunk path. This is jurisdiction-agnostic and changes
         no DEM, accumulation threshold, land-validity rule, or clipping owner. */
      const tributary16921=metConfluence16921;
      if(raw.length<(tributary16921?2:5))return false;
      const coords=earthlineRegionalSmoothFlow16584(hy,raw);
      if(coords.length<(tributary16921?2:8))return false;
      const rank=Math.min(1,Math.log1p(maxAcc)/Math.log1p(hy.w*hy.h));
      features.push({type:'Feature',properties:{feature_type:'flow',rank,downstream:1,tributary:tributary16921?1:0},geometry:{type:'LineString',coordinates:coords}});
      lineCount++;if(tributary16921)tributaryCount16921++;
      if(coords.length>=5){
        const desired=Math.max(3,Math.min(12,Math.floor(coords.length/14))),stride=(coords.length-1)/(desired+1);
        for(let a=1;a<=desired;a++){
          const pos=Math.max(2,Math.min(coords.length-3,Math.round(stride*a))),bearing=flowBearing(coords[pos-2],coords[pos+2]);
          features.push({type:'Feature',properties:{feature_type:'flow-arrow',rank,bearing,rotation:(bearing+270)%360},geometry:{type:'Point',coordinates:coords[pos]}});
        }
      }
      return true;"""
if "EARTHLINE 16921 — shared branch-preserving Regional drainage topology" not in s:
    if old4 not in s: raise SystemExit("16921 trace-body anchor missing")
    s=s.replace(old4,new4,1)

old5="generatedLines:lineCount,rule:'shared continuous relief-adaptive Regional drainage density',at:new Date().toISOString()"
new5="generatedLines:lineCount,tributaryLines:tributaryCount16921,rule:'shared continuous relief-adaptive Regional drainage density + branch-preserving confluence topology',at:new Date().toISOString()"
if "tributaryLines:tributaryCount16921" not in s:
    if old5 not in s: raise SystemExit("16921 audit anchor missing")
    s=s.replace(old5,new5,1)

p.write_text(s,encoding="utf-8")
print("EARTHLINE 16921 shared Regional tributary owner applied")
