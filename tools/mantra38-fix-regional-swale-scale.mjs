import fs from 'node:fs';
const path='index.html';
let s=fs.readFileSync(path,'utf8');
const old=`    const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];
    function sampleSegment(coords,center,relaxed){
      const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);
      const raw=coords.slice(start,end);if(raw.length<10)return null;
      const segment=chaikin(raw,2,false);if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;`;
const neu=`    const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];
    /* MANTRA 38 — Regional swale scale repair. The legacy lineLengthPixels() helper is
       DEM-grid distance, not display pixels. Keep contour science unchanged and give the
       existing swale generator one stable 840×584 reference display so candidate geometry
       no longer grows with jurisdiction size. Existing 10 px minimum and 85 px full-length
       score remain the governing thresholds. */
    function regionalSwaleDisplayLengthPx16584(coords){
      const sx=840/Math.max(1,hy.w-1),sy=584/Math.max(1,hy.h-1);let d=0,last=null;
      for(const ll of coords||[]){const g=llGrid(hy,ll),p={x:g.x*sx,y:g.y*sy};if(last)d+=Math.hypot(p.x-last.x,p.y-last.y);last=p;}
      return d;
    }
    function sampleSegment(coords,center,relaxed){
      let start=center,end=center,lengthPx=0;
      while((lengthPx<85||end-start+1<10)&&(start>0||end<coords.length-1)){
        const leftCost=start>0?regionalSwaleDisplayLengthPx16584([coords[start-1],coords[start]]):Infinity;
        const rightCost=end<coords.length-1?regionalSwaleDisplayLengthPx16584([coords[end],coords[end+1]]):Infinity;
        if(leftCost<=rightCost&&start>0){start--;lengthPx+=leftCost;}
        else if(end<coords.length-1){end++;lengthPx+=rightCost;}
        else break;
      }
      const raw=coords.slice(start,end+1);if(raw.length<10)return null;
      const segment=chaikin(raw,2,false);if(segment.length<10||regionalSwaleDisplayLengthPx16584(segment)<10)return null;`;
if(!s.includes(old)) throw new Error('expected sampleSegment anchor not found; refusing to patch');
s=s.replace(old,neu);
const oldScore=`      const lengthScore=Math.min(1,lineLengthPixels(hy,segment)/85);`;
const newScore=`      const lengthScore=Math.min(1,regionalSwaleDisplayLengthPx16584(segment)/85);`;
if(!s.includes(oldScore)) throw new Error('expected lengthScore anchor not found; refusing to patch');
s=s.replace(oldScore,newScore);
fs.writeFileSync(path,s);
console.log('Patched existing makeSwales scale owner only.');
