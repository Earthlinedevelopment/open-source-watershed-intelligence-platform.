from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

fn_anchor="  function earthlineSupersedePropertyForNewSearch16327(token,q){"
if fn_anchor not in s:
    raise SystemExit("shared-owner function anchor missing")

if "EARTHLINE_REGIONAL_NATIVE_PUBLICATION_16920" not in s:
    fn=r'''  /* EARTHLINE 16920 — one shared atomic native Regional presentation owner.
     Regional science is already complete here. This owner only guarantees that the
     authoritative native Mapbox sources/layers exist and receive the current run's
     already-approved products at the same publication point used by the SVG overlay.
     No jurisdiction branch, timer, styledata/idle owner, or science threshold is added. */
  function earthlinePublishRegionalNative16920(token,m,visualData){
    if(!isCurrentRun(token)||!m||!visualData)return false;
    ensureLayers();
    const acceptedAqAudit=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_AUDIT_16373||null;
    const acceptedAq=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_GEOJSON_16373||null;
    const aquifers=(acceptedAqAudit&&String(acceptedAqAudit.runToken||'')===String(token||'')&&acceptedAq&&Array.isArray(acceptedAq.features))
      ?acceptedAq
      :(visualData.aquifers||EMPTY);
    const writes=[
      [IDS.contours,visualData.contours||EMPTY,'regional-contours-final'],
      [IDS.flows,visualData.flows||EMPTY,'regional-flows-final'],
      [IDS.swales,visualData.swales||EMPTY,'regional-swales-final'],
      [IDS.aquifer,aquifers,'regional-aquifers-final']
    ];
    for(const [id,data,sourceId] of writes){
      if(!guardedSetGeo(token,m,id,data,sourceId))return false;
    }
    const ordered=[IDS.aquiferFill,IDS.aquiferLine,IDS.contourLine,IDS.flowCasing,IDS.flowLine,IDS.contourLabel,IDS.flowArrow,IDS.swaleHalo,IDS.swaleLine];
    for(const id of ordered){
      try{if(m.getLayer(id))m.setLayoutProperty(id,'visibility','visible');}catch(_){}
      try{if(m.getLayer(id))m.moveLayer(id);}catch(_){}
    }
    const sourceCount=(id)=>{try{const src=m.getSource(id),data=src&&(src._data||src._options&&src._options.data);return data&&Array.isArray(data.features)?data.features.length:0}catch(_){return 0}};
    window.EARTHLINE_REGIONAL_NATIVE_PUBLICATION_16920={
      build:'EARTHLINE 16920',runToken:String(token||''),
      contours:sourceCount(IDS.contours),flows:sourceCount(IDS.flows),
      swales:sourceCount(IDS.swales),aquifers:sourceCount(IDS.aquifer),
      layers:{
        aquiferFill:!!m.getLayer(IDS.aquiferFill),aquiferLine:!!m.getLayer(IDS.aquiferLine),
        flowLine:!!m.getLayer(IDS.flowLine),flowArrow:!!m.getLayer(IDS.flowArrow),
        swaleLine:!!m.getLayer(IDS.swaleLine)
      },
      rule:'shared atomic Regional native source/layer publication',
      at:new Date().toISOString()
    };
    return true;
  }

'''
    s=s.replace(fn_anchor,fn+fn_anchor,1)

call_anchor=r'''    const regionalOverlayRenderOk16336=
      typeof window.earthlineRenderRegionalOverlay16020==='function'
        ?window.earthlineRenderRegionalOverlay16020(visualData)
        :false;'''
if call_anchor not in s:
    raise SystemExit("atomic Regional render anchor missing")

if "regional native presentation publication failed" not in s:
    call=r'''    if(!earthlinePublishRegionalNative16920(runToken,m,visualData))
      throw new Error('regional native presentation publication failed');
'''+call_anchor
    s=s.replace(call_anchor,call,1)

p.write_text(s,encoding="utf-8")
print("EARTHLINE 16920 shared Regional native publication owner applied")
