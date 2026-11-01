import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let s=readFileSync(p,'utf8');

const renderOwner="function render(data){";
const helper="function earthlineRegionalLocalDisplay16020(coords,maxHalfM=2000){if(!Array.isArray(coords)||coords.length<3)return coords;const mid=Math.floor((coords.length-1)/2),R=6371008.8,dist=(a,b)=>{const p1=Number(a[1])*Math.PI/180,p2=Number(b[1])*Math.PI/180,dp=(Number(b[1])-Number(a[1]))*Math.PI/180,dl=(Number(b[0])-Number(a[0]))*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))};let l=mid,r=mid,lm=0,rm=0;while(l>0){const d=dist(coords[l],coords[l-1]);if(!Number.isFinite(d)||lm+d>maxHalfM)break;l--;lm+=d}while(r<coords.length-1){const d=dist(coords[r],coords[r+1]);if(!Number.isFinite(d)||rm+d>maxHalfM)break;r++;rm+=d}if(l===r){if(r<coords.length-1)r++;else if(l>0)l--}return coords.slice(l,r+1)}\n  ";
const oldRender="const pts=points(f.geometry.coordinates),len=polyLength(pts),activeTier=activeTier16168();";
const newRender="const activeTier=activeTier16168(),rawCoords=f.geometry.coordinates,renderCoords=activeTier==='focus'?rawCoords:earthlineRegionalLocalDisplay16020(rawCoords),pts=points(renderCoords),len=polyLength(pts);";

if(!s.includes("function earthlineRegionalLocalDisplay16020(")){
  if(!s.includes(renderOwner))throw new Error('renderer owner missing');
  s=s.replace(renderOwner,helper+renderOwner);
}
if(s.includes(oldRender))s=s.replace(oldRender,newRender);
else if(!s.includes(newRender))throw new Error('renderer swale line owner missing');

writeFileSync(p,s);
console.log('M83_RENDERER_ONLY_GEOMETRY_APPLIED');
