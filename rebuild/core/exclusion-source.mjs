/**
 * M116 frozen exclusion mask assembly proof.
 *
 * Fail closed if any source class has missing per-cell coverage, if the frozen
 * no-build mask differs from the union, or if a source is unbound to the
 * declared dataset/coverage. This is structural proof, NOT proof that an
 * external GIS provider delivered complete and accurate geographic features.
 */
export const REQUIRED_EXCLUSION_CLASSES=Object.freeze([
  'roads','buildings','driveways','mappedWater','protectedLand'
]);
const isArray=a=>Array.isArray(a)||ArrayBuffer.isView(a);
const label=s=>typeof s==='string'&&s.trim().length>0;
const fail=(code,detail={})=>({status:'blocked',errors:[code],...detail});

export function verifyFrozenExclusions(grid,source){
  if(!grid||!Number.isInteger(grid.width)||!Number.isInteger(grid.height)||
      grid.width<3||grid.height<3||grid.width*grid.height>5_000_000)
    return fail('EXCLUSION_GRID_DIMENSIONS_INVALID');
  const n=grid.width*grid.height;
  if(!isArray(grid.validity)||grid.validity.length!==n||
      !isArray(grid.noBuild)||grid.noBuild.length!==n||
      !label(grid.gridId)||!label(grid.maskFingerprint))
    return fail('EXCLUSION_GRID_MASK_UNAVAILABLE');
  if(source?.status!=='verified'||source.coverageId!==grid.gridId||
      source.fingerprint!==grid.maskFingerprint)
    return fail('EXCLUSION_SOURCE_GRID_FINGERPRINT_MISMATCH');
  const layers=grid.exclusionLayers;
  if(!layers||typeof layers!=='object')
    return fail('EXCLUSION_CLASS_RASTERS_MISSING');
  for(const cls of REQUIRED_EXCLUSION_CLASSES){
    const layer=layers[cls];
    if(source.classes?.[cls]!=='verified'||!layer||
        !isArray(layer.presence)||layer.presence.length!==n||
        !isArray(layer.known)||layer.known.length!==n)
      return fail('EXCLUSION_CLASS_SOURCE_OR_COVERAGE_MISSING',{className:cls});
  }
  let blockedCells=0;
  for(let i=0;i<n;i++){
    if(grid.validity[i]!==0&&grid.validity[i]!==1)
      return fail('EXCLUSION_TERRAIN_VALIDITY_INVALID',{cell:i});
    let union=0;
    for(const cls of REQUIRED_EXCLUSION_CLASSES){
      const layer=layers[cls],present=layer.presence[i],known=layer.known[i];
      if(known!==1)
        return fail('EXCLUSION_CLASS_COVERAGE_GAP',{className:cls,cell:i});
      if(present!==0&&present!==1)
        return fail('EXCLUSION_CLASS_NONBINARY',{className:cls,cell:i});
      union|=present;
    }
    if(grid.noBuild[i]!==union)
      return fail('EXCLUSION_FROZEN_MASK_NOT_CLASS_UNION',{cell:i,expected:union});
    if(union)blockedCells++;
  }
  return {status:'verified',errors:[],checkedCells:n,blockedCells,
    coverage:'complete-class-raster',maskFingerprint:grid.maskFingerprint};
}
