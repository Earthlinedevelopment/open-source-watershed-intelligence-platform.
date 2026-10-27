from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""          const channel16702=percentile(h16702.acc,.972),elevs16702=[];
          const nearOut16702=(x,y,r=4)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=h16702.w||yy<0||yy>=h16702.h)continue;if(g16702.outsideLandMask16632[yy*h16702.w+xx])return true;}return false;};
"""
new="""          const channel16702=percentile(h16702.acc,.972),elevs16702=[];
          const coastDist16745=new Int16Array(h16702.w*h16702.h);coastDist16745.fill(-1);
          const coastQueue16745=new Int32Array(h16702.w*h16702.h);let coastHead16745=0,coastTail16745=0;
          const outsideMask16745=g16702.outsideLandMask16632||null;
          if(outsideMask16745){
            for(let i16745=0;i16745<outsideMask16745.length;i16745++)if(outsideMask16745[i16745]){coastDist16745[i16745]=0;coastQueue16745[coastTail16745++]=i16745;}
            while(coastHead16745<coastTail16745){
              const i16745=coastQueue16745[coastHead16745++],d16745=coastDist16745[i16745];if(d16745>=30)continue;
              const x16745=i16745%h16702.w,y16745=(i16745/h16702.w)|0,nd16745=d16745+1;
              for(let dy16745=-1;dy16745<=1;dy16745++)for(let dx16745=-1;dx16745<=1;dx16745++){
                if(dx16745===0&&dy16745===0)continue;
                const xx16745=x16745+dx16745,yy16745=y16745+dy16745;if(xx16745<0||yy16745<0||xx16745>=h16702.w||yy16745>=h16702.h)continue;
                const j16745=yy16745*h16702.w+xx16745;if(coastDist16745[j16745]>=0)continue;
                coastDist16745[j16745]=nd16745;coastQueue16745[coastTail16745++]=j16745;
              }
            }
          }
          const nearOut16702=(x,y,r=4)=>{const d16745=coastDist16745[y*h16702.w+x];return d16745>=0&&d16745<=r;};
"""
if s.count(old)!=1: raise SystemExit("nearOut scale anchor missing")
s=s.replace(old,new,1)

old2="""          const dist16702=ll=>{const gg=llGrid(h16702,ll);if(!gg||!Number.isFinite(gg.x)||!Number.isFinite(gg.y))return null;const cx=Math.max(0,Math.min(h16702.w-1,Math.round(gg.x))),cy=Math.max(0,Math.min(h16702.h-1,Math.round(gg.y)));for(let r=0;r<=30;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const xx=cx+dx,yy=cy+dy;if(xx<0||xx>=h16702.w||yy<0||yy>=h16702.h)continue;if(g16702.outsideLandMask16632[yy*h16702.w+xx])return r;}return null;};
"""
new2="""          const dist16702=ll=>{const gg=llGrid(h16702,ll);if(!gg||!Number.isFinite(gg.x)||!Number.isFinite(gg.y))return null;const cx=Math.max(0,Math.min(h16702.w-1,Math.round(gg.x))),cy=Math.max(0,Math.min(h16702.h-1,Math.round(gg.y))),d16745=coastDist16745[cy*h16702.w+cx];return d16745>=0&&d16745<=30?d16745:null;};
"""
if s.count(old2)!=1: raise SystemExit("distance scale anchor missing")
s=s.replace(old2,new2,1)

s="<!-- EARTHLINE_COAST_DISTANCE_TRANSFORM_17345: exact Chebyshev coast-distance transform replaces repeated neighborhood/ring scans in scale refinement. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed exact coast distance transform 17345")
