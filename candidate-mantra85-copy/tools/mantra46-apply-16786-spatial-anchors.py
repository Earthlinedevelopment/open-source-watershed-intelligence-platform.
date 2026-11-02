from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name,old,new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

patch("header",
"<!-- EARTHLINE 16785 — REGIONAL CANDIDATE-GENERATION REPAIR.",
"<!-- EARTHLINE 16786 — SPATIALLY COMPLETE REGIONAL CONTOUR ANCHORS. Evidence from the 16785 IA/AR per-cell gate audit showed remaining opportunity cells were often never sampled by fixed-fraction contour anchors. Preserve every existing anchor, then give each distinct 12x12 contour cell up to two total real makeSwales sample attempts. Existing contour geometry, slope/flow gates, jurisdiction clipping, mapped-water/exclusions, ranking and final Regional capacity are unchanged. Property is unchanged. CANDIDATE / NOT ACCEPTED. -->\n<!-- EARTHLINE 16785 — REGIONAL CANDIDATE-GENERATION REPAIR.")

old="""    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;
      const fractions=focusMode?(coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68]):(coords.length>110?[.1,.2,.3,.4,.5,.6,.7,.8,.9]:coords.length>55?[.15,.3,.45,.6,.75,.9]:[.25,.5,.75]);
      for(const frac of fractions){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),false);if(c)candidates.push(c);}
    }
    if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);"""

new="""    const regionalAnchorAttempts16786=new Map();
    const anchorKey16786=(coords,idx)=>{
      try{
        const g=llGrid(hy,coords[idx]);
        if(!g||!Number.isFinite(Number(g.x))||!Number.isFinite(Number(g.y)))return null;
        const bx=Math.max(0,Math.min(11,Math.floor(Number(g.x)*12/Math.max(1,hy.w))));
        const by=Math.max(0,Math.min(11,Math.floor(Number(g.y)*12/Math.max(1,hy.h))));
        return bx+','+by;
      }catch(_){return null;}
    };
    const noteAnchor16786=(key)=>{if(key)regionalAnchorAttempts16786.set(key,(regionalAnchorAttempts16786.get(key)||0)+1);};
    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;
      const fractions=focusMode?(coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68]):(coords.length>110?[.1,.2,.3,.4,.5,.6,.7,.8,.9]:coords.length>55?[.15,.3,.45,.6,.75,.9]:[.25,.5,.75]);
      for(const frac of fractions){
        const idx=Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac)));
        if(!focusMode)noteAnchor16786(anchorKey16786(coords,idx));
        const c=sampleSegment(coords,idx,false);if(c)candidates.push(c);
      }
    }
    if(!focusMode){
      let supplementalAnchorAttempts16786=0,supplementalAnchorCandidates16786=0;
      for(const f of lines){
        const coords=f.geometry.coordinates;if(coords.length<16)continue;
        const visited16786=new Set();
        for(let idx=3;idx<coords.length-3;idx++){
          const key=anchorKey16786(coords,idx);if(!key||visited16786.has(key))continue;visited16786.add(key);
          if((regionalAnchorAttempts16786.get(key)||0)>=2)continue;
          noteAnchor16786(key);supplementalAnchorAttempts16786++;
          const c=sampleSegment(coords,idx,false);
          if(c){c.spatialAnchor16786=true;c.spatialAnchorCell16786=key;candidates.push(c);supplementalAnchorCandidates16786++;}
        }
      }
      window.EARTHLINE_SPATIAL_ANCHOR_AUDIT_16786={
        build:'EARTHLINE 16786',attemptedCells:Array.from(regionalAnchorAttempts16786.keys()).sort(),
        cellAttemptCounts:Object.fromEntries(regionalAnchorAttempts16786),
        supplementalAttempts:supplementalAnchorAttempts16786,supplementalCandidates:supplementalAnchorCandidates16786,
        rule:'preserve existing fixed anchors, then give each 12x12 contour cell up to two total real makeSwales sample attempts; capacity and science gates unchanged',
        at:new Date().toISOString()
      };
    }
    if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);"""

patch("spatial-anchor-owner",old,new)

p.write_text(s,encoding="utf-8")
print("16786 spatial anchor repair applied")
