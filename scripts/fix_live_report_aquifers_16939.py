from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')

old="""const acceptedAudit=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_AUDIT_16373||null;
    const accepted=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_GEOJSON_16373||null;
    if(accepted&&Array.isArray(accepted.features)&&(!acceptedAudit?.runToken||String(acceptedAudit.runToken)===token))accepted.features.forEach(addFeature);
    const v=visual();if(v&&v.aquifers&&Array.isArray(v.aquifers.features))v.aquifers.features.forEach(addFeature);
    const rows=(typeof M!=="undefined"&&Array.isArray(M.usgsAquifers))?M.usgsAquifers:[];"""
new="""const acceptedAudit=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_AUDIT_16373||null;
    const accepted=window.EARTHLINE_ACCEPTED_REGIONAL_AQUIFER_GEOJSON_16373||null;
    if(accepted&&Array.isArray(accepted.features)&&(!acceptedAudit?.runToken||String(acceptedAudit.runToken)===token))accepted.features.forEach(addFeature);
    const inheritedProperty=window.EARTHLINE_PROPERTY_INHERITED_AQUIFER_CONTEXT_16373||null;
    if(inheritedProperty&&Array.isArray(inheritedProperty.polys)){
      inheritedProperty.polys.forEach((poly,k)=>addFeature({type:'Feature',properties:{name:String(poly&&poly.name||'Mapped aquifer context'),source:String(poly&&poly.source||inheritedProperty.source||'Inherited official aquifer context'),report_context_only:true,index:k},geometry:{type:'Polygon',coordinates:[(poly&&Array.isArray(poly.lngLatPts)?poly.lngLatPts:[]).map(c=>[Number(c[0]),Number(c[1])]).filter(c=>Number.isFinite(c[0])&&Number.isFinite(c[1]))]}}));
    }
    const v=visual();if(v&&v.aquifers&&Array.isArray(v.aquifers.features))v.aquifers.features.forEach(addFeature);
    const rows=(typeof M!=="undefined"&&Array.isArray(M.usgsAquifers))?M.usgsAquifers:[];"""
if old not in s: raise SystemExit('live report aquifer cache owner not found')
s=s.replace(old,new,1)

old2="""try{
      const m=map();
      for(const id of ['el-live-aquifer-15970','earthline-aquifer-evidence','earthline-aquifer-material','earthline-recharge-zones']){
        const src=m?.getSource?.(id),data=src&&(src._data||src._options&&src._options.data);
        if(data&&Array.isArray(data.features))data.features.forEach(addFeature);
      }
      for(const id of Object.keys(m?.getStyle?.().sources||{}).filter(id=>/aquifer/i.test(id))){
        const src=m?.getSource?.(id),data=src&&(src._data||src._options&&src._options.data);
        if(data&&Array.isArray(data.features))data.features.forEach(addFeature);
      }
    }catch(_){}"""
new2="""try{
      const m=map(),style=m?.getStyle?.()||{};
      const layers=(style.layers||[]).filter(l=>/aquifer/i.test(String(l?.id||'')+' '+String(l?.source||'')+' '+String(l&&l['source-layer']||'')));
      const layerIds=layers.map(l=>l.id).filter(Boolean);
      if(layerIds.length&&m?.queryRenderedFeatures){
        try{(m.queryRenderedFeatures({layers:layerIds})||[]).forEach(addFeature)}catch(_){}
      }
      for(const l of layers){
        if(!l?.source||!m?.querySourceFeatures)continue;
        const opts=l['source-layer']?{sourceLayer:l['source-layer']}:{};
        try{(m.querySourceFeatures(l.source,opts)||[]).forEach(addFeature)}catch(_){}
      }
      const sourceIds=new Set(['el-live-aquifer-15970','earthline-aquifers','earthline-aquifer-evidence','earthline-aquifer-material']);
      Object.keys(style.sources||{}).filter(id=>/aquifer/i.test(id)).forEach(id=>sourceIds.add(id));
      for(const id of sourceIds){
        const src=m?.getSource?.(id),candidates=[];
        const data=src&&(src._data||src._options&&src._options.data);
        if(data&&Array.isArray(data.features))candidates.push(...data.features);
        try{const ser=src?.serialize?.(),sd=ser&&ser.data;if(sd&&Array.isArray(sd.features))candidates.push(...sd.features)}catch(_){}
        try{const q=m?.querySourceFeatures?.(id)||[];if(Array.isArray(q))candidates.push(...q)}catch(_){}
        candidates.forEach(addFeature);
      }
    }catch(_){}"""
if old2 not in s: raise SystemExit('live report aquifer map-source owner not found')
s=s.replace(old2,new2,1)

s=s.replace("const title='Earthline Screening Map'+(reportPlace?' · '+reportPlace:'')+' · '+(reportTier==='focus'?'Focus':'Regional');",
            "const title='Earthline Water + Recharge Opportunity Map'+(reportPlace?' · '+reportPlace:'')+' · '+(reportTier==='focus'?'Focus':'Regional');",1)
s=s.replace('stroke="#ffffff" stroke-width="1.65" opacity=".46"','stroke="#fffdfa" stroke-width="3.2" opacity=".86"',1)
s=s.replace('stroke="#2188b2" stroke-width=".88" opacity=".72"','stroke="#087bb4" stroke-width="1.8" opacity=".98"',1)
s=s.replace("mainW=r.grade==='A'?2.2:r.grade==='B'?1.7:1.25","mainW=r.grade==='A'?4.2:r.grade==='B'?3.4:2.8",1)
s=s.replace("alpha=r.grade==='A'?'.9':r.grade==='B'?'.77':'.48'","alpha=r.grade==='A'?'.98':r.grade==='B'?'.9':'.75'",1)

p.write_text(s)
