// How the tests reach the page's map. Written after the Nov 22 audit reported "COULD NOT RUN" for all six scenarios:
// the live page declares its map with a top-level `let earthlineMap=null`, which is NOT a property of window, so window.earthlineMap is undefined
// even while the map is working. The page's own code reads `window.earthlineMap||earthlineMap`; the tests must do the same.
export const MAP_EXPR='(typeof earthlineMap!=="undefined"&&earthlineMap)||window.earthlineMap||null';
export class InfrastructureError extends Error{constructor(m){super('TEST INFRASTRUCTURE FAILURE (not a science result): '+m);this.name='InfrastructureError';}}

/* wait until the page's map object exists; otherwise throw InfrastructureError so the run stops and goes red instead of reporting six "could not run" rows */
export async function waitForMap(page,ms=30000){
  try{await page.waitForFunction(`Boolean(${MAP_EXPR})`,null,{timeout:ms});}
  catch(e){throw new InfrastructureError('the page never exposed its map within '+ms+' ms (looked for the page\'s own name earthlineMap and for window.earthlineMap). Underlying error: '+String(e&&e.message||e).split('\n')[0].slice(0,160));}
}
export async function readCenter(page){
  const c=await page.evaluate(`(()=>{const m=${MAP_EXPR};if(!m||typeof m.getCenter!=='function')return null;const c=m.getCenter();return {lng:c.lng,lat:c.lat,zoom:m.getZoom()};})()`);
  if(!c||!Number.isFinite(c.lat)||!Number.isFinite(c.lng))throw new InfrastructureError('the map exists but its centre could not be read');
  return c;
}
/* the page elements and globals the audit relies on; returns the names that are missing */
export async function missingContract(page,ids,globals){
  return await page.evaluate(`((ids,globals)=>{const miss=[];for(const i of ids)if(!document.getElementById(i))miss.push('element #'+i);
    for(const g of globals){let ok=false;try{ok=eval('typeof '+g)!=='undefined';}catch(_){}if(!ok)miss.push('global '+g);}return miss;})(${JSON.stringify(ids)},${JSON.stringify(globals)})`);
}
export async function jumpTo(page,center,zoom,fireDragEnd=true){
  await page.evaluate(`((c,z,f)=>{const m=${MAP_EXPR};if(!m)throw Error('map missing');window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;m.jumpTo({center:c,zoom:z});if(f)m.fire('dragend');})(${JSON.stringify(center)},${zoom},${fireDragEnd})`);
}
