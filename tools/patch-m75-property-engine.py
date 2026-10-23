from pathlib import Path

p=Path("index.html")
s=p.read_text(errors="strict")

old_min="""const minSegmentM=isRegionalTile15769
      ? earthlineMinimumSwaleLengthM15768()
      : Math.max(24,earthlineMinimumSwaleLengthM15768());"""
new_min="""const minSegmentM=isRegionalTile15769
      ? earthlineMinimumSwaleLengthM15768()
      : Math.max(24,earthlineMinimumSwaleLengthM15768());

    function earthlineMergePropertyContourSegments17700(input,L17700){
      const segs=(input||[]).filter(seg=>Array.isArray(seg)&&seg.length>=2);
      if(isRegionalTile15769||segs.length<2)return segs;
      const pool=segs.slice().sort((a,b)=>earthlineSegmentLengthM(b)-earthlineSegmentLengthM(a));
      const used=new Uint8Array(pool.length),out=[];
      const maxGapM17700=Math.min(12,Math.max(5,targetSpacingM15771*1.25));
      for(let i=0;i<pool.length;i++){
        if(used[i])continue;
        used[i]=1;
        let current=pool[i],changed=true,passes=0;
        while(changed&&passes++<8){
          changed=false;
          let bestJ=-1,bestPts=null,bestLen=earthlineSegmentLengthM(current);
          for(let j=0;j<pool.length;j++){
            if(used[j])continue;
            const joined=earthlineJoinPathsIfCompatible(current,pool[j],maxS,maxGapM17700);
            if(!joined)continue;
            if(!earthlineOnContourGuard15833(joined,L17700,levelStep))continue;
            const len=earthlineSegmentLengthM(joined);
            if(len>bestLen){bestLen=len;bestJ=j;bestPts=joined;}
          }
          if(bestJ>=0&&bestPts){
            current=bestPts;
            used[bestJ]=1;
            changed=true;
          }
        }
        out.push(current);
      }
      out.sort((a,b)=>earthlineSegmentLengthM(b)-earthlineSegmentLengthM(a));
      return out;
    }"""

pairs=[
(
old_min,
new_min
),
(
"earthlineSplitUsableSegments(pts16320,maxS).filter(seg=>",
"earthlineMergePropertyContourSegments17700(earthlineSplitUsableSegments(pts16320,maxS),L15836).filter(seg=>"
),
(
"const segs=earthlineSplitUsableSegments(pts,maxS).slice(0,3);",
"const segs=earthlineMergePropertyContourSegments17700(earthlineSplitUsableSegments(pts,maxS),L).slice(0,3);"
)
]

for i,(old,new) in enumerate(pairs,1):
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"PATCH_{i}_COUNT={n}")
    s=s.replace(old,new,1)

p.write_text(s)
print("EARTHLINE_M75_PROPERTY_MERGE_PATCH_OK")
