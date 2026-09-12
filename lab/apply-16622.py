from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16622 — LOCAL REGIONAL CONTOUR WINDOW'
if marker in s:
    print('16622 already present')
    raise SystemExit(0)

old_head="""    function sampleSegment(coords,center,relaxed){
      const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);
      const raw=coords.slice(start,end);if(raw.length<10)return null;
      const segment=chaikin(raw,2,false);if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;
      const stride=Math.max(1,Math.floor(segment.length/22));let valid=0,sumSlope=0,sumAcc=0,maxAcc=0,anchor=null;
"""
new_head="""    function sampleSegment(coords,center,relaxed){
      /* EARTHLINE 16622 — LOCAL REGIONAL CONTOUR WINDOW.
         Regional opportunity corridors must stay local to the modeled contour.
         Select by terrain-grid distance, not smoothed vertex count, so coarse
         statewide contours cannot become tens-of-kilometres-long swales. */
      let raw;
      if(focusMode){
        const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);
        raw=coords.slice(start,end);if(raw.length<10)return null;
      }else{
        const maxHalfPixels16622=2.0,maxHopPixels16622=1.5;
        const gridDistance16622=(a,b)=>{const ga=llGrid(hy,a),gb=llGrid(hy,b);return Math.hypot(gb.x-ga.x,gb.y-ga.y);};
        const left=[coords[center]],right=[];let dLeft16622=0,dRight16622=0;
        for(let i16622=center-1;i16622>=0;i16622--){
          const d16622=gridDistance16622(coords[i16622],coords[i16622+1]);
          if(!Number.isFinite(d16622)||d16622>maxHopPixels16622||dLeft16622+d16622>maxHalfPixels16622)break;
          left.unshift(coords[i16622]);dLeft16622+=d16622;
        }
        for(let i16622=center+1;i16622<coords.length;i16622++){
          const d16622=gridDistance16622(coords[i16622-1],coords[i16622]);
          if(!Number.isFinite(d16622)||d16622>maxHopPixels16622||dRight16622+d16622>maxHalfPixels16622)break;
          right.push(coords[i16622]);dRight16622+=d16622;
        }
        raw=left.concat(right);if(raw.length<6)return null;
      }
      const segment=chaikin(raw,2,false),segmentPixels16622=lineLengthPixels(hy,segment);
      if(segment.length<(focusMode?10:6)||segmentPixels16622<(focusMode?10:2.5))return null;
      const stride=Math.max(1,Math.floor(segment.length/22));let valid=0,sumSlope=0,sumAcc=0,maxAcc=0,anchor=null;
"""
if s.count(old_head)!=1:
    raise SystemExit(f'guard failed: sampleSegment head count {s.count(old_head)}')
s=s.replace(old_head,new_head,1)

old_length="      const lengthScore=Math.min(1,lineLengthPixels(hy,segment)/85);"
new_length="      const lengthScore=Math.min(1,segmentPixels16622/(focusMode?85:4));"
if s.count(old_length)!=1:
    raise SystemExit(f'guard failed: length score count {s.count(old_length)}')
s=s.replace(old_length,new_length,1)

p.write_text(s,encoding='utf-8')
print('16622 mutation applied')
