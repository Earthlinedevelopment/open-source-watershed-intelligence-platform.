import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const file='index.html';
const s=readFileSync(file,'utf8');
const prior=createHash('sha256').update(s).digest('hex');
function onlyOnce(hay,needle,label){
 const count=hay.split(needle).length-1;
 if(count!==1)throw Error(label+': expected exactly once, found '+count);
}
const styleName='<style id="earthline-regional-16060-css">';
onlyOnce(s,styleName,'regional visibility stylesheet');
const styleStart=s.indexOf(styleName),styleEnd=s.indexOf('</style>',styleStart);
if(styleEnd<0)throw Error('Regional CSS not closed');
const region=s.slice(styleStart,styleEnd);
const blockStart=region.indexOf('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="rgba(8,18,13,.96)"]');
const blockEnd=region.indexOf('#earthlineSwaleLegend16050',blockStart);
if(blockStart<0||blockEnd<blockStart||!region.slice(blockStart,blockEnd).includes('stroke-width:18px!important')||
 !region.slice(blockStart,blockEnd).includes('stroke-width:12.5px!important'))
  throw Error('Unexpected newer hard-width CSS owner');
const cleanRegion=region.slice(0,blockStart)+
 '/* M92 correction: respect the renderer\\'s zoom-scaled, per-feature stroke widths.\\n'+
 '   Hard 18px/12.5px !important widths turned subpixel swales into opaque black discs. */\\n'+
 region.slice(blockEnd);
let changed=s.slice(0,styleStart)+cleanRegion+s.slice(styleEnd);
const oldWidth="const casing=grade==='A'?15:grade==='B'?12:9,core=grade==='A'?9.2:grade==='B'?7.2:5.2;";
onlyOnce(changed,oldWidth,'Regional unscaled width');
const newWidth="const regionalZoom=Number(map?.getZoom?.()||6),regionalScale=regionalZoom<7?0.46:(regionalZoom<8?0.62:(regionalZoom<9?0.78:1)),casing=(grade==='A'?15:grade==='B'?12:9)*regionalScale,core=(grade==='A'?9.2:grade==='B'?7.2:5.2)*regionalScale;";
changed=changed.replace(oldWidth,newWidth);
const oldPaths=[
"addPath(sg,pts,{stroke:'rgba(8,18,13,.96)','stroke-width':String(casing),'stroke-linecap':'round','stroke-linejoin':'round'});",
"addPath(sg,pts,{class:'earthline-swale-core-16168','data-swale-index':String(swales),stroke:main,'stroke-width':String(core),'stroke-linecap':'round','stroke-linejoin':'round',filter:'url(#elGlow16020)'});",
"addPath(sg,pts,{stroke:light,'stroke-width':grade==='A'?'1.8':'1.2','stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':grade==='C'?'6 9':'10 7'});"
].join('\n');
onlyOnce(changed,oldPaths,'Regional path trio');
const newPaths=[
"if(len<2.5){",
"  /* A short, valid corridor occupies less than 2.5 screen pixels at statewide zoom.",
"     Keep its source/core/interaction owner, without an 18px black round-capped disc. */",
"  addPath(sg,pts,{class:'earthline-swale-core-16168','data-swale-index':String(swales),stroke:main,'stroke-width':'1.4','stroke-linecap':'round','stroke-linejoin':'round'});",
"}else{",
"  addPath(sg,pts,{stroke:'rgba(8,18,13,.96)','stroke-width':String(casing),'stroke-linecap':'round','stroke-linejoin':'round'});",
"  addPath(sg,pts,{class:'earthline-swale-core-16168','data-swale-index':String(swales),stroke:main,'stroke-width':String(core),'stroke-linecap':'round','stroke-linejoin':'round',filter:'url(#elGlow16020)'});",
"  addPath(sg,pts,{stroke:light,'stroke-width':String((grade==='A'?1.8:1.2)*regionalScale),'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':grade==='C'?'6 9':'10 7'});",
"}"
].join('\n');
changed=changed.replace(oldPaths,newPaths);
if(!changed.includes("const capM92=2000")||!changed.includes("metricLengthM92>=250&&metricLengthM92<=4005"))
 throw Error('Scientific recovery not present in target candidate');
if(changed.includes('stroke-width:18px!important'))throw Error('Hard-width Regional marker leak remains');
const after=createHash('sha256').update(changed).digest('hex');
writeFileSync(file,changed);
console.log('M92_VISUAL_CORRECTION '+JSON.stringify({prior,after,
 fix:'remove 18px CSS override and scale Region paths by zoom; preserve subpixel core paths',
 changedCharacters:changed.length-s.length,
 slopeRuleUnchanged:true,sourceGeometryUnchanged:true,
 propertyRendererUnchanged:true,searchOrbUnchanged:true}));
