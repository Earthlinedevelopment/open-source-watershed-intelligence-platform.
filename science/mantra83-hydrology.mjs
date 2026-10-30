// Mantra 83 forensic hydrology core — NON-PRODUCTION.
// One deterministic Priority-Flood + D8 implementation for both Property and Regional.

export const HYDROLOGY_VERSION='m83-hydrology-1';
export const FILL_EPSILON_M=0.0008;

const DIRS=Object.freeze([
  [-1,-1],[0,-1],[1,-1],
  [-1,0],        [1,0],
  [-1,1], [0,1], [1,1]
]);

class MinHeap{
  constructor(){this.a=[];}
  push(item){
    const a=this.a;a.push(item);let i=a.length-1;
    while(i){
      const p=(i-1)>>1;
      if(a[p].z<item.z || (a[p].z===item.z && a[p].i<=item.i))break;
      a[i]=a[p];i=p;
    }
    a[i]=item;
  }
  pop(){
    const a=this.a;if(!a.length)return null;
    const root=a[0],last=a.pop();
    if(a.length){
      let i=0;
      while(true){
        let l=i*2+1,r=l+1;if(l>=a.length)break;
        let c=r<a.length&&(a[r].z<a[l].z||(a[r].z===a[l].z&&a[r].i<a[l].i))?r:l;
        if(a[c].z>last.z || (a[c].z===last.z&&a[c].i>=last.i))break;
        a[i]=a[c];i=c;
      }
      a[i]=last;
    }
    return root;
  }
  get length(){return this.a.length;}
}

export function priorityFlood(elevation,width,height,{validMask=null,epsilonM=FILL_EPSILON_M}={}){
  const N=width*height;
  if(!elevation||elevation.length!==N)throw new Error('invalid elevation grid');
  if(validMask&&validMask.length!==N)throw new Error('invalid validity mask');
  const original=Float64Array.from(elevation,Number);
  const filled=Float64Array.from(elevation,Number);
  const seen=new Uint8Array(N);
  const heap=new MinHeap();
  const valid=i=>!validMask||!!validMask[i];

  const add=i=>{
    if(i<0||i>=N||seen[i]||!valid(i)||!Number.isFinite(filled[i]))return;
    seen[i]=1;heap.push({i,z:filled[i]});
  };

  if(validMask){
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=y*width+x;if(!valid(i))continue;
      let outlet=x===0||y===0||x===width-1||y===height-1;
      if(!outlet){
        for(const [dx,dy] of DIRS){
          const xx=x+dx,yy=y+dy;
          if(xx<0||yy<0||xx>=width||yy>=height||!valid(yy*width+xx)){outlet=true;break;}
        }
      }
      if(outlet)add(i);
    }
  }else{
    for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}
    for(let y=1;y<height-1;y++){add(y*width);add(y*width+width-1);}
  }

  while(heap.length){
    const p=heap.pop(),x=p.i%width,y=(p.i/width)|0;
    for(const [dx,dy] of DIRS){
      const xx=x+dx,yy=y+dy;
      if(xx<0||yy<0||xx>=width||yy>=height)continue;
      const j=yy*width+xx;
      if(seen[j]||!valid(j)||!Number.isFinite(filled[j]))continue;
      seen[j]=1;
      if(filled[j]<=p.z)filled[j]=p.z+epsilonM;
      heap.push({i:j,z:filled[j]});
    }
  }

  const pondDepth=new Float64Array(N);
  for(let i=0;i<N;i++)pondDepth[i]=valid(i)&&Number.isFinite(original[i])?Math.max(0,filled[i]-original[i]):NaN;
  return {filled,pondDepth};
}

export function d8Flow(filled,width,height,{validMask=null,cellXM=1,cellYM=1}={}){
  const N=width*height;
  if(!filled||filled.length!==N)throw new Error('invalid filled grid');
  if(validMask&&validMask.length!==N)throw new Error('invalid validity mask');
  const valid=i=>!validMask||!!validMask[i];
  const to=new Int32Array(N);to.fill(-1);
  const slopePct=new Float64Array(N);if(validMask)slopePct.fill(NaN);

  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
    const i=y*width+x;if(!valid(i)||!Number.isFinite(filled[i]))continue;
    let best=-1,bestDrop=0;
    for(const [dx,dy] of DIRS){
      const j=(y+dy)*width+(x+dx);
      if(!valid(j)||!Number.isFinite(filled[j]))continue;
      const distance=Math.hypot(dx*cellXM,dy*cellYM);
      const drop=(filled[i]-filled[j])/distance;
      if(drop>bestDrop){bestDrop=drop;best=j;}
    }
    to[i]=best;slopePct[i]=bestDrop*100;
  }

  const order=[];
  for(let i=0;i<N;i++)if(valid(i)&&Number.isFinite(filled[i]))order.push(i);
  order.sort((a,b)=>(filled[b]-filled[a])||(a-b));
  const accumulation=new Float64Array(N);
  if(validMask){accumulation.fill(NaN);for(const i of order)accumulation[i]=1;}
  else accumulation.fill(1);
  for(const i of order){
    const j=to[i];
    if(j>=0&&valid(j))accumulation[j]+=accumulation[i];
  }
  return {to,slopePct,accumulation};
}

export function hydrology(elevation,width,height,options={}){
  const flood=priorityFlood(elevation,width,height,options);
  const flow=d8Flow(flood.filled,width,height,options);
  return Object.freeze({
    version:HYDROLOGY_VERSION,
    fillEpsilonM:Number(options.epsilonM??FILL_EPSILON_M),
    width,height,
    filled:flood.filled,
    pondDepth:flood.pondDepth,
    to:flow.to,
    slopePct:flow.slopePct,
    accumulation:flow.accumulation
  });
}
