import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let s=readFileSync(p,'utf8');

const oldGeom="},geometry:{type:'LineString',coordinates:c.segment}});";
const newGeom="},geometry:{type:'LineString',coordinates:(()=>{if(focusMode||!Array.isArray(c.segment)||c.segment.length<3)return c.segment;const pts=c.segment,mid=Math.floor((pts.length-1)/2),R=6371008.8,dist=(a,b)=>{const p1=Number(a[1])*Math.PI/180,p2=Number(b[1])*Math.PI/180,dp=(Number(b[1])-Number(a[1]))*Math.PI/180,dl=(Number(b[0])-Number(a[0]))*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))};let l=mid,r=mid,lm=0,rm=0;while(l>0){const d=dist(pts[l],pts[l-1]);if(lm+d>2000)break;l--;lm+=d}while(r<pts.length-1){const d=dist(pts[r],pts[r+1]);if(rm+d>2000)break;r++;rm+=d}if(l===r){if(r<pts.length-1)r++;else if(l>0)l--}return pts.slice(l,r+1)})()}});";

const oldY1="if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();";
const newY1="if((++yieldCount16661%96)===0)await earthlineCooperativeYield16661();";
const oldY2="if((++finalScreenYield16661%12)===0)await earthlineCooperativeYield16661();";
const newY2="if((++finalScreenYield16661%96)===0)await earthlineCooperativeYield16661();";

for(const [a,b,label] of [[oldGeom,newGeom,'geometry'],[oldY1,newY1,'yield1'],[oldY2,newY2,'yield2']]){
  if(s.includes(a)) s=s.replace(a,b);
  else if(!s.includes(b)) throw new Error('missing '+label+' owner');
}
writeFileSync(p,s);
console.log('M83_LIVE_FUNCTIONAL_CORRECTIONS_APPLIED');
