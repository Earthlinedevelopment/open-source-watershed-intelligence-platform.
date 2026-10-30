// Mantra 83 forensic renderer adapter — NON-PRODUCTION.
// Read-only translation from validated science snapshot to renderer-safe data.

import {publishableSnapshot,validateForPublication} from './mantra83-publication.mjs';

export const RENDER_ADAPTER_VERSION='m83-render-adapter-1';

function cloneCoords(coords){
  if(!Array.isArray(coords))return [];
  return coords.map(p=>Array.isArray(p)?p.map(Number):p);
}

export function toRendererModel(bundle){
  validateForPublication(bundle);
  const snap=publishableSnapshot(bundle);

  const swales=(snap.swales||[]).map(s=>Object.freeze({
    id:String(s.id??''),
    score:Number(s.score??0),
    maxSlopePct:Number(s.maxSlopePct??0),
    coordinates:Object.freeze(cloneCoords(
      s.coordinates||
      (s.samples||[]).map(p=>[Number(p.lng??p.x),Number(p.lat??p.y)])
    ))
  }));

  const waterPaths=(snap.waterPaths||[]).map((w,i)=>Object.freeze({
    id:String(w.id??('water-'+i)),
    coordinates:Object.freeze(cloneCoords(w.coordinates||w.geometry?.coordinates||[]))
  }));

  const contours=(snap.contours||[]).map((c,i)=>Object.freeze({
    id:String(c.id??('contour-'+i)),
    elevationM:Number(c.elevationM??c.elev_m??c.properties?.elev_m??NaN),
    coordinates:Object.freeze(cloneCoords(c.coordinates||c.geometry?.coordinates||[]))
  }));

  return Object.freeze({
    adapterVersion:RENDER_ADAPTER_VERSION,
    publicationVersion:snap.publicationVersion,
    runId:snap.runId,
    engineVersion:snap.engineVersion,
    mode:snap.mode,
    target:snap.target,
    extent:snap.extent,
    dem:snap.dem,
    rules:snap.rules,
    swales:Object.freeze(swales),
    waterPaths:Object.freeze(waterPaths),
    contours:Object.freeze(contours),
    aquifer:snap.aquifer,
    elder:snap.elder,
    coverage:snap.coverage
  });
}
