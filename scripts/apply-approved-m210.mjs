// Exact approved M210 patch: input October live blob 8f87e..., output a46d094...
// Refuse any baseline mismatch. Property-only channel splitting + minimum length.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const beforeSha='8f87eabe0927c884b0096f598ea5d602f241eab4';
const afterSha='a46d094cbdc37ecdc49f53a784bdd870c800627a';
const hash=()=>execFileSync('git',['hash-object','index.html'],{encoding:'utf8'}).trim();
assert.equal(hash(),beforeSha,'wrong baseline: stopping without changes');
let all=readFileSync('index.html','utf8');
const start=all.indexOf('function earthlineSplitUsableSegments(');
const end=all.indexOf('function earthlineSwaleFromPts(',start);
assert.ok(start>0&&end>start,'cannot locate Property functions');
let seg=all.slice(start,end),tail=all.slice(end);
function change(area,a,b){
 let s=area==='seg'?seg:tail;
 assert.equal(s.split(a).length-1,1,'unexpected context: '+a.slice(0,60));
 s=s.replace(a,b);
 if(area==='seg')seg=s;else tail=s;
}
change('seg','  let prev=null;\n  for(const p of (pts||[])){',
'  let prev=null;\n  /* M210 R8: in Property mode, a modelled channel or wash is a no-build line like a road: split the contour there. */\n  const propertySplitM210=!(M.loc&&(/Regional Opportunity Tile/i.test(String(M.loc.name||""))||(Array.isArray(M.loc.zones)&&M.loc.zones.includes("Regional Tile"))));\n  const chanThrM210=(propertySplitM210&&M.acc&&typeof streamThreshold===\'function\')?streamThreshold()*3.2:Infinity;\n  const onChannelM210=(x,y)=>{const gx=Math.round(x),gy=Math.round(y);return gx>=0&&gy>=0&&gx<GW&&gy<GH&&M.acc[idx(gx,gy)]>=chanThrM210;};\n  for(const p of (pts||[])){');
change('seg','    let ok=earthlinePathPointUsable(p[0],p[1],maxS);',
'    let ok=earthlinePathPointUsable(p[0],p[1],maxS)&&!onChannelM210(p[0],p[1]);');
change('seg','        if(!earthlinePathPointUsable(prev[0]+(p[0]-prev[0])*t,prev[1]+(p[1]-prev[1])*t,maxS)){ok=false;break;}',
'        const qxM210=prev[0]+(p[0]-prev[0])*t,qyM210=prev[1]+(p[1]-prev[1])*t;\n        if(!earthlinePathPointUsable(qxM210,qyM210,maxS)||onChannelM210(qxM210,qyM210)){ok=false;break;}');
change('tail','  const captureToken16455=earthlineCaptureToken16455();\n\n  for(const [px,py] of pts){',
'  const captureToken16455=earthlineCaptureToken16455();\n  /* M210: Property mode = not a Regional Opportunity Tile (same test the engine uses for isRegionalTile15769). */\n  const propertyM210=!(M.loc&&(/Regional Opportunity Tile/i.test(String(M.loc.name||""))||(Array.isArray(M.loc.zones)&&M.loc.zones.includes("Regional Tile"))));\n  let channelHitsM210=0;\n\n  for(const [px,py] of pts){');
change('tail','    slopeSum+=spHere;\n\n    const [ggx,ggy]=gradAt(gx,gy);',
'    slopeSum+=spHere;\n    if(propertyM210&&M.acc&&M.acc[idx(gx,gy)]>=chanThr)channelHitsM210++; /* M210 R8 */\n\n    const [ggx,ggy]=gradAt(gx,gy);');
change('tail','  if(!isSite && lenM<earthlineMinimumSwaleLengthM15768())return null;',
'  if((!isSite||propertyM210) && lenM<earthlineMinimumSwaleLengthM15768())return null; /* M210 R4: Property swales get the minimum length too */\n  if(propertyM210&&channelHitsM210>0)return null; /* M210 R8: a Property swale never sits on or crosses a modelled channel or wash */');
all=all.slice(0,start)+seg+tail;
writeFileSync('index.html',all);
assert.equal(hash(),afterSha,'candidate hash mismatch; refusing deployment');
console.log('Exact candidate blob verified:',afterSha);
