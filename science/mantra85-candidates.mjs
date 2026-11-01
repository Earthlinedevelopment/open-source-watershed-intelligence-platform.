// Earthline Mantra 85 — pure contour-local swale candidate generation and selection.
// Geometry is segmented here, not cosmetically shortened by the renderer.

import {LOCKED_SCIENCE,clamp01,deepFreeze} from './mantra85-contract.mjs';
export const CANDIDATE_VERSION='m85-candidates-1';
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

export function buildCandidates({contours,width,height,extent,hydrology,rechargeGrid,masks={},canopyGrid=null,policy}){
  const candidates=[];
  for(const contour of contours||[]){
    const parts=segmentPolyline(contour.coordinates,policy.maxCandidateLengthM,policy.minCandidateLengthM);
    parts.forEach((coordinates,partIndex)=>{
      const dense=densify(coordinates,policy.sampleStepM),samples=[];let eligible=true,maxSlope=0;
      for(const [lng,lat] of dense){
        const i=gridIndex(lng,lat,width,height,extent);if(i<0){eligible=false;break;}
        const slopePct=numAt(hydrology.slopePct,i,Infinity),canopyKnown=!!canopyGrid,canopyScore=numAt(canopyGrid,i,0);
        const s={i,lng,lat,slopePct,flowScore:clamp01(Math.log1p(Math.max(0,numAt(hydrology.accumulation,i,0)))/Math.log1p(Math.max(2,width*height))),rechargeScore:clamp01(numAt(rechargeGrid,i,0)),insideBoundary:!masks.validMask||maskAt(masks.validMask,i),roadOrDriveway:maskAt(masks.roadOrDriveway,i),structureOrImpervious:maskAt(masks.structureOrImpervious,i),water:maskAt(masks.water,i),majorChannel:maskAt(masks.majorChannel,i),manualNoBuild:maskAt(masks.manualNoBuild,i),canopyKnown,canopyScore};
        maxSlope=Math.max(maxSlope,slopePct);
        if(!s.insideBoundary||!Number.isFinite(slopePct)||slopePct>LOCKED_SCIENCE.maxSwaleSlopePct||s.roadOrDriveway||s.structureOrImpervious||s.water||s.majorChannel||s.manualNoBuild||(s.canopyKnown&&s.canopyScore>LOCKED_SCIENCE.forestCanopyGate)){eligible=false;}
        samples.push(Object.freeze(s));
      }
      if(!eligible||samples.length<2)return;
      const lengthM=polylineLengthM(coordinates);if(lengthM>policy.maxCandidateLengthM+0.01||lengthM<policy.minCandidateLengthM-0.01)return;
      const meanFlow=samples.reduce((a,s)=>a+s.flowScore,0)/samples.length,meanRecharge=samples.reduce((a,s)=>a+s.rechargeScore,0)/samples.length,meanSlope=samples.reduce((a,s)=>a+s.slopePct,0)/samples.length,contourFit=Math.max(0,1-Math.abs(meanSlope-2)/2),score=meanRecharge*.55+meanFlow*.30+contourFit*.15;
      candidates.push(deepFreeze({id:`${contour.id}-s${partIndex}`,contourId:contour.id,elevationM:contour.elevationM,coordinates:coordinates.map(p=>Object.freeze(p.slice())),samples,lengthM,maxSlopePct:maxSlope,score}));
    });
  }
  return Object.freeze(candidates);
}

function midpoint(c){const p=c.coordinates[Math.floor(c.coordinates.length/2)];return p;}
export function selectCandidates(candidates,{maxSwales,minSpacingM}){
  const ranked=[...(candidates||[])].sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)),chosen=[];
  for(const c of ranked){const m=midpoint(c);if(chosen.some(x=>distanceM(m,midpoint(x))<minSpacingM))continue;chosen.push(c);if(chosen.length>=maxSwales)break;}
  return Object.freeze(chosen);
}
