import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let s=readFileSync(p,'utf8');
const old="window.EARTHLINE_PROPERTY_TARGET_16201={lng:Number(target.lng),lat:Number(target.lat),source:String(target.source||'crosshair'),code:target.code?String(target.code):'',score:Number(target.score||0),parentRunToken:parentRunToken16347||'',at:new Date().toISOString()};if(window.EARTHLINE_PROPERTY_TARGET_16201.code)";
const neu="window.EARTHLINE_PROPERTY_TARGET_16201={lng:Number(target.lng),lat:Number(target.lat),source:String(target.source||'crosshair'),code:target.code?String(target.code):'',score:Number(target.score||0),parentRunToken:parentRunToken16347||'',at:new Date().toISOString()};try{if(window.EARTHLINE_ELDER_TREES_V1_17097&&typeof window.EARTHLINE_ELDER_TREES_V1_17097.prefetchPropertyTarget==='function')void window.EARTHLINE_ELDER_TREES_V1_17097.prefetchPropertyTarget()}catch(_){}if(window.EARTHLINE_PROPERTY_TARGET_16201.code)";
if(s.includes(old))s=s.replace(old,neu);
else if(!s.includes(neu))throw new Error('Property target prefetch owner not found');
writeFileSync(p,s);
console.log('M83_PROPERTY_ELDER_PREFETCH_FIXED');
