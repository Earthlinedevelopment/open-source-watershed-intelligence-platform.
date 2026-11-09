#!/usr/bin/env python3
"""Mantra 126 report place resolver only. Preserve all map science/UI."""
from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
start=s.find('  /* Hotfix 3 R9 — best-effort US Census place resolution')
end=s.find('  /* Hotfix 3 R10 — report owns a bounded',start)
assert start!=-1 and end>start, 'Expected report-place helper boundary missing'
original=s[start:end]
assert original.count('async function reportPlaceLine123')==1
new="""  /* M126: point-in-polygon lookup from Census TIGERweb (2026 boundaries).
     No manufactured locality; report still has run query and truthful coordinates. */
  async function reportPlaceLine123(d){
    const b=reportBounds(d),lng=(Number(b[0])+Number(b[2]))/2,lat=(Number(b[1])+Number(b[3]))/2;
    const fallback='Coordinates: '+lat.toFixed(5)+', '+lng.toFixed(5);
    if(!Number.isFinite(lng)||!Number.isFinite(lat)||lng< -180||lng> -60||lat<17||lat>72)return fallback;
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),5000);
    const root='https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/';
    const request=async(service,layer)=>{
      const params=new URLSearchParams({geometry:lng+','+lat,geometryType:'esriGeometryPoint',
        inSR:'4326',spatialRel:'esriSpatialRelIntersects',outFields:'NAME,BASENAME',
        returnGeometry:'false',f:'json'});
      const response=await fetch(root+service+'/MapServer/'+layer+'/query?'+params,
        {signal:ctrl.signal,mode:'cors',cache:'no-store'});
      if(!response.ok)throw new Error('TIGERweb HTTP '+response.status);
      const data=await response.json();
      if(data.error)throw new Error('TIGERweb '+String(data.error.message||'query failed'));
      const a=data.features?.[0]?.attributes||{};
      return String(a.BASENAME||a.NAME||'').trim();
    };
    try{
      const [incorporated,designated,county]=await Promise.allSettled([
        request('Places_CouSub_ConCity_SubMCD',4),
        request('Places_CouSub_ConCity_SubMCD',5),
        request('State_County',1)
      ]);
      const get=x=>x.status==='fulfilled'?x.value:'';
      const place=get(incorporated)||get(designated),countyName=get(county);
      return [place,countyName].filter(Boolean).join(' · ')||fallback;
    }catch(_){return fallback}finally{clearTimeout(timer)}
  }
"""
s=s[:start]+new+s[end:]
assert s.count('async function reportPlaceLine123')==1
assert s.count('reportAquiferContext123(baseData.d)')==1
assert s.count('Place hand cursor over bare land to move map.')==1
p.write_text(s,encoding='utf-8')
print('M126_TIGERWEB_PLACE_RESOLVER_PATCHED')
