import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const s=readFileSync('index.html','utf8');
const h="function earthlinePrepareJurisdiction16539(g){\n    if(!g)return null;if(g.prepared16539===true)return g;";
const t="return {prepared16539:true,polygons};";
for(const v of [h,t])if(s.split(v).length!==2)throw Error('Geometry authority changed: '+v);
if(!s.includes('metricLengthM92>=250&&metricLengthM92<=4005')||
 !s.includes('(++finalScreenYield16661%1536)===0')||
 !s.includes("if(activeTier==='regional'&&pts.length===1"))throw Error('Wrong M92 candidate');
const before=createHash('sha256').update(s).digest('hex');
const head=[
  'const earthlinePreparedGeometryM92=new WeakMap();',
  'function earthlinePrepareJurisdiction16539(g){',
  '  if(!g)return null;if(g.prepared16539===true)return g;',
  "  const cachedM92=typeof g==='object'?earthlinePreparedGeometryM92.get(g):null;",
  '  if(cachedM92)return cachedM92;'
].join('\n');
const tail=[
  'const preparedM92={prepared16539:true,polygons};',
  "if(typeof g==='object')earthlinePreparedGeometryM92.set(g,preparedM92);",
  'return preparedM92;'
].join('\n');
const out=s.replace(h,head).replace(t,tail);
const after=createHash('sha256').update(out).digest('hex');
if(before===after)throw Error('No optimization installed');
writeFileSync('index.html',out);
console.log('M92_GEOMETRY_MEMO '+JSON.stringify({before,after,rule:'exact identity memo of immutable jurisdiction boundaries; no change to membership predicate'}));
