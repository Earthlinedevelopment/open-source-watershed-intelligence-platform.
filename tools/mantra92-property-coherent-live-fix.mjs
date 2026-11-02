import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const file='index.html';
const original=readFileSync(file,'utf8');
const sha=v=>createHash('sha256').update(v).digest('hex');
const unique=(src,needle,label)=>{
 const n=src.split(needle).length-1;
 if(n!==1)throw Error(label+' found '+n+' times, expected 1');
};
const marker='<script id="earthline-build-16172-js">';
unique(original,marker,'terminal property controller');
const oldReady='constructionReady:!isRegionalTile15769,';
unique(original,oldReady,'construction readiness metadata');
let s=original.replace(oldReady,'constructionReady:false, /* M92 screening is never construction approval */');
const ctrlStart=s.indexOf(marker),ctrlEnd=s.indexOf('</script>',ctrlStart);
if(ctrlStart<0||ctrlEnd<0)throw Error('Terminal controller not closed');
let prop=s.slice(ctrlStart,ctrlEnd);
const oldCount='if(count>0&&texture.ok){const d=Number(texture.directional||0),n=Number(texture.neutral||0),authoritative16516=';
unique(prop,oldCount,'natural texture status count');
prop=prop.replace(oldCount,'if(count>0&&texture.ok){const d=Math.max(0,Math.min(count,Number(texture.directional||0))),n=Math.max(0,Math.min(Math.max(0,count-d),Number(texture.neutral||0))),authoritative16516=');
const helperMark="  function status(msg,kind='pending'){";
unique(prop,helperMark,'Property status owner');
const helper=[
"  /* M92: sparse result must explain a steep site without inventing corridors. */",
"  function sparseTerrainExplanationM92(){",
"    try{",
"      const m=model(),features=m?.authoritativeSafeSwales15815?.features;",
"      if(!Array.isArray(features)||features.length>3||!m?.inP||",
"         typeof GW!=='number'||typeof GH!=='number'||typeof slopePct!=='function')return '';",
"      let surveyed=0,aboveLimit=0;",
"      const step=3;",
"      for(let y=1;y<GH-1;y+=step)for(let x=1;x<GW-1;x+=step){",
"        if(!m.inP[y*GW+x])continue;",
"        surveyed++;const slope=Number(slopePct(x,y));",
"        if(Number.isFinite(slope)&&slope>4)aboveLimit++;",
"      }",
"      if(surveyed<30||aboveLimit/surveyed<.65)return '';",
"      return ' Limited opportunity: approximately '+Math.round(100*aboveLimit/surveyed)+",
"        '% of sampled terrain exceeds the 4% slope ceiling. This is site screening, not a construction design; field verification required.';",
"    }catch(_){return ''}",
"  }",
""
].join('\n');
prop=prop.replace(helperMark,helper+helperMark);
const messageOriginal="if(p){p.textContent=String(msg||'');p.dataset.kind=kind}";
unique(prop,messageOriginal,'status writer');
prop=prop.replace(messageOriginal,
"if(p){let message=String(msg||'');if(message.startsWith('Property detail published'))message+=sparseTerrainExplanationM92();p.textContent=message;p.dataset.kind=kind}");
s=s.slice(0,ctrlStart)+prop+s.slice(ctrlEnd);
const sourceShow="const show=centers.length>0&&footprints.length===centers.length&&directional.length+neutral.length===centers.length;";
unique(s,sourceShow,'texture visibility gate');
s=s.replace(sourceShow,
"const safeCountM92=authoritativeFC()?.features?.length??0;const show=centers.length>0&&centers.length===safeCountM92&&footprints.length===centers.length&&directional.length+neutral.length===centers.length;");
if(s.includes('constructionReady:!isRegionalTile15769')||!s.includes('function sparseTerrainExplanationM92()')||
  !s.includes('const safeCountM92=authoritativeFC()?.features?.length??0'))
  throw Error('Missing mandatory Property correction');
const originalScience='function earthlinePathPointUsable(px,py,maxS)';
const scienceEnd='function drawRegionalPriority(thr)';
const extract=(t)=>t.slice(t.indexOf(originalScience),t.indexOf(scienceEnd,t.indexOf(originalScience)));
if(extract(original)!==extract(s))throw Error('Property science exclusion owner changed');
const sourceOwner='async function makeSwales(';
const sourceStop='return swaleCollectionM90;';
const expr=t=>t.slice(t.indexOf(sourceOwner),t.indexOf(sourceStop,t.indexOf(sourceOwner))+sourceStop.length);
if(expr(original)!==expr(s))throw Error('Regional science changed');
writeFileSync(file,s);
console.log('M92_PROPERTY_COHERENT_PATCH '+JSON.stringify({before:sha(original),after:sha(s),
  changes:['no false construction-ready','bounded oriented-corridor counts','stale natural texture failover',
           'sampled steep-terrain explanation'],
  scientificModelUnchanged:true,regionalRendererUnchanged:true,logoAndOrbUnchanged:true}));
