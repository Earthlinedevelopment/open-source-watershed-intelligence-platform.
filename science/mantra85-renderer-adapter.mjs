// Earthline Mantra 85 — deliberately dumb renderer adapter.
// It may translate shape, but may not shorten, smooth, filter, re-rank, relocate, or otherwise alter science geometry.

import {deepFreeze,stableHash} from './mantra85-contract.mjs';
import {validateForPublication} from './mantra85-publication.mjs';
export const RENDERER_VERSION='m85-renderer-adapter-1';
function cloneCoords(c){return (c||[]).map(p=>Object.freeze([Number(p[0]),Number(p[1])]));}
function geometryFingerprint(swales){return stableHash((swales||[]).map(s=>({id:s.id,coordinates:s.coordinates})));}

export function toRendererModel(bundle){
  validateForPublication(bundle);
  const swales=(bundle.swales||[]).map(s=>deepFreeze({id:String(s.id),score:Number(s.score||0),maxSlopePct:Number(s.maxSlopePct||0),coordinates:cloneCoords(s.coordinates)}));
  const model=deepFreeze({rendererVersion:RENDERER_VERSION,identity:bundle.identity,runId:bundle.runId,mode:bundle.mode,target:bundle.target,extent:bundle.extent,swales:Object.freeze(swales),waterPaths:bundle.waterPaths,contours:bundle.contours,aquifer:bundle.aquifer,elder:bundle.elder,coverage:bundle.coverage,scienceGeometryFingerprint:geometryFingerprint(bundle.swales),renderGeometryFingerprint:geometryFingerprint(swales)});
  if(model.scienceGeometryFingerprint!==model.renderGeometryFingerprint)throw new Error('renderer geometry mutation detected');
  return model;
}
