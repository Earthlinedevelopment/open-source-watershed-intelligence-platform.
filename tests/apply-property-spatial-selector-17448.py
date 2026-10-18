from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_samples="""    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;
      const fractions=focusMode?(coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68]):(coords.length>110?[.1,.2,.3,.4,.5,.6,.7,.8,.9]:coords.length>55?[.15,.3,.45,.6,.75,.9]:[.25,.5,.75]);
      for(const frac of fractions){
        const idx=Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac)));
        if(!focusMode)noteAnchor16786(anchorKey16786(coords,idx));
        const c=sampleSegment(coords,idx,false);if(c)candidates.push(c);
      }
    }
"""
new_samples="""    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;
      const fractions=focusMode?(coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68]):(coords.length>110?[.1,.2,.3,.4,.5,.6,.7,.8,.9]:coords.length>55?[.15,.3,.45,.6,.75,.9]:[.25,.5,.75]);
      for(const frac of fractions){
        const idx=Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac)));
        if(!focusMode)noteAnchor16786(anchorKey16786(coords,idx));
        const c=sampleSegment(coords,idx,false);if(c)candidates.push(c);
      }
      /* EARTHLINE 17448 — Property contour coverage.
         Fixed fractional samples can miss valid portions of a long contour inside
         a 20-acre parcel. For Property only, give each occupied 6x6 terrain zone
         on this real contour one additional sample opportunity. This creates no
         synthetic geometry: every candidate still comes from sampleSegment() on
         the existing terrain contour and passes the same slope/flow gates. */
      if(focusMode){
        const seen17448=new Set(),stride17448=Math.max(1,Math.floor(coords.length/96));
        for(let idx17448=3;idx17448<coords.length-3;idx17448+=stride17448){
          const g17448=llGrid(hy,coords[idx17448]);
          if(!g17448||!Number.isFinite(Number(g17448.x))||!Number.isFinite(Number(g17448.y)))continue;
          const cx17448=Math.max(0,Math.min(5,Math.floor(Number(g17448.x)*6/Math.max(1,hy.w))));
          const cy17448=Math.max(0,Math.min(5,Math.floor(Number(g17448.y)*6/Math.max(1,hy.h))));
          const key17448=cx17448+','+cy17448;
          if(seen17448.has(key17448))continue;seen17448.add(key17448);
          const c17448=sampleSegment(coords,idx17448,false);
          if(c17448){c17448.propertySpatialSample17448=true;c17448.propertySpatialCell17448=key17448;candidates.push(c17448);}
        }
      }
    }
"""
if s.count(old_samples)!=1: raise SystemExit(f"sample anchor count {s.count(old_samples)}")
s=s.replace(old_samples,new_samples,1)

old_sort="""    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);
    const chosen=[],primarySpacing=focusMode?Math.max(6,Math.round(hy.w/31)):Math.max(3,Math.round(hy.w/31));
"""
new_sort="""    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);
    const propertyTargetM17448=focusMode?Number((typeof M!=='undefined'&&M&&M.targetSwaleSpacingM)||0):0;
    const propertyCellM17448=Math.max(Number(hy&&hy.cellX)||0,Number(hy&&hy.cellY)||0);
    const propertyTargetCells17448=focusMode&&Number.isFinite(propertyTargetM17448)&&propertyTargetM17448>0&&propertyCellM17448>0
      ?Math.max(8,Math.round(propertyTargetM17448/propertyCellM17448))
      :Math.max(8,Math.round(hy.w/24));
    const chosen=[],primarySpacing=focusMode?propertyTargetCells17448:Math.max(3,Math.round(hy.w/31));
    const propertyGrid17448=6,propertyBestByCell17448=new Map();
    if(focusMode){
      const preferred17448=candidates.filter(c17448=>String(c17448&&c17448.confidence||'')==='preferred');
      const supportPool17448=preferred17448.length?preferred17448:candidates;
      for(const c17448 of supportPool17448){
        if(!c17448||!Number.isFinite(Number(c17448.x))||!Number.isFinite(Number(c17448.y)))continue;
        const cx17448=Math.max(0,Math.min(propertyGrid17448-1,Math.floor(Number(c17448.x)*propertyGrid17448/Math.max(1,hy.w))));
        const cy17448=Math.max(0,Math.min(propertyGrid17448-1,Math.floor(Number(c17448.y)*propertyGrid17448/Math.max(1,hy.h))));
        const key17448=cx17448+','+cy17448,prior17448=propertyBestByCell17448.get(key17448);
        if(!prior17448||(Number(c17448.score)||0)>(Number(prior17448.score)||0))propertyBestByCell17448.set(key17448,c17448);
      }
    }
    const propertySupportCells17448=propertyBestByCell17448.size;
    const propertyCapacity17448=focusMode
      ?Math.max(16,Math.min(36,propertySupportCells17448+Math.ceil(propertySupportCells17448*.35)))
      :0;
"""
if s.count(old_sort)!=1: raise SystemExit(f"sort anchor count {s.count(old_sort)}")
s=s.replace(old_sort,new_sort,1)

old_capacity="""    const baseRegionalCapacity16755=focusMode?52:Math.min(120,Math.max(80,coverageGroups16736.size*4));"""
new_capacity="""    const baseRegionalCapacity16755=focusMode?propertyCapacity17448:Math.min(120,Math.max(80,coverageGroups16736.size*4));"""
if s.count(old_capacity)!=1: raise SystemExit(f"base capacity anchor count {s.count(old_capacity)}")
s=s.replace(old_capacity,new_capacity,1)

old_regcap="""    const regionalCapacity16755=focusMode?52:baseRegionalCapacity16755+supportExtra16755;"""
new_regcap="""    const regionalCapacity16755=focusMode?propertyCapacity17448:baseRegionalCapacity16755+supportExtra16755;"""
if s.count(old_regcap)!=1: raise SystemExit(f"regional capacity anchor count {s.count(old_regcap)}")
s=s.replace(old_regcap,new_regcap,1)

old_loop="""    for(const c of candidates){
      if(chosen.length>=regionalCapacity16755)break;
      if(chosen.includes(c))continue;
      const spacing=chosen.length<20?primarySpacing:(focusMode?Math.max(4,Math.round(primarySpacing*.72)):Math.max(2,Math.round(primarySpacing*.72)));
      if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<spacing))continue;
      chosen.push(c);
    }
"""
new_loop="""    if(focusMode&&propertyBestByCell17448.size){
      const reserve17448=Array.from(propertyBestByCell17448.entries())
        .map(([cell,candidate])=>({cell,candidate}))
        .sort((a17448,b17448)=>(Number(b17448.candidate.score)||0)-(Number(a17448.candidate.score)||0));
      const reserveSpacing17448=Math.max(6,Math.round(primarySpacing*.72));
      for(const row17448 of reserve17448){
        if(chosen.length>=regionalCapacity16755)break;
        const c17448=row17448.candidate;
        if(chosen.some(p17448=>Math.hypot(Number(p17448.x)-Number(c17448.x),Number(p17448.y)-Number(c17448.y))<reserveSpacing17448))continue;
        chosen.push(c17448);
      }
    }
    const propertyCellCount17448=new Map();
    const propertyCellKey17448=c17448=>{
      if(!focusMode||!c17448||!Number.isFinite(Number(c17448.x))||!Number.isFinite(Number(c17448.y)))return null;
      const cx17448=Math.max(0,Math.min(propertyGrid17448-1,Math.floor(Number(c17448.x)*propertyGrid17448/Math.max(1,hy.w))));
      const cy17448=Math.max(0,Math.min(propertyGrid17448-1,Math.floor(Number(c17448.y)*propertyGrid17448/Math.max(1,hy.h))));
      return cx17448+','+cy17448;
    };
    if(focusMode)for(const c17448 of chosen){const k17448=propertyCellKey17448(c17448);if(k17448)propertyCellCount17448.set(k17448,(propertyCellCount17448.get(k17448)||0)+1);}
    for(const c of candidates){
      if(chosen.length>=regionalCapacity16755)break;
      if(chosen.includes(c))continue;
      const spacing=focusMode?primarySpacing:(chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72)));
      if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<spacing))continue;
      if(focusMode){
        const k17448=propertyCellKey17448(c);
        if(k17448&&(propertyCellCount17448.get(k17448)||0)>=2)continue;
        chosen.push(c);
        if(k17448)propertyCellCount17448.set(k17448,(propertyCellCount17448.get(k17448)||0)+1);
      }else chosen.push(c);
    }
    if(focusMode){
      window.EARTHLINE_PROPERTY_SPATIAL_SELECTION_17448={
        build:'EARTHLINE 17448',
        targetSpacingM:Number.isFinite(propertyTargetM17448)?propertyTargetM17448:null,
        cellM:Number.isFinite(propertyCellM17448)?propertyCellM17448:null,
        spacingCells:primarySpacing,
        supportCells:propertySupportCells17448,
        capacity:regionalCapacity16755,
        chosen:chosen.length,
        chosenCells:propertyCellCount17448.size,
        perCell:Object.fromEntries(propertyCellCount17448),
        rule:'real contour candidates only; reserve supported 6x6 parcel zones first, then score-fill with existing target spacing and max two selected corridors per zone',
        at:new Date().toISOString()
      };
    }
"""
if s.count(old_loop)!=1: raise SystemExit(f"selection loop anchor count {s.count(old_loop)}")
s=s.replace(old_loop,new_loop,1)

s="<!-- EARTHLINE_PROPERTY_SPATIAL_SELECTOR_17448: real-contour zone coverage + target-spacing density control for 20-acre Property only. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched Property spatial selector 17448")
