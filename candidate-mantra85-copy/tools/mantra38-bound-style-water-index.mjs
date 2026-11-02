import fs from 'node:fs';
const path='index.html';
let s=fs.readFileSync(path,'utf8');

const replacements=[
  [
    'function earthlineLoadedStyleWaterIndex16584(mp16584){',
    'function earthlineLoadedStyleWaterIndex16584(mp16584,analysisBounds16584){'
  ],
  [
    '    let view16584=null;try{const vb16584=mp16584.getBounds&&mp16584.getBounds();if(vb16584)view16584=[vb16584.getWest(),vb16584.getSouth(),vb16584.getEast(),vb16584.getNorth()]}catch(_){view16584=null}',
    '    let view16584=Array.isArray(analysisBounds16584)&&analysisBounds16584.length===4&&analysisBounds16584.every(Number.isFinite)?analysisBounds16584.slice():null;\n    if(!view16584)try{const vb16584=mp16584.getBounds&&mp16584.getBounds();if(vb16584)view16584=[vb16584.getWest(),vb16584.getSouth(),vb16584.getEast(),vb16584.getNorth()]}catch(_){view16584=null}'
  ],
  [
    '      const ix016584=Math.floor(x016584*scale16584),ix116584=Math.floor(x116584*scale16584),iy016584=Math.floor(y016584*scale16584),iy116584=Math.floor(y116584*scale16584);',
    '      const bx016584=view16584?Math.max(x016584,view16584[0]):x016584,bx116584=view16584?Math.min(x116584,view16584[2]):x116584,by016584=view16584?Math.max(y016584,view16584[1]):y016584,by116584=view16584?Math.min(y116584,view16584[3]):y116584;\n      const ix016584=Math.floor(bx016584*scale16584),ix116584=Math.floor(bx116584*scale16584),iy016584=Math.floor(by016584*scale16584),iy116584=Math.floor(by116584*scale16584);'
  ],
  [
    'hy.styleWaterIndex16584=earthlineLoadedStyleWaterIndex16584(map());',
    'hy.styleWaterIndex16584=earthlineLoadedStyleWaterIndex16584(map(),hy.bounds);'
  ]
];
for(const [from,to] of replacements){
  if(!s.includes(from))throw new Error('Expected 16584 index block not found: '+from.slice(0,90));
  s=s.replace(from,to);
}
fs.writeFileSync(path,s);
console.log('Bound existing 16584 loaded-water spatial index to hydrology analysis bounds; no owner added.');
