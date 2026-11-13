import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('index.html','utf8');
const rows=html.split('\n');
const visible=rows.find(x=>x.trimStart().startsWith('function visible(id,on){const mp=map();try{if(mp?.getLayer?.(id)){const next='));
const width=rows.find(x=>x.trimStart().startsWith('function applyWidth(){const mp=map(),w=widthPx();lastWidth=w;try{for('));
assert.ok(visible&&width,'Fail closed: expected current functions unavailable');
const getCalls=[],layoutWrites=[],paintWrites=[];
const currentLayout={a:'visible',casing:'visible',neutral:'visible',up:'visible',flip:'visible'};
const currentPaint={};
const ids={casing:'casing',neutral:'neutral',up:'up',flip:'flip'};
let px=8.2;
const map=()=>({
 getLayer:id=>!!currentLayout[id],
 getLayoutProperty:(id,p)=>currentLayout[id],
 setLayoutProperty:(id,p,val)=>{layoutWrites.push([id,p,val]);currentLayout[id]=val},
 getPaintProperty:(id,p)=>currentPaint[id],
 setPaintProperty:(id,p,val)=>{paintWrites.push([id,p,val]);currentPaint[id]=val}
});
const obj=new Function('map','LAYERS','widthPx','let lastWidth=0;\n'+visible+'\n'+width+'\nreturn {visible,applyWidth};')(map,ids,()=>px);
obj.visible('a',true);
assert.equal(layoutWrites.length,0,'Visible layer need not be rewritten');
obj.visible('a',false);obj.visible('a',false);
assert.equal(layoutWrites.length,1,'Repeated hide must issue one write');
obj.visible('a',true);obj.visible('a',true);
assert.equal(layoutWrites.length,2,'Repeated show must issue one write');
obj.applyWidth();assert.equal(paintWrites.length,4,'First initialization writes four widths');
obj.applyWidth();assert.equal(paintWrites.length,4,'No width writes at unchanged zoom');
px=10.5;obj.applyWidth();assert.equal(paintWrites.length,8,'Zoom width changes exactly once per layer');
obj.applyWidth();assert.equal(paintWrites.length,8,'Resting zoom has no redundant paint writes');
console.log('MANTRA6_PROPERTY_RENDERER_IDEMPOTENCE_PASS',JSON.stringify({layoutWrites:layoutWrites.length,paintWrites:paintWrites.length,unchangedScience:true}));
