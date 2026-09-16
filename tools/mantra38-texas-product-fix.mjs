import fs from 'node:fs';
const path=process.argv[2]||'index.html';
let s=fs.readFileSync(path,'utf8');
const changes=[];
function replaceExact(oldText,newText,label){
  const n=s.split(oldText).length-1;
  if(n!==1)throw new Error(`${label}: expected 1 anchor, found ${n}`);
  s=s.replace(oldText,newText);changes.push(label);
}
replaceExact(
  `return labels>0&&waterPaths>0&&nativeWater.ready&&swales>0&&gradeCounts.A>0&&gradeLabels.length>0;`,
  `return labels>0&&waterPaths>0&&nativeWater.ready&&swales>0&&gradeLabels.length>0;`,
  'regional renderer accepts valid B/C-only corridor results'
);
replaceExact(
`      try{\n        earthlineMap.jumpTo({center:[-102,20],zoom:0,bearing:0,pitch:0});\n        earthlineUpdateGlobePresentation();\n      }catch(e){}`,
`      try{\n        /* MANTRA 38 — the Map constructor already owns the startup globe camera.\n           Do not reset a search/Regional camera if map load completes after analysis begins. */\n        earthlineUpdateGlobePresentation();\n      }catch(e){}`,
  'remove late startup camera reset race'
);
fs.writeFileSync(path,s);
console.log(JSON.stringify({path,changes,count:changes.length}));
