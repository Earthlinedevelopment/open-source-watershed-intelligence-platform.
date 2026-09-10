import fs from 'node:fs';
const path='index.html';
let s=fs.readFileSync(path,'utf8');
const old1=`    if(!focusMode){
      if(w<1.8){const d=(1.8-w)/2;b[0]-=d;b[2]+=d;}
      if(h<1.8){const d=(1.8-h)/2;b[1]-=d;b[3]+=d;}
      w=b[2]-b[0];h=b[3]-b[1];
    }else{`;
const new1=`    if(!focusMode){
      /* EARTHLINE 16605 — preserve compact country extents. The former universal
         1.8-degree floor diluted small islands into mostly-ocean 96x96 grids. */
      const minSpan16605=pt==='country'?.02:1.8;
      if(w<minSpan16605){const d=(minSpan16605-w)/2;b[0]-=d;b[2]+=d;}
      if(h<minSpan16605){const d=(minSpan16605-h)/2;b[1]-=d;b[3]+=d;}
      w=b[2]-b[0];h=b[3]-b[1];
    }else{`;
const old2=`    if(w>18){const c=(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}`;
const new2=`    if(w>18){const c=pt==='country'&&Number.isFinite(lng)?lng:(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=pt==='country'&&Number.isFinite(lat)?lat:(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}`;
for(const [oldText,newText,label] of [[old1,new1,'compact country minimum span'],[old2,new2,'country-centered maximum span']]){
  const count=s.split(oldText).length-1;
  if(count!==1)throw new Error(`${label} target count ${count}, expected 1`);
  s=s.replace(oldText,newText);
}
if(!s.includes('lineSafe16584(retrySmooth16584)'))throw new Error('16603 containment missing');
if(!s.includes('regional land-validity flow audit failed: '))throw new Error('land-validity audit missing');
fs.writeFileSync(path,s);
console.log('16605 applied: compact country bboxes preserve terrain resolution; large country caps center on authoritative geocoder center.');
