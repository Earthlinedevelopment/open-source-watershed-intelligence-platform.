import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';

const OLD='274a7b63a3d1381a7010aa4fbccd320e156b9314';
const show=(path)=>execFileSync('git',['show',OLD+':'+path],{encoding:'utf8',maxBuffer:120*1024*1024});

const launch=show('earthline-launch-16872.js');
const a=launch.indexOf('/* EARTHLINE_ELDER_TREES_V1_17097');
const b=launch.indexOf('/* EARTHLINE 17121',a);
if(a<0||b<0)throw new Error('Elder module boundaries not found');
const module=launch.slice(a,b).trim()+"\n";
writeFileSync('earthline-elder-restored-17097.js',module);

const worker=show('earthline-elder-worker-17129.js');
writeFileSync('earthline-elder-worker-17129.js',worker);

const paths=execFileSync('git',['ls-tree','-r','--name-only',OLD,'data/elder-trees'],{encoding:'utf8'})
  .split(/\r?\n/).filter(Boolean);
if(!paths.length)throw new Error('Elder data tree missing');
for(const path of paths){
  mkdirSync(dirname(path),{recursive:true});
  const content=show(path);
  writeFileSync(path,content);
}

const p='index.html';
let s=readFileSync(p,'utf8');
if(!s.includes('earthline-elder-restored-17097.js')){
  const tag='\n<script src="earthline-elder-restored-17097.js?v=17097-restored"></script>\n';
  const at=s.toLowerCase().lastIndexOf('</body>');
  if(at<0)throw new Error('body close not found');
  s=s.slice(0,at)+tag+s.slice(at);
}

const decl="window.EARTHLINE_PROPERTY_DECLARATION_16169={build:BUILD,center:{lng:site.lng,lat:site.lat},acres:20,boundaryPoints:m.analysisBoundaryLngLat.length,selectedCode:selectedCode||null,declaredAt:new Date().toISOString(),route:'window.earthlineGovernedPropertyRun16202'};";
if(s.includes(decl) && !s.includes('EARTHLINE_PROPERTY_ELDER_RESTORE_17097')){
  s=s.replace(decl,decl+"\n    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){} /* EARTHLINE_PROPERTY_ELDER_RESTORE_17097 */");
}

const pending="settlePropertyMapVisibility16260(count,texture,serial);\n        return true;";
if(s.includes(pending)){
  s=s.replace(pending,"settlePropertyMapVisibility16260(count,texture,serial);\n        try{window.EARTHLINE_ELDER_TREES_V1_17097?.refresh?.()}catch(_){} /* EARTHLINE_ELDER_REFRESH_RESTORE_17097 */\n        return true;");
}

const final="setAudit({stage:'published',stageLabel:'published',settled:true,result:true,timedOut:false,corridors:count,renderVerified,renderMode:texture.ok?'natural-texture':(safeFallback.ok?'authoritative-safe-lines':'verified-zero'),sourceEvidence:propertyEvidenceSnapshot16206(),publicationAudit:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,safeFallback,texture,stageTimings:Object.assign({},m.lastTiming||{}),elapsedSeconds:Math.round((performance.now()-started)/1000),settledAt:new Date().toISOString()});return true;";
if(s.includes(final)){
  s=s.replace(final,"setAudit({stage:'published',stageLabel:'published',settled:true,result:true,timedOut:false,corridors:count,renderVerified,renderMode:texture.ok?'natural-texture':(safeFallback.ok?'authoritative-safe-lines':'verified-zero'),sourceEvidence:propertyEvidenceSnapshot16206(),publicationAudit:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,safeFallback,texture,stageTimings:Object.assign({},m.lastTiming||{}),elapsedSeconds:Math.round((performance.now()-started)/1000),settledAt:new Date().toISOString()});try{window.EARTHLINE_ELDER_TREES_V1_17097?.refresh?.()}catch(_){} /* EARTHLINE_ELDER_REFRESH_RESTORE_17097 */return true;");
}

writeFileSync(p,s);
console.log('M83_ELDER_RESTORE_APPLIED '+JSON.stringify({moduleChars:module.length,dataFiles:paths.length,hasScript:s.includes('earthline-elder-restored-17097.js'),hasStart:s.includes('EARTHLINE_PROPERTY_ELDER_RESTORE_17097')}));
