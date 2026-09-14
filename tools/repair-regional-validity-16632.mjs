import fs from 'node:fs';

const path='index.html';
const src=fs.readFileSync(path,'utf8');

const fnStart='  function earthlineRegionalSegmentValid16584(hy16584,a16584,b16584){';
const fnEnd='  function earthlineRegionalSmoothFlow16584(hy16584,raw16584){';
const start=src.indexOf(fnStart);
const second=start<0?-1:src.indexOf(fnStart,start+1);
const end=start<0?-1:src.indexOf(fnEnd,start);
if(start<0||second>=0||end<0){
  console.error(`Expected exactly one Regional segment-validity owner; start=${start} second=${second} end=${end}`);
  process.exit(2);
}
if(!src.includes('EARTHLINE 16631 — FAST EXACT IN-BOUNDS VALIDITY SAMPLER')){
  throw new Error('16631 exact sampler marker missing; refusing to edit unknown parent.');
}
if(src.includes('EARTHLINE 16632 — EXACT EMPTY-RECTANGLE FAST PATH')){
  throw new Error('16632 is already present.');
}

const replacement=`  /* EARTHLINE 16632 — EXACT EMPTY-RECTANGLE FAST PATH.
     Same 16584 validity owner and mask. Build one immutable prefix index per hydrology
     result solely to prove when a segment's entire rounded-cell bounding rectangle has
     zero invalid cells. A zero-invalid rectangle is a strict superset proof that every
     cell the existing 4-samples-per-grid-cell walk could inspect is valid, so the
     verdict is identical. Any rectangle containing even one invalid cell falls through
     to the exact 16631 sampler unchanged. No new mask, rule, renderer, listener,
     publication owner, or lifecycle owner. */
  function earthlineRegionalValidityPrefix16584(hy16584){
    if(!hy16584||!hy16584.validityMask16584)return null;
    const mask16584=hy16584.validityMask16584,w16584=hy16584.w|0,h16584=hy16584.h|0;
    if(w16584<1||h16584<1)return null;
    const cached16584=hy16584.__earthlineValidityPrefix16632;
    if(cached16584&&cached16584.mask===mask16584&&cached16584.w===w16584&&cached16584.h===h16584)return cached16584;
    const stride16584=w16584+1,prefix16584=new Uint32Array((w16584+1)*(h16584+1));
    for(let y16584=0;y16584<h16584;y16584++){
      let rowInvalid16584=0;
      const maskRow16584=y16584*w16584,prefixRow16584=(y16584+1)*stride16584,priorRow16584=y16584*stride16584;
      for(let x16584=0;x16584<w16584;x16584++){
        if(!mask16584[maskRow16584+x16584])rowInvalid16584++;
        prefix16584[prefixRow16584+x16584+1]=prefix16584[priorRow16584+x16584+1]+rowInvalid16584;
      }
    }
    const built16584={mask:mask16584,w:w16584,h:h16584,stride:stride16584,prefix:prefix16584};
    hy16584.__earthlineValidityPrefix16632=built16584;
    return built16584;
  }
  function earthlineRegionalSegmentValid16584(hy16584,a16584,b16584){
    if(!hy16584||!hy16584.validityMask16584)return true;
    const bounds16584=hy16584.bounds,w16584=hy16584.w,h16584=hy16584.h,
          sx16584=(w16584-1)/(bounds16584[2]-bounds16584[0]),
          sy16584=(h16584-1)/(bounds16584[3]-bounds16584[1]),
          rax16584=(a16584[0]-bounds16584[0])*sx16584,
          ray16584=(bounds16584[3]-a16584[1])*sy16584,
          rbx16584=(b16584[0]-bounds16584[0])*sx16584,
          rby16584=(bounds16584[3]-b16584[1])*sy16584,
          inBounds16584=rax16584>=0&&rax16584<=w16584-1&&ray16584>=0&&ray16584<=h16584-1&&rbx16584>=0&&rbx16584<=w16584-1&&rby16584>=0&&rby16584<=h16584-1,
          gax16584=inBounds16584?rax16584:Math.max(0,Math.min(w16584-1,rax16584)),
          gay16584=inBounds16584?ray16584:Math.max(0,Math.min(h16584-1,ray16584)),
          gbx16584=inBounds16584?rbx16584:Math.max(0,Math.min(w16584-1,rbx16584)),
          gby16584=inBounds16584?rby16584:Math.max(0,Math.min(h16584-1,rby16584)),
          steps16584=Math.max(2,Math.ceil(Math.hypot(gbx16584-gax16584,gby16584-gay16584)*4)),
          invSteps16584=1/steps16584,
          dx16584=rbx16584-rax16584,dy16584=rby16584-ray16584,
          mask16584=hy16584.validityMask16584;
    if(inBounds16584){
      const ax16584=Math.round(rax16584),ay16584=Math.round(ray16584),
            bx16584=Math.round(rbx16584),by16584=Math.round(rby16584),
            x016584=Math.min(ax16584,bx16584),x116584=Math.max(ax16584,bx16584),
            y016584=Math.min(ay16584,by16584),y116584=Math.max(ay16584,by16584),
            fast16584=earthlineRegionalValidityPrefix16584(hy16584);
      if(fast16584){
        const p16584=fast16584.prefix,s16584=fast16584.stride,
              invalid16584=p16584[(y116584+1)*s16584+x116584+1]-p16584[y016584*s16584+x116584+1]-p16584[(y116584+1)*s16584+x016584]+p16584[y016584*s16584+x016584];
        if(invalid16584===0)return true;
      }
      for(let s16584=0;s16584<=steps16584;s16584++){
        const t16584=s16584*invSteps16584,
              x16584=Math.round(rax16584+dx16584*t16584),
              y16584=Math.round(ray16584+dy16584*t16584);
        if(!mask16584[y16584*w16584+x16584])return false;
      }
      return true;
    }
    for(let s16584=0;s16584<=steps16584;s16584++){
      const t16584=s16584*invSteps16584,
            gx16584=Math.max(0,Math.min(w16584-1,rax16584+dx16584*t16584)),
            gy16584=Math.max(0,Math.min(h16584-1,ray16584+dy16584*t16584)),
            x16584=Math.round(gx16584),y16584=Math.round(gy16584);
      if(!mask16584[y16584*w16584+x16584])return false;
    }
    return true;
  }
`;

const out=src.slice(0,start)+replacement+src.slice(end);
if(out===src)throw new Error('No source change made.');
if((out.match(/function earthlineRegionalSegmentValid16584\(/g)||[]).length!==1)throw new Error('Segment-validity owner count changed.');
if((out.match(/function earthlineRegionalValidityPrefix16584\(/g)||[]).length!==1)throw new Error('16632 acceleration helper count is not one.');
if(!out.includes('EARTHLINE 16630 — SINGLE VALIDITY OWNER / NO DUPLICATE FLOW WALK'))throw new Error('16630 single-owner contract missing.');

/* Deterministic equivalence proof: the 16632 fast path may return early only when
   a superset rectangle contains no invalid cells. Otherwise it executes the exact
   prior 16631 sampler. Compare both verdicts over randomized masks and segments,
   including out-of-bounds inputs, before touching index.html. */
let seed=0x16632;
const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function prior(hy,a,b){
  if(!hy||!hy.validityMask16584)return true;
  const bounds=hy.bounds,w=hy.w,h=hy.h,sx=(w-1)/(bounds[2]-bounds[0]),sy=(h-1)/(bounds[3]-bounds[1]),
    rax=(a[0]-bounds[0])*sx,ray=(bounds[3]-a[1])*sy,rbx=(b[0]-bounds[0])*sx,rby=(bounds[3]-b[1])*sy,
    inside=rax>=0&&rax<=w-1&&ray>=0&&ray<=h-1&&rbx>=0&&rbx<=w-1&&rby>=0&&rby<=h-1,
    gax=inside?rax:Math.max(0,Math.min(w-1,rax)),gay=inside?ray:Math.max(0,Math.min(h-1,ray)),
    gbx=inside?rbx:Math.max(0,Math.min(w-1,rbx)),gby=inside?rby:Math.max(0,Math.min(h-1,rby)),
    steps=Math.max(2,Math.ceil(Math.hypot(gbx-gax,gby-gay)*4)),inv=1/steps,dx=rbx-rax,dy=rby-ray,mask=hy.validityMask16584;
  if(inside){for(let s=0;s<=steps;s++){const t=s*inv,x=Math.round(rax+dx*t),y=Math.round(ray+dy*t);if(!mask[y*w+x])return false;}return true;}
  for(let s=0;s<=steps;s++){const t=s*inv,gx=Math.max(0,Math.min(w-1,rax+dx*t)),gy=Math.max(0,Math.min(h-1,ray+dy*t)),x=Math.round(gx),y=Math.round(gy);if(!mask[y*w+x])return false;}return true;
}
function accelerated(hy,a,b){
  if(!hy||!hy.validityMask16584)return true;
  const bounds=hy.bounds,w=hy.w,h=hy.h,sx=(w-1)/(bounds[2]-bounds[0]),sy=(h-1)/(bounds[3]-bounds[1]),
    rax=(a[0]-bounds[0])*sx,ray=(bounds[3]-a[1])*sy,rbx=(b[0]-bounds[0])*sx,rby=(bounds[3]-b[1])*sy,
    inside=rax>=0&&rax<=w-1&&ray>=0&&ray<=h-1&&rbx>=0&&rbx<=w-1&&rby>=0&&rby<=h-1,
    gax=inside?rax:Math.max(0,Math.min(w-1,rax)),gay=inside?ray:Math.max(0,Math.min(h-1,ray)),
    gbx=inside?rbx:Math.max(0,Math.min(w-1,rbx)),gby=inside?rby:Math.max(0,Math.min(h-1,rby)),
    steps=Math.max(2,Math.ceil(Math.hypot(gbx-gax,gby-gay)*4)),inv=1/steps,dx=rbx-rax,dy=rby-ray,mask=hy.validityMask16584;
  if(inside){
    const stride=w+1,p=new Uint32Array((w+1)*(h+1));
    for(let y=0;y<h;y++){let row=0;for(let x=0;x<w;x++){if(!mask[y*w+x])row++;p[(y+1)*stride+x+1]=p[y*stride+x+1]+row;}}
    const ax=Math.round(rax),ay=Math.round(ray),bx=Math.round(rbx),by=Math.round(rby),x0=Math.min(ax,bx),x1=Math.max(ax,bx),y0=Math.min(ay,by),y1=Math.max(ay,by),
      invalid=p[(y1+1)*stride+x1+1]-p[y0*stride+x1+1]-p[(y1+1)*stride+x0]+p[y0*stride+x0];
    if(invalid===0)return true;
    for(let s=0;s<=steps;s++){const t=s*inv,x=Math.round(rax+dx*t),y=Math.round(ray+dy*t);if(!mask[y*w+x])return false;}return true;
  }
  for(let s=0;s<=steps;s++){const t=s*inv,gx=Math.max(0,Math.min(w-1,rax+dx*t)),gy=Math.max(0,Math.min(h-1,ray+dy*t)),x=Math.round(gx),y=Math.round(gy);if(!mask[y*w+x])return false;}return true;
}
for(let c=0;c<12000;c++){
  const w=4+Math.floor(rand()*21),h=4+Math.floor(rand()*21),mask=new Uint8Array(w*h);
  for(let i=0;i<mask.length;i++)mask[i]=rand()<0.16?0:1;
  const hy={bounds:[-74,42,-72,44],w,h,validityMask16584:mask};
  const a=[-74.4+rand()*2.8,41.6+rand()*2.8],b=[-74.4+rand()*2.8,41.6+rand()*2.8];
  const x=prior(hy,a,b),y=accelerated(hy,a,b);
  if(x!==y)throw new Error(`16632 equivalence failure at case ${c}: prior=${x} accelerated=${y}`);
}

fs.writeFileSync(path,out,'utf8');
console.log('16632 applied: exact empty-rectangle acceleration added inside the existing 16584 Regional validity owner; 12,000 deterministic verdict comparisons matched.');