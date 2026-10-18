from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""  function activeTier16168(){const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||null;return String(d&&((d.tier||d.mode))||'regional').toLowerCase();}
  function render(data){lastData=data||lastData;if(!lastData)return false;const map=m(),el=overlay();if(!map||!el)return false;const resizeRunToken16020=String(lastData&&lastData.runToken||'');"""
new="""  function activeTier16168(){const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||null;return String(d&&((d.tier||d.mode))||'regional').toLowerCase();}
  function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus')return true;
    if(tier==='property')return false;
    const published=window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null;
    const publishedZoom=Number(published&&published.zoom),currentZoom=Number(map?.getZoom?.());
    if(!Number.isFinite(currentZoom))return false;
    if(!Number.isFinite(publishedZoom))return false;
    return currentZoom>=publishedZoom+0.85;
  }
  function render(data){lastData=data||lastData;if(!lastData)return false;const map=m(),el=overlay();if(!map||!el)return false;const corridorGeometryVisible17434Now=corridorGeometryVisible17434(map);const resizeRunToken16020=String(lastData&&lastData.runToken||'');"""
if s.count(old)!=1: raise SystemExit(f"render owner anchor count {s.count(old)}")
s=s.replace(old,new,1)

old="""    let contourLines=0,labels=0,waterPaths=0,arrows=0,swales=0;"""
new="""    let contourLines=0,labels=0,waterPaths=0,arrows=0,swales=0,visibleSwales17434=0;"""
if s.count(old)!=1: raise SystemExit(f"render counters anchor count {s.count(old)}")
s=s.replace(old,new,1)

old="""      }else{
        const regionalZoom=Number(map?.getZoom?.()||6),regionalScale=regionalZoom<7?0.46:(regionalZoom<8?0.62:(regionalZoom<9?0.78:1)),casing=(grade==='A'?15:grade==='B'?12:9)*regionalScale,core=(grade==='A'?9.2:grade==='B'?7.2:5.2)*regionalScale;
        addPath(sg,pts,{stroke:'rgba(8,18,13,.96)','stroke-width':String(casing),'stroke-linecap':'round','stroke-linejoin':'round'});
        addPath(sg,pts,{class:'earthline-swale-core-16168','data-swale-index':String(swales),stroke:main,'stroke-width':String(core),'stroke-linecap':'round','stroke-linejoin':'round',filter:'url(#elGlow16020)'});
        addPath(sg,pts,{stroke:light,'stroke-width':String((grade==='A'?1.8:1.2)*regionalScale),'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':grade==='C'?'6 9':'10 7'});
      }"""
new="""      }else if(corridorGeometryVisible17434Now){
        const regionalZoom=Number(map?.getZoom?.()||6),regionalScale=regionalZoom<7?0.46:(regionalZoom<8?0.62:(regionalZoom<9?0.78:1)),casing=(grade==='A'?15:grade==='B'?12:9)*regionalScale,core=(grade==='A'?9.2:grade==='B'?7.2:5.2)*regionalScale;
        addPath(sg,pts,{stroke:'rgba(8,18,13,.96)','stroke-width':String(casing),'stroke-linecap':'round','stroke-linejoin':'round'});
        addPath(sg,pts,{class:'earthline-swale-core-16168','data-swale-index':String(swales),stroke:main,'stroke-width':String(core),'stroke-linecap':'round','stroke-linejoin':'round',filter:'url(#elGlow16020)'});
        addPath(sg,pts,{stroke:light,'stroke-width':String((grade==='A'?1.8:1.2)*regionalScale),'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':grade==='C'?'6 9':'10 7'});
        visibleSwales17434++;
      }"""
if s.count(old)!=1: raise SystemExit(f"regional worm anchor count {s.count(old)}")
s=s.replace(old,new,1)

old="""    window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16030=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020={build:'EARTHLINE-REGIONAL-FINAL-16050',contourLines,elevationLabels:labels,waterPaths,directionArrows:arrows,waterOwner:'native-mapbox',svgWaterRendered:false,nativeWaterReady:!!nativeWater.ready,swaleLines:swales,swaleGradeCounts:gradeCounts,swaleGradeLabels:gradeLabels.length,topSwaleGradeLabel:gradeLabels[0]||'',buttonText:(document.getElementById('earthlineMapRun16020')||{}).textContent||'',renderedAt:new Date().toISOString()};return labels>0&&waterPaths>0&&nativeWater.ready&&swales>0&&gradeCounts.A>0&&gradeLabels.length>0;"""
new="""    window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16030=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020={build:'EARTHLINE-REGIONAL-FINAL-16050',contourLines,elevationLabels:labels,waterPaths,directionArrows:arrows,waterOwner:'native-mapbox',svgWaterRendered:false,nativeWaterReady:!!nativeWater.ready,swaleLines:visibleSwales17434,generatedSwales:swales,corridorGeometryVisible:corridorGeometryVisible17434Now,swaleGradeCounts:gradeCounts,swaleGradeLabels:gradeLabels.length,topSwaleGradeLabel:gradeLabels[0]||'',buttonText:(document.getElementById('earthlineMapRun16020')||{}).textContent||'',renderedAt:new Date().toISOString()};return labels>0&&waterPaths>0&&nativeWater.ready&&swales>0&&gradeCounts.A>0&&gradeLabels.length>0;"""
if s.count(old)!=1: raise SystemExit(f"display audit anchor count {s.count(old)}")
s=s.replace(old,new,1)

old="""    if(swaleCount>0&&overlayAudit&&Number(overlayAudit.swaleLines||0)===0){
      try{
        clearLive();
        window.EARTHLINE_REGIONAL_VISUAL_DATA_16020=null;
        document.getElementById('earthlineRegionalVectorOverlay16020')?.replaceChildren();
        document.getElementById('earthlineRegionalCorridorTabs16323')?.remove();
      }catch(_){}
      throw new Error('corridor rendering incomplete: '+swaleCount+' corridors were generated but the visible overlay rendered zero');
    }"""
new="""    if(swaleCount>0&&overlayAudit&&Number(overlayAudit.swaleGradeLabels||0)===0){
      try{
        clearLive();
        window.EARTHLINE_REGIONAL_VISUAL_DATA_16020=null;
        document.getElementById('earthlineRegionalVectorOverlay16020')?.replaceChildren();
        document.getElementById('earthlineRegionalCorridorTabs16323')?.remove();
      }catch(_){}
      throw new Error('corridor presentation incomplete: '+swaleCount+' corridors were generated but zero corridor tabs/labels rendered');
    }"""
if s.count(old)!=1: raise SystemExit(f"publication completeness anchor count {s.count(old)}")
s=s.replace(old,new,1)

s="<!-- EARTHLINE_REGIONAL_CLEAN_PRESENTATION_17434: initial Regional shows water/aquifer context + corridor tabs; corridor worms render only after zoom-in. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched clean Regional corridor presentation 17434")
