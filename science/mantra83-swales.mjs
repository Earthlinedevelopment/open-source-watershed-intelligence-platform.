// Mantra 83 forensic swale core — NON-PRODUCTION.
// Pure candidate eligibility and spacing selection. No DOM, Mapbox, globals, timers, or network I/O.

import {SWALE,swaleCellEligible} from './mantra83-core.mjs';

export const SWALE_ENGINE_VERSION='m83-swale-core-1';

function dist(a,b){return Math.hypot(Number(a.x)-Number(b.x),Number(a.y)-Number(b.y));}

export function candidateEligible(candidate){
  if(!candidate||!Array.isArray(candidate.samples)||!candidate.samples.length)return false;
  for(const s of candidate.samples){
    if(!swaleCellEligible(s))return false;
  }
  const maxSlope=Math.max(...candidate.samples.map(x=>Number(x.slopePct)));
  if(maxSlope>SWALE.maxSlopePct)return false;
  return true;
}

export function candidateScore(candidate){
  if(!candidateEligible(candidate))return -Infinity;
  const meanFlow=candidate.samples.reduce((a,s)=>a+Number(s.flowScore||0),0)/candidate.samples.length;
  const meanRecharge=candidate.samples.reduce((a,s)=>a+Number(s.rechargeScore||0),0)/candidate.samples.length;
  const meanSlope=candidate.samples.reduce((a,s)=>a+Number(s.slopePct||0),0)/candidate.samples.length;
  const contourFit=Math.max(0,1-Math.abs(meanSlope-2)/2);
  return meanRecharge*.55+meanFlow*.30+contourFit*.15;
}

function tooClose(a,b){
  const ac=a.anchor||a.samples[Math.floor(a.samples.length/2)]||{x:0,y:0};
  const bc=b.anchor||b.samples[Math.floor(b.samples.length/2)]||{x:0,y:0};
  const scale=Math.max(0.001,Number(a.metersPerGrid||b.metersPerGrid||1));
  return dist(ac,bc)*scale<SWALE.minSpacingM;
}

export function selectSwales(candidates,{maxCount=200}={}){
  const ranked=(candidates||[])
    .map((c,i)=>({c,i,score:candidateScore(c)}))
    .filter(r=>Number.isFinite(r.score))
    .sort((a,b)=>b.score-a.score||a.i-b.i);
  const chosen=[];
  for(const r of ranked){
    if(chosen.some(x=>tooClose(x,r.c)))continue;
    chosen.push(Object.freeze({...r.c,score:r.score,maxSlopePct:SWALE.maxSlopePct}));
    if(chosen.length>=maxCount)break;
  }
  return Object.freeze(chosen);
}
