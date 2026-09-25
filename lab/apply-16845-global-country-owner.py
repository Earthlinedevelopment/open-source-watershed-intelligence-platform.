from pathlib import Path

path=Path('index.html')
s=path.read_text(encoding='utf-8')
marker='<!-- EARTHLINE 16845 — GLOBAL COUNTRY ATOMIC JURISDICTION OWNER. DEV BRANCH ONLY. -->'
if marker in s:
    print('16845 marker already present')
    raise SystemExit(0)

# 1) Add a pinned Natural Earth country capability while leaving U.S. state capability untouched.
needle="""  function earthlineAdministrativeCapability16539(loc){
    const pt=String(loc&&loc.placeType||'').toLowerCase(),cc=String(loc&&loc.countryCode||'').toLowerCase();
    if(pt==='region'&&cc==='us')return earthlineBoundaryCapabilities16539.usState;
    return null;
  }"""
replacement="""  const EARTHLINE_NE50_COUNTRIES_16845='https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ace5fed0eaf3c6c03c951e75b439ba8fffbc218e/geojson/ne_50m_admin_0_countries.geojson';
  const earthlineGlobalCountryCapability16845=Object.freeze({
    id:'natural-earth-country-16845',placeType:'country',countryCode:'*',
    source:'Natural Earth — Admin 0 Countries 1:50m',sourceTier:'open-data',
    sourceVintage:'Natural Earth final v5.0.0 GeoJSON · repository commit 2021-12-08',
    endpoint:EARTHLINE_NE50_COUNTRIES_16845
  });
  let earthlineNE50CountriesPromise16845=null;
  function earthlineCountryCodeKey16845(v){return String(v||'').trim().toLowerCase().replace(/[^a-z]/g,'').slice(0,2);}
  function earthlineCountryNameKey16845(v){return earthlinePlaceKey16537(String(v||'')).replace(/^(?:country|nation)\\s+of\\s+/, '').replace(/\\s+(?:country|nation)$/, '').trim();}
  async function earthlineNE50Countries16845(){
    if(!earthlineNE50CountriesPromise16845)earthlineNE50CountriesPromise16845=(async()=>{
      const signal=(typeof AbortSignal!=='undefined'&&typeof AbortSignal.timeout==='function')?AbortSignal.timeout(6500):undefined;
      const r=await fetch(EARTHLINE_NE50_COUNTRIES_16845,{mode:'cors',cache:'force-cache',signal,headers:{Accept:'application/geo+json,application/json'}});
      if(!r.ok)throw new Error('Natural Earth country boundary HTTP '+r.status);
      const j=await r.json();
      return Array.isArray(j&&j.features)?j.features.filter(f=>f&&f.geometry&&(f.geometry.type==='Polygon'||f.geometry.type==='MultiPolygon')):[];
    })().catch(e=>{earthlineNE50CountriesPromise16845=null;throw e;});
    return earthlineNE50CountriesPromise16845;
  }
  async function earthlineResolveNaturalEarthCountryBoundary16845(q,loc,runToken){
    const rows=await earthlineNE50Countries16845();if(runToken&&!isCurrentRun(runToken))return null;
    const cc=earthlineCountryCodeKey16845(loc&&loc.countryCode),qk=earthlineCountryNameKey16845(loc&&loc.name||q),center=[Number(loc&&loc.lng),Number(loc&&loc.lat)];
    let best=null,bestScore=-Infinity;
    for(const f of rows){
      const p=f.properties||{};
      const codes=[p.ISO_A2,p.ISO_A2_EH,p.WB_A2,p.POSTAL].map(earthlineCountryCodeKey16845).filter(Boolean);
      const names=[p.ADMIN,p.NAME,p.NAME_LONG,p.SOVEREIGNT,p.FORMAL_EN,p.BRK_NAME,p.ABBREV].map(earthlineCountryNameKey16845).filter(Boolean);
      let score=0;
      if(cc&&codes.includes(cc))score+=120;
      if(qk&&names.includes(qk))score+=80;
      if(qk&&names.some(n=>n===qk||n.includes(qk)||qk.includes(n)))score+=20;
      if(Number.isFinite(center[0])&&Number.isFinite(center[1])&&earthlinePointInJurisdiction16539(center,f.geometry))score+=15;
      if(score>bestScore){bestScore=score;best=f;}
    }
    if(!best||bestScore<=0)throw new Error('authoritative country boundary could not be matched');
    const p=best.properties||{},bbox=earthlineGeometryBounds16556(best.geometry),centerPoint=earthlineInteriorPoint16556(best.geometry,bbox);
    return {geometry:best.geometry,prepared:earthlinePrepareJurisdiction16539(best.geometry),bbox,center:centerPoint,
      source:earthlineGlobalCountryCapability16845.source,sourceTier:earthlineGlobalCountryCapability16845.sourceTier,
      sourceVintage:earthlineGlobalCountryCapability16845.sourceVintage,capability:earthlineGlobalCountryCapability16845.id,
      placeType:'country',label:String(p.ADMIN||p.NAME||loc&&loc.name||q||'Country'),code:String(p.ISO_A2||p.ISO_A2_EH||cc||'').toLowerCase(),resolvedAt:new Date().toISOString()};
  }
  function earthlineAdministrativeCapability16539(loc){
    const pt=String(loc&&loc.placeType||'').toLowerCase(),cc=String(loc&&loc.countryCode||'').toLowerCase();
    if(pt==='region'&&cc==='us')return earthlineBoundaryCapabilities16539.usState;
    if(pt==='country')return earthlineGlobalCountryCapability16845;
    return null;
  }"""
if needle not in s: raise SystemExit('admin capability needle missing')
s=s.replace(needle,replacement,1)

# 2) Route country capabilities through the Natural Earth resolver; U.S. state ArcGIS path remains byte-for-byte after this branch.
needle="""    const key=[cap.id,stateName.toLowerCase()].join('|');
    if(jurisdictionBoundaryCache16539.has(key))return jurisdictionBoundaryCache16539.get(key);
    const params=new URLSearchParams({where:\"NAME='\"+earthlineSqlLiteral16539(stateName)+\"'\",outFields:'NAME,STUSAB,GEOID,INTPTLAT,INTPTLON',returnGeometry:'true',outSR:'4326',maxAllowableOffset:'0.0025',geometryPrecision:'5',f:'geojson'});"""
replacement="""    const key=[cap.id,stateName.toLowerCase()].join('|');
    if(jurisdictionBoundaryCache16539.has(key))return jurisdictionBoundaryCache16539.get(key);
    if(cap.id==='natural-earth-country-16845'){
      const out16845=await earthlineResolveNaturalEarthCountryBoundary16845(q,loc,runToken);
      if(!out16845||!out16845.geometry)throw new Error('authoritative country boundary could not be resolved');
      jurisdictionBoundaryCache16539.set(key,out16845);if(jurisdictionBoundaryCache16539.size>12)jurisdictionBoundaryCache16539.delete(jurisdictionBoundaryCache16539.keys().next().value);
      return out16845;
    }
    const params=new URLSearchParams({where:\"NAME='\"+earthlineSqlLiteral16539(stateName)+\"'\",outFields:'NAME,STUSAB,GEOID,INTPTLAT,INTPTLON',returnGeometry:'true',outSR:'4326',maxAllowableOffset:'0.0025',geometryPrecision:'5',f:'geojson'});"""
if needle not in s: raise SystemExit('resolver needle missing')
s=s.replace(needle,replacement,1)

# 3) Build an immutable country package using the same existing prepared-boundary and analysis-extent machinery as U.S. states.
needle="""  window.earthlineResolveAtomicUSStatePackage16556=earthlineResolveAtomicUSStatePackage16556;
  function earthlineSqlLiteral16539(v){return String(v||'').replace(/'/g,\"''\");}"""
insert="""  window.earthlineResolveAtomicUSStatePackage16556=earthlineResolveAtomicUSStatePackage16556;
  const earthlineAtomicCountryPackageCache16845=new Map();
  async function earthlineResolveAtomicCountryPackage16845(q,loc){
    if(!loc||String(loc.placeType||'').toLowerCase()!=='country')return null;
    const cc=earthlineCountryCodeKey16845(loc.countryCode),name=String(loc.name||q||'').trim(),cacheKey=[cc||'--',earthlineCountryNameKey16845(name)].join('|');
    if(earthlineAtomicCountryPackageCache16845.has(cacheKey)){const cached=earthlineAtomicCountryPackageCache16845.get(cacheKey);window.EARTHLINE_LAST_ATOMIC_COUNTRY_PACKAGE_16845=cached;return cached;}
    const boundary=await earthlineResolveJurisdictionBoundary16539(q,loc,null,earthlineGlobalCountryCapability16845);
    if(!boundary||!boundary.geometry)throw new Error('atomic country package did not resolve authoritative geometry');
    const rawBBox=Array.isArray(boundary.bbox)?boundary.bbox:earthlineGeometryBounds16556(boundary.geometry);
    const rawCenter=Array.isArray(boundary.center)?boundary.center:earthlineInteriorPoint16556(boundary.geometry,rawBBox);
    const extentAudit=earthlineRegionalAnalysisBounds16712(boundary.geometry,rawBBox),bbox=Array.isArray(extentAudit&&extentAudit.bbox)?extentAudit.bbox.slice():rawBBox.slice();
    const identity=Object.freeze({id:'country-'+(cc||earthlineCountryNameKey16845(name)),name:boundary.label||name,countryCode:cc||String(boundary.code||'').toLowerCase(),placeType:'country',supportTier:'global-open-data'});
    const centerValue=Object.freeze({lng:Number(rawCenter[0]),lat:Number(rawCenter[1])});
    const extent=Object.freeze({bbox:Object.freeze(bbox.slice()),zoomHint:earthlineStateZoomHint16556(bbox),analysisBBox:true,extentClass:String(boundary.label||name)+' countrywide Regional screening extent',audit:extentAudit});
    const boundaryValue=Object.freeze({geometry:boundary.geometry,prepared:boundary.prepared,source:boundary.source,sourceTier:boundary.sourceTier,sourceVintage:boundary.sourceVintage,capability:boundary.capability,label:boundary.label,code:boundary.code});
    const location=Object.freeze(Object.assign({},loc,{name:boundary.label||name,fullName:boundary.label||name,countryCode:identity.countryCode,placeType:'country',lat:centerValue.lat,lng:centerValue.lng,bbox:extent.bbox,zoomHint:extent.zoomHint,analysisBBox:true,extentClass:extent.extentClass,query:q}));
    const pkg=Object.freeze({build:'EARTHLINE 16845',packageKind:'country',profileId:identity.id,supportTier:'global-open-data',countryCode:identity.countryCode,placeType:'country',identity,boundary:boundaryValue,center:centerValue,regionalExtent:extent,location,appliedAtomically:true,resolvedAt:new Date().toISOString()});
    earthlineAtomicCountryPackageCache16845.set(cacheKey,pkg);window.EARTHLINE_LAST_ATOMIC_COUNTRY_PACKAGE_16845=pkg;
    return pkg;
  }
  window.earthlineResolveAtomicCountryPackage16845=earthlineResolveAtomicCountryPackage16845;
  function earthlineSqlLiteral16539(v){return String(v||'').replace(/'/g,\"''\");}"""
if needle not in s: raise SystemExit('atomic insertion needle missing')
s=s.replace(needle,insert,1)

# 4) Resolve countries atomically before Regional bounds are locked. U.S. state profile path remains first and unchanged.
needle="""    const phaseMark16198=(name,started)=>{phase16198[name]=Math.round(performance.now()-started);};"""
insert="""    let countryPackage16845=null;
    if(!profile16549&&loc&&String(loc.placeType||'').toLowerCase()==='country'){
      countryPackage16845=await earthlineResolveAtomicCountryPackage16845(q,loc);
      if(countryPackage16845&&countryPackage16845.location){
        loc=JSON.parse(JSON.stringify(countryPackage16845.location));
        if(s){s.loc=loc;s.centerLng=Number(loc.lng);s.centerLat=Number(loc.lat);s.viewZoom=Number(loc.zoomHint||s.viewZoom||5.7);s.appliedSearchText=q;s.jurisdictionPackage16556=countryPackage16845;}
        window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556=countryPackage16845;
        window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=countryPackage16845;
      }
    }else if(!profile16549&&window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556&&window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556.packageKind==='country'){
      window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556=null;window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845=null;
    }
    const phaseMark16198=(name,started)=>{phase16198[name]=Math.round(performance.now()-started);};"""
if needle not in s: raise SystemExit('runRegional insertion needle missing')
s=s.replace(needle,insert,1)

# 5) Permit the same existing containment promise to reuse either atomic U.S.-state or atomic-country boundary.
needle="""    const matchingAtomicBoundary16556=!!(profile16549&&activePackage16556&&activePackage16556.profileId===profile16549.id&&activePackage16556.boundary&&activePackage16556.appliedAtomically===true);"""
replacement="""    const matchingAtomicBoundary16556=!!(activePackage16556&&activePackage16556.boundary&&activePackage16556.appliedAtomically===true&&((profile16549&&activePackage16556.profileId===profile16549.id)||(!profile16549&&activePackage16556.packageKind==='country'&&String(activePackage16556.countryCode||'')===String(loc&&loc.countryCode||''))));"""
if needle not in s: raise SystemExit('matching boundary needle missing')
s=s.replace(needle,replacement,1)

s=marker+'\n'+s
path.write_text(s,encoding='utf-8')
print('applied 16845 global country atomic jurisdiction owner')
