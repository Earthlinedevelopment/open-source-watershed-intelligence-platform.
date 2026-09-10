import fs from 'node:fs';

const path='index.html';
const src=fs.readFileSync(path,'utf8');

const oldFn=`  function earthlineRegionalSmoothFlow16584(hy16584,raw16584){
    const base16584=cleanLine(raw16584);if(base16584.length<2)return [];
    const smooth16584=chaikin(base16584,2,false);
    let safe16584=smooth16584.length>=2;
    if(safe16584){
      for(let i16584=0;i16584<smooth16584.length;i16584++){
        if(!earthlineRegionalPointValid16584(hy16584,smooth16584[i16584])){safe16584=false;break;}
        if(i16584>0&&!earthlineRegionalSegmentValid16584(hy16584,smooth16584[i16584-1],smooth16584[i16584])){safe16584=false;break;}
      }
    }
    return safe16584?smooth16584:base16584;
  }`;

const newFn=`  function earthlineRegionalSmoothFlow16584(hy16584,raw16584){
    const base16584=cleanLine(raw16584);if(base16584.length<2)return [];
    const lineSafe16584=line16584=>{
      if(!Array.isArray(line16584)||line16584.length<2)return false;
      for(let i16584=0;i16584<line16584.length;i16584++){
        if(!earthlineRegionalPointValid16584(hy16584,line16584[i16584]))return false;
        if(i16584>0&&!earthlineRegionalSegmentValid16584(hy16584,line16584[i16584-1],line16584[i16584]))return false;
      }
      return true;
    };
    const smooth16584=chaikin(base16584,2,false);
    if(lineSafe16584(smooth16584))return smooth16584;

    const runs16584=[];let run16584=[];
    for(const p16584 of base16584){
      const pointSafe16584=earthlineRegionalPointValid16584(hy16584,p16584);
      const segmentSafe16584=pointSafe16584&&(!run16584.length||earthlineRegionalSegmentValid16584(hy16584,run16584[run16584.length-1],p16584));
      if(pointSafe16584&&segmentSafe16584)run16584.push(p16584);
      else{
        if(run16584.length>=2)runs16584.push(run16584);
        run16584=pointSafe16584?[p16584]:[];
      }
    }
    if(run16584.length>=2)runs16584.push(run16584);
    if(!runs16584.length)return [];
    runs16584.sort((a16584,b16584)=>b16584.length-a16584.length);
    const safeBase16584=runs16584[0];
    const retrySmooth16584=chaikin(safeBase16584,2,false);
    return lineSafe16584(retrySmooth16584)?retrySmooth16584:safeBase16584;
  }`;

const hits=src.split(oldFn).length-1;
if(hits!==1){
  console.error(`Expected exactly one 16584 flow smoothing owner, found ${hits}. Refusing to edit.`);
  process.exit(2);
}
const out=src.replace(oldFn,newFn);
if(out===src)throw new Error('No source change made');
if(!out.includes('if(unsafe16584>0)throw new Error("regional land-validity flow audit failed: "+unsafe16584+" displayed flow segments enter invalid terrain")')){
  throw new Error('Fail-closed land-validity audit missing after repair');
}
if(!out.includes('return lineSafe16584(retrySmooth16584)?retrySmooth16584:safeBase16584;')){
  throw new Error('Safe flow fallback repair missing');
}
fs.writeFileSync(path,out,'utf8');
console.log('16603 repair applied: unsafe flow geometry is split to contiguous valid runs; audit preserved unchanged.');
