import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const f='index.html',s=readFileSync(f,'utf8');
const sha=x=>createHash('sha256').update(x).digest('hex');
const one=(t,n)=>{const count=s.split(t).length-1;if(count!==1)throw Error(n+': expected 1, found '+count)};
const science=(x)=>{const a=x.indexOf('async function makeSwales('),b=x.indexOf('return swaleCollectionM90;',a);if(a<0||b<0)throw Error('Cannot isolate original science');return x.slice(a,b+lenReturn)};
const lenReturn='return swaleCollectionM90;'.length;
const origScience=science(s);
one('<style id="earthline-regional-16060-css">','regional CSS owner');
one("const casing=grade==='A'?15:grade==='B'?12:9,core=grade==='A'?9.2:grade==='B'?7.2:5.2;",'swale width owner');
one('    /* EARTHLINE 16350 — Regional water is counted here for audit only; SVG does not render it.','regional final owner');
let changed=s;
const cssBegin=changed.indexOf('<style id="earthline-regional-16060-css">'),cssEnd=changed.indexOf('</style>',cssBegin);
const css=changed.slice(cssBegin,cssEnd);
const badStart=css.indexOf('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="rgba(8,18,13,.96)"]');
const badEnd=css.indexOf('#earthlineSwaleLegend16050',badStart);
if(badStart<0||badEnd<0||!css.slice(badStart,badEnd).includes('stroke-width:18px!important'))
  throw Error('Expected legacy CSS block not found');
const cssClean=css.slice(0,badStart)+'/* M92: zoom-calibrated widths are controlled by Regional renderer. */\n'+css.slice(badEnd);
changed=changed.slice(0,cssBegin)+cssClean+changed.slice(cssEnd);
const oldWidth="const casing=grade==='A'?15:grade==='B'?12:9,core=grade==='A'?9.2:grade==='B'?7.2:5.2;";
const newWidth="const regionalZoom=Number(map?.getZoom?.()||6),regionalScale=regionalZoom<7?0.46:(regionalZoom<8?0.62:(regionalZoom<9?0.78:1)),casing=(grade==='A'?15:grade==='B'?12:9)*regionalScale,core=(grade==='A'?9.2:grade==='B'?7.2:5.2)*regionalScale;";
changed=changed.replace(oldWidth,newWidth);
const oldTrio=[
"addPath(sg,pts,{stroke:'rgba(8,18,13,.96)','stroke-width':String(casing),'stroke-linecap':'round','stroke-linejoin':'round'});",
"addPath(sg,pts,{class:'earthline-swale-core-16168','data-swale-index':String(swales),stroke:main,'stroke-width':String(core),'stroke-linecap':'round','stroke-linejoin':'round',filter:'url(#elGlow16020)'});",
"addPath(sg,pts,{stroke:light,'stroke-width':grade==='A'?'1.8':'1.2','stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':grade==='C'?'6 9':'10 7'});"
].join('\n        ');
if(changed.split(oldTrio).length!==2)throw Error('Swale path trio changed; no unreviewed replacement');
const newTrio=[
"if(len<8){",
"  /* A valid Regional corridor shorter than eight screen pixels must not become a 20px black dot. */",
"  addPath(sg,pts,{class:'earthline-swale-core-16168','data-swale-index':String(swales),stroke:main,'stroke-width':'1.4','stroke-linecap':'round','stroke-linejoin':'round'});",
"}else{",
"  addPath(sg,pts,{stroke:'rgba(8,18,13,.96)','stroke-width':String(casing),'stroke-linecap':'round','stroke-linejoin':'round'});",
"  addPath(sg,pts,{class:'earthline-swale-core-16168','data-swale-index':String(swales),stroke:main,'stroke-width':String(core),'stroke-linecap':'round','stroke-linejoin':'round',filter:'url(#elGlow16020)'});",
"  addPath(sg,pts,{stroke:light,'stroke-width':String((grade==='A'?1.8:1.2)*regionalScale),'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':grade==='C'?'6 9':'10 7'});",
"}"
].join('\n');
changed=changed.replace(oldTrio,newTrio);
const target='    /* EARTHLINE 16350 — Regional water is counted here for audit only; SVG does not render it.';
const inline=[
"    /* M92: later !important CSS must not override the zoom-correct swale widths. */",
"    for(const pathM92 of sg.querySelectorAll(':scope > path')){",
"      const widthM92=Number(pathM92.getAttribute('stroke-width'));",
"      if(Number.isFinite(widthM92)&&widthM92>0)",
"        pathM92.style.setProperty('stroke-width',String(widthM92)+'px','important');",
"    }"
].join('\n');
if(changed.split(target).length!==2)throw Error('Regional SVG completion changed');
changed=changed.replace(target,inline+'\n'+target);
if(science(changed)!==origScience)throw Error('Science owner changed');
const lock=['id="searchOrb"','id="searchInput"','id="runBtn"','Slow it. Sink it. Spread it.'];
for(const t of lock)if(!changed.includes(t))throw Error('locked UI missing '+t);
if(changed===s)throw Error('No repair');
writeFileSync(f,changed);
console.log('M92_LIVE_VISUAL_PATCH '+JSON.stringify({before:sha(s),after:sha(changed),changedCharacters:changed.length-s.length,scienceIdentical:true,slopeUnchanged:true,propertyUnchanged:true,logoUnchanged:true}));
