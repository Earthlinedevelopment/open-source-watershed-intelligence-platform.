import fs from 'node:fs';
const path='index.html';
let s=fs.readFileSync(path,'utf8');
const old1="const coords=earthlineRegionalSmoothFlow16584(hy,raw);if(coords.length<8)return false;";
const new1="const coords=earthlineRegionalSmoothFlow16584(hy,raw);if(coords.length<5)return false;";
const old2="const desired=Math.max(3,Math.min(12,Math.floor(coords.length/14))),stride=(coords.length-1)/(desired+1);";
const new2="const desired=Math.max(1,Math.min(12,Math.floor((coords.length-1)/5)||1)),stride=(coords.length-1)/(desired+1);";
for(const [oldText,newText,label] of [[old1,new1,'minimum flow length'],[old2,new2,'arrow density']]){
  const count=s.split(oldText).length-1;
  if(count!==1)throw new Error(`${label} target count ${count}, expected 1`);
  s=s.replace(oldText,newText);
}
if(!s.includes('lineSafe16584(retrySmooth16584)'))throw new Error('16603 containment missing');
if(!s.includes('regional land-validity flow audit failed: '))throw new Error('land-validity audit missing');
fs.writeFileSync(path,s);
console.log('16604 applied: short valid flow traces retained; arrow count scales to available geometry.');
