import fs from 'node:fs';
const path='index.html';
let s=fs.readFileSync(path,'utf8');
const new1=`    if(!focusMode){
      /* EARTHLINE 16605 — preserve compact country extents. The former universal
         1.8-degree floor diluted small islands into mostly-ocean 96x96 grids. */
      const minSpan16605=pt==='country'?.02:1.8;
      if(w<minSpan16605){const d=(minSpan16605-w)/2;b[0]-=d;b[2]+=d;}
      if(h<minSpan16605){const d=(minSpan16605-h)/2;b[1]-=d;b[3]+=d;}
      w=b[2]-b[0];h=b[3]-b[1];
    }else{`;
const old1=`    if(!focusMode){
      if(w<1.8){const d=(1.8-w)/2;b[0]-=d;b[2]+=d;}
      if(h<1.8){const d=(1.8-h)/2;b[1]-=d;b[3]+=d;}
      w=b[2]-b[0];h=b[3]-b[1];
    }else{`;
const new2=`    if(w>18){const c=pt==='country'&&Number.isFinite(lng)?lng:(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=pt==='country'&&Number.isFinite(lat)?lat:(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}`;
const old2=`    if(w>18){const c=(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}`;
for(const [from,to,label] of [[new1,old1,'compact country minimum span'],[new2,old2,'country-centered maximum span']]){
  const count=s.split(from).length-1;
  if(count!==1)throw new Error(`${label} source count ${count}, expected 1`);
  s=s.replace(from,to);
}
if(s.includes('EARTHLINE 16605'))throw new Error('16605 marker remains');
if(!s.includes('lineSafe16584(retrySmooth16584)'))throw new Error('16603 containment missing');
if(!s.includes('regional land-validity flow audit failed: '))throw new Error('land-validity audit missing');
fs.writeFileSync(path,s);
console.log('16605 reverted exactly; 16603 containment preserved.');
