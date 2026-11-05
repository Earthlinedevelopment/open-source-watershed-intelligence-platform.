/**
 * The map is an output device, never a science engine.
 *
 * The caller owns Mapbox map initialization, the locked Earthline styles and
 * the authoritative run snapshot. No geometry smoothing or synthetic swales.
 * IDs use a new namespace to avoid modifying production layer ownership.
 */
const KINDS = Object.freeze(['waterPaths','contours','rechargeTargets',
  'aquiferPolygons','swales','aquiferLabels']);
const id = kind => 'earthline116-'+kind;
const EMPTY = () => ({type:'FeatureCollection',features:[]});
const isCollection = x => x?.type==='FeatureCollection' && Array.isArray(x.features);
const isLine = x => Array.isArray(x) && x.length>=2 &&
  x.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite));
function featureSet(snap) {
  const p=snap?.publication;
  if (!p || p.runId!==snap.id || p.tier!==snap.tier ||
      !Array.isArray(p.swales))throw Error('MAP_SOURCE_RUN_OR_TIER_MISMATCH');
  const out={};
  for(const kind of KINDS)out[kind]=EMPTY();
  out.swales.features=p.swales.map(s=>{
    if(!isLine(s.coordinates))throw Error('MAP_SWALE_COORDINATES_INVALID');
    return {type:'Feature',properties:{id:s.id,runId:p.runId},
      geometry:{type:'LineString',coordinates:s.coordinates.map(q=>[...q])}};
  });
  const v=p.mapEvidence||{};
  for(const kind of ['waterPaths','contours','rechargeTargets']){
    const src=v[kind];if(src===undefined)continue;
    if(!isCollection(src))throw Error('MAP_'+kind+'_EVIDENCE_INVALID');
    out[kind]=structuredClone(src);
  }
  // Never rehydrate a groundwater geometry from a previous run.
  if(p.groundwater?.status==='verified'){
    for(const kind of ['aquiferPolygons','aquiferLabels']){
      const src=v[kind];if(src===undefined)continue;
      if(!isCollection(src))throw Error('MAP_'+kind+'_EVIDENCE_INVALID');
      out[kind]=structuredClone(src);
    }
  }
  return out;
}
export function createMapPublicationAdapter(map,approvedLayerStyles) {
  if(!map||typeof map.getSource!=='function'||typeof map.addSource!=='function'||
     typeof map.addLayer!=='function'||typeof map.getLayer!=='function'||
     typeof map.moveLayer!=='function')throw TypeError('Mapbox map interface required');
  for(const kind of KINDS){
    if(!approvedLayerStyles?.[kind]?.type ||
       !approvedLayerStyles[kind].paint ||
       !approvedLayerStyles[kind].layout)
      throw TypeError('Approved style contract missing: '+kind);
  }
  let displayedRun=null;
  function sourcesInstalled() {
    return KINDS.every(kind=>!!map.getSource(id(kind))&&!!map.getLayer(id(kind)));
  }
  function install() {
    if(typeof map.isStyleLoaded==='function'&&!map.isStyleLoaded())
      return false;
    for(const kind of KINDS){
      if(!map.getSource(id(kind)))map.addSource(id(kind),{type:'geojson',data:EMPTY()});
      if(!map.getLayer(id(kind)))
        map.addLayer({...structuredClone(approvedLayerStyles[kind]),
          id:id(kind),source:id(kind)});
    }
    return true;
  }
  function put(data) {
    if(!install())return false;
    // Prevent stale source contributions from skipping an owner update.
    for(const kind of KINDS)map.getSource(id(kind)).setData(data[kind]);
    // Groundwater evidence label must sit above every Earthline layer.
    map.moveLayer(id('aquiferLabels'));
    return true;
  }
  function clear() {
    if(!install())return {applied:false,status:'style-not-ready'};
    put(Object.fromEntries(KINDS.map(kind=>[kind,EMPTY()])));
    displayedRun=null;
    return {applied:true,status:'cleared'};
  }
  function sync(snapshot) {
    if(!snapshot||!['verified','verified-empty'].includes(snapshot.status)) {
      if(displayedRun===null&&sourcesInstalled())
        return {applied:false,status:'already-cleared'};
      return clear();
    }
    if(!snapshot.publication)return clear();
    if(displayedRun===snapshot.id&&sourcesInstalled())
      return {applied:false,status:'already-current'};
    // Validate ALL proposed sources before touching a single map layer.
    let prepared;
    try {prepared=featureSet(snapshot);}
    catch(error){clear();return {applied:false,status:'blocked',error:String(error.message||error)};}
    try {
      if(!put(prepared))return {applied:false,status:'style-not-ready'};
      displayedRun=snapshot.id;
      return {applied:true,status:snapshot.status,runId:snapshot.id};
    } catch(error) {
      clear();
      return {applied:false,status:'blocked',error:String(error.message||error)};
    }
  }
  return Object.freeze({sync,clear,sourceIds:Object.freeze(Object.fromEntries(
    KINDS.map(kind=>[kind,id(kind)])))});
}
