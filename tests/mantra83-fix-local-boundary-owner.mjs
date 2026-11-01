import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let s=readFileSync(p,'utf8');
const a='s16839=await makeSwales(sub16839,c16839,false,swaleJurisdictionGeometry16539,null)';
const b='s16839=await makeSwales(sub16839,c16839,false,null,null)';
if(!s.includes(a))throw new Error('grouped local owner missing');
s=s.replace(a,b);
writeFileSync(p,s);
console.log('M83_LOCAL_BOUNDARY_OWNER_CHANGED');
