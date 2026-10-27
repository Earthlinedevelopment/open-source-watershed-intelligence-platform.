from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
start=s.find("    const jurisdictionScreenCache16592=new WeakMap();")
end=s.find("    async function jurisdictionEligibleCount16539",start)
if start<0 or end<0: raise SystemExit("jurisdiction screen owner anchors missing")
new=r'''    const jurisdictionScreenCache16592=new WeakMap();
    const jurisdictionFastGeometry17373=(!focusMode&&jurisdictionGeometry16539)
      ?((jurisdictionGeometry16539.earthlineVermontExactClip16750===true&&jurisdictionGeometry16539.earthlineVermontGeometry16750)
        ?jurisdictionGeometry16539.earthlineVermontGeometry16750:jurisdictionGeometry16539):null;
    const jurisdictionBoundaryIndex17373=(()=>{
      if(!jurisdictionFastGeometry17373)return null;
      const prepared17373=earthlinePrepareJurisdiction16539(jurisdictionFastGeometry17373);
      if(!prepared17373||!Array.isArray(prepared17373.polygons))return null;
      const scale17373=24,bins17373=new Map();let id17373=0;
      const addRing17373=ring17373=>{
        if(!Array.isArray(ring17373)||ring17373.length<2)return;
        for(let i17373=0,j17373=ring17373.length-1;i17373<ring17373.length;j17373=i17373++){
          const a17373=ring17373[j17373],b17373=ring17373[i17373];
          if(!earthlineFinitePoint16539(a17373)||!earthlineFinitePoint16539(b17373))continue;
          const x1=Number(a17373[0]),y1=Number(a17373[1]),x2=Number(b17373[0]),y2=Number(b17373[1]);
          const e17373={id:id17373++,a:a17373,b:b17373,minx:Math.min(x1,x2),maxx:Math.max(x1,x2),miny:Math.min(y1,y2),maxy:Math.max(y1,y2)};
          const cx0=Math.floor(e17373.minx*scale17373),cx1=Math.floor(e17373.maxx*scale17373),
                cy0=Math.floor(e17373.miny*scale17373),cy1=Math.floor(e17373.maxy*scale17373);
          for(let cx=cx0;cx<=cx1;cx++)for(let cy=cy0;cy<=cy1;cy++){
            const k=cx+','+cy;let list=bins17373.get(k);if(!list)bins17373.set(k,list=[]);list.push(e17373);
          }
        }
      };
      for(const poly17373 of prepared17373.polygons){addRing17373(poly17373.outer);for(const h17373 of (poly17373.holes||[]))addRing17373(h17373.ring);}
      return {prepared:prepared17373,scale:scale17373,bins:bins17373};
    })();
    function jurisdictionSegmentsTouchBoundary17373(segment17373){
      const idx17373=jurisdictionBoundaryIndex17373;
      if(!idx17373||!Array.isArray(segment17373)||segment17373.length<2)return true;
      const cross17373=(ax,ay,bx,by)=>ax*by-ay*bx,eps17373=1e-12;
      const intersects17373=(p1,p2,q1,q2)=>{
        const ax=Number(p1[0]),ay=Number(p1[1]),bx=Number(p2[0]),by=Number(p2[1]),
              cx=Number(q1[0]),cy=Number(q1[1]),dx=Number(q2[0]),dy=Number(q2[1]);
        const rx=bx-ax,ry=by-ay,sx=dx-cx,sy=dy-cy,qx=cx-ax,qy=cy-ay,den=cross17373(rx,ry,sx,sy);
        if(Math.abs(den)>eps17373){
          const t=cross17373(qx,qy,sx,sy)/den,u=cross17373(qx,qy,rx,ry)/den;
          return t>=-eps17373&&t<=1+eps17373&&u>=-eps17373&&u<=1+eps17373;
        }
        if(Math.abs(cross17373(qx,qy,rx,ry))>eps17373)return false;
        const rr=rx*rx+ry*ry;if(rr<eps17373)return Math.hypot(ax-cx,ay-cy)<eps17373;
        const t0=(qx*rx+qy*ry)/rr,t1=t0+(sx*rx+sy*ry)/rr;
        return Math.min(t0,t1)<=1+eps17373&&Math.max(t0,t1)>=-eps17373;
      };
      for(let i17373=1;i17373<segment17373.length;i17373++){
        const a17373=segment17373[i17373-1],b17373=segment17373[i17373];
        if(!earthlineFinitePoint16539(a17373)||!earthlineFinitePoint16539(b17373))continue;
        const minx=Math.min(Number(a17373[0]),Number(b17373[0])),maxx=Math.max(Number(a17373[0]),Number(b17373[0])),
              miny=Math.min(Number(a17373[1]),Number(b17373[1])),maxy=Math.max(Number(a17373[1]),Number(b17373[1])),
              cx0=Math.floor(minx*idx17373.scale),cx1=Math.floor(maxx*idx17373.scale),
              cy0=Math.floor(miny*idx17373.scale),cy1=Math.floor(maxy*idx17373.scale),seen17373=new Set();
        for(let cx=cx0;cx<=cx1;cx++)for(let cy=cy0;cy<=cy1;cy++)for(const e17373 of (idx17373.bins.get(cx+','+cy)||[])){
          if(seen17373.has(e17373.id))continue;seen17373.add(e17373.id);
          if(e17373.maxx<minx||e17373.minx>maxx||e17373.maxy<miny||e17373.miny>maxy)continue;
          if(intersects17373(a17373,b17373,e17373.a,e17373.b))return true;
        }
      }
      return false;
    }
    function screenJurisdictionCandidate16539(candidate16539){
      if(focusMode||!jurisdictionGeometry16539)return candidate16539;
      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);
      const sourceSegment17373=candidate16539&&candidate16539.segment||[];
      if(jurisdictionBoundaryIndex17373&&sourceSegment17373.length>=2&&!jurisdictionSegmentsTouchBoundary17373(sourceSegment17373)){
        const probe17373=sourceSegment17373[Math.floor((sourceSegment17373.length-1)/2)];
        if(!earthlinePointInJurisdiction16539(probe17373,jurisdictionFastGeometry17373)){
          if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;
        }
        const minimumScreenPx16737=candidate16539&&candidate16539.coverageGap16731
          ?0.75
          :Math.max(4,Math.min(10,Number(candidate16539&&candidate16539.minLinePx16632)||10));
        if(lineLengthPixels(hy,sourceSegment17373)<minimumScreenPx16737){
          if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;
        }
        const grid17373=llGrid(hy,probe17373);
        if(!grid17373||!Number.isFinite(grid17373.x)||!Number.isFinite(grid17373.y)){
          if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;
        }
        const accepted17373=Object.assign({},candidate16539,{
          segment:sourceSegment17373,
          x:Math.max(1,Math.min(hy.w-2,Math.round(grid17373.x))),
          y:Math.max(1,Math.min(hy.h-2,Math.round(grid17373.y))),
          jurisdiction_screened:true,
          jurisdiction_fast_exact17373:true
        });
        if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,accepted17373);
        return accepted17373;
      }
      const runs16539=(jurisdictionGeometry16539&&jurisdictionGeometry16539.earthlineVermontExactClip16750===true&&typeof window.earthlineClipVermontLine16178==='function')
        ?window.earthlineClipVermontLine16178(sourceSegment17373,jurisdictionGeometry16539.earthlineVermontGeometry16750)
        :earthlineClipLine16539(sourceSegment17373,jurisdictionGeometry16539);
      if(!runs16539.length){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}
      runs16539.sort((a16539,b16539)=>lineLengthPixels(hy,b16539)-lineLengthPixels(hy,a16539));
      const segment16539=runs16539[0];
      const minimumScreenPx16737=candidate16539&&candidate16539.coverageGap16731
        ?0.75
        :Math.max(4,Math.min(10,Number(candidate16539&&candidate16539.minLinePx16632)||10));
      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<minimumScreenPx16737){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}
      const mid16539=segment16539[Math.floor((segment16539.length-1)/2)],grid16539=llGrid(hy,mid16539);
      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}
      const screenedCandidate16592=Object.assign({},candidate16539,{
        segment:segment16539,
        x:Math.max(1,Math.min(hy.w-2,Math.round(grid16539.x))),
        y:Math.max(1,Math.min(hy.h-2,Math.round(grid16539.y))),
        jurisdiction_screened:true
      });
      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screenedCandidate16592);
      return screenedCandidate16592;
    }
'''
s=s[:start]+new+s[end:]
s="<!-- EARTHLINE_JURISDICTION_EDGE_FASTPATH_17373: exact no-boundary-crossing fast accept/reject before authoritative clip; ranking, spacing, capacity and boundary-crossing clip unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed exact jurisdiction edge fastpath 17373")
