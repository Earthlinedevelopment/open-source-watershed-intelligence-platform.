// Earthline Mantra 85 — pure contour-local swale candidate generation and selection.
// Geometry is segmented here, not cosmetically shortened by the renderer.
// Forest exclusion and ranking are explicit provenance-bearing policy inputs; no hidden science constants live here.

import {LOCKED_SCIENCE,deepFreeze} from './mantra85-contract.mjs';
export const CANDIDATE_VERSION='m85-candidates-2';
const R=6371008.8;

export function distanceM(a,b){const p1=Number(a[1])*Math.PI/180,p2=Number(b[1])*Math.PI/180,dp=(Number(b[1])-Number(a[1]))*Math.PI/180,dl=(Number(b[0])-Number(a[0]))*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));}
export function polylineLengthM(coords){let d=0;for(let i=1;i<coords.length;i++)d+=distanceM(coords[i-1],coords[i]);return d;}
function interpLL(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}

export function segmentPolyline(coords,maxLengthM,minLengthM){
  if(!Array.isArray(coords)||coords.length<2)return [];
  const out=[];let cur=[coords[0].slice()],len=0;
  for(let i=1;i<coords.length;i++){
    let a=cur[cur.length-1],b=coords[i].slice(),remain=distanceM(a,b);
    while(len+remain>maxLengthM && remain>1e-6){const take=maxLengthM-len,t=take/remain,cut=interpLL(a,b,t);cur.push(cut);if(polylineLengthM(cur)>=minLengthM)out.push(cur);cur=[cut];len=0;a=cut;remain=distanceM(a,b);}
    cur.push(b);len+=remain;
  }
  if(polylineLengthM(cur)>=minLengthM)out.push(cur);
  return out;
}

export function densify(coords,stepM){const out=[coords[0].slice()];for(let i=1;i<coords.length;i++){const a=coords[i-1],b=coords[i],d=distanceM(a,b),n=Math.max(1,Math.ceil(d/stepM));for(let j=1;j<=n;j++)out.push(interpLL(a,b,j/n));}return out;}

function gridIndex(lng,lat,width,height,extent){const [w,s,e,n]=extent;if(lng<w||lng>e||lat<s||lat>n)return -1;const fx=(lng-w)/(e-w),fy=(n-lat)/(n-s),x=Math.max(0,Math.min(width-1,Math.round(fx*(width-1)))),y=Math.max(0,Math.min(height-1,Math.round(fy*(height-1))));return y*width+x;}
function maskAt(mask,i){return !!(mask&&i>=0&&mask[i]);}
function numAt(grid,i,d=0){const v=grid&&i>=0?Number(grid[i]):NaN;return Number.isFinite(v)?v:d;}

export function buildCandidates({contours,width,height,extent,hydrology,rechargeGrid,masks={},forestNoBuildMask=null,policy}){
  const candidates=[];
  for(const contour of contours||[]){
    const parts=segmentPolyline(contour.coordinates,policy.maxCandidateLengthM,policy.minCandidateLengthM);
    parts.forEach((coordinates,partIndex)=>{
      const dense=densify(coordinates,policy.sampleStepM),samples=[];let eligible=true,maxSlope=0;
      for(const [lng,lat] of dense){
        const i=gridIndex(lng,lat,width,height,extent);if(i<0){eligible=false;break;}
        const slopePct=numAt(hydrology.slopePct,i,Infinity);
        const flowAccumulation=numAt(hydrology.accumulation,i,0);
        const rechargeScore=numAt(rechargeGrid,i,NaN);
        const s={
          i,lng,lat,slopePct,flowAccumulation,rechargeScore,
          insideBoundary:!masks.validMask||maskAt(masks.validMask,i),
          roadOrDriveway:maskAt(masks.roadOrDriveway,i),
          structureOrImpervious:maskAt(masks.structureOrImpervious,i),
          water:maskAt(masks.water,i),
          majorChannel:maskAt(masks.majorChannel,i),
          manualNoBuild:maskAt(masks.manualNoBuild,i),
          forestNoBuild:maskAt(forestNoBuildMask,i)
        };
        maxSlope=Math.max(maxSlope,slopePct);
        if(!s.insideBoundary||!Number.isFinite(slopePct)||slopePct>LOCKED_SCIENCE.maxSwaleSlopePct||
          s.roadOrDriveway||s.structureOrImpervious||s.water||s.majorChannel||s.manualNoBuild||s.forestNoBuild||
          !Number.isFinite(rechargeScore)){eligible=false;}
        samples.push(Object.freeze(s));
      }
      if(!eligible||samples.length<2)return;
      const lengthM=polylineLengthM(coordinates);if(lengthM>policy.maxCandidateLengthM+0.01||lengthM<policy.minCandidateLengthM-0.01)return;
      const meanFlowAccumulation=samples.reduce((a,s)=>a+s.flowAccumulation,0)/samples.length;
      const meanRecharge=samples.reduce((a,s)=>a+s.rechargeScore,0)/samples.length;
      const meanSlope=samples.reduce((a,s)=>a+s.slopePct,0)/samples.length;
      candidates.push(deepFreeze({
        id:`${contour.id}-s${partIndex}`,contourId:contour.id,elevationM:contour.elevationM,
        coordinates:coordinates.map(p=>Object.freeze(p.slice())),samples,lengthM,maxSlopePct:maxSlope,
        metrics:deepFreeze({meanRecharge,meanFlowAccumulation,meanSlope,lowSlope:Math.max(0,LOCKED_SCIENCE.maxSwaleSlopePct-meanSlope)})
      }));
    });
  }
  return Object.freeze(candidates);
}

function midpoint(c){const p=c.coordinates[Math.floor(c.coordinates.length/2)];return p;}
function rankScore(c,rankingPolicy){
  let score=0;
  for(const term of rankingPolicy.terms){
    const v=Number(c.metrics?.[term.metric]);
    if(!Number.isFinite(v))throw new Error('candidate missing ranking metric '+term.metric);
    score+=v*Number(term.weight);
  }
  return score;
}
export function selectCandidates(candidates,{maxSwales,minSpacingM,rankingPolicy}){
  if(!rankingPolicy?.policyId)throw new Error('explicit ranking policy required');
  const ranked=[...(candidates||[])].map(c=>({c,score:rankScore(c,rankingPolicy)}))
    .sort((a,b)=>b.score-a.score||a.c.id.localeCompare(b.c.id));
  const chosen=[];
  for(const row of ranked){const c=row.c,m=midpoint(c);if(chosen.some(x=>distanceM(m,midpoint(x))<minSpacingM))continue;chosen.push(deepFreeze({...c,rankingScore:row.score,rankingPolicyId:rankingPolicy.policyId}));if(chosen.length>=maxSwales)break;}
  return Object.freeze(chosen);
}
