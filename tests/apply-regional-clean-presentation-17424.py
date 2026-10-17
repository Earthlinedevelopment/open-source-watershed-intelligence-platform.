from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

# 1) Regional renderer: decide corridor geometry visibility from the already-governed
# publication view / zoom state. Labels/tabs remain rendered in all Regional views.
old1="""  function activeTier16168(){const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||null;return String(d&&((d.tier||d.mode))||'regional').toLowerCase();}
  function render(data){"""
new1="""  function activeTier16168(){const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||null;return String(d&&((d.tier||d.mode))||'regional').toLowerCase();}
  function corridorGeometryVisible17424(data){
    const tier17424=activeTier16168();
    if(tier17424!=='regional')return true;
    const map17424=m(),pub17424=window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null;
    const run17424=String(data&&data.runToken||'');
    const z17424=Number(map17424?.getZoom?.());
    if(document.documentElement.classList.contains('earthline-regional-corridors-revealed-17424'))return true;
    if(pub17424&&run17424&&String(pub17424.runToken||'')===run17424&&Number.isFinite(Number(pub17424.zoom))&&Number.isFinite(z17424))
      return z17424>Number(pub17424.zoom)+0.05;
    return false;
  }
  function render(data){"""
if s.count(old1)!=1: raise SystemExit(f"renderer helper anchor {s.count(old1)}")
s=s.replace(old1,new1,1)

old2="""    const clipAttrs=jurisdictionClipD?{'clip-path':'url(#'+jurisdictionClipId+')'}:{},cg=svgEl('g',Object.assign({'data-layer':'numbered-elevation-contours'},clipAttrs)),sg=svgEl('g',Object.assign({'data-layer':'swale-opportunities'},clipAttrs)),lg=svgEl('g',Object.assign({'data-layer':'always-visible-labels'},clipAttrs));el.append(cg,sg,lg);
    let contourLines=0,labels=0,waterPaths=0,arrows=0,swales=0;"""
new2="""    const clipAttrs=jurisdictionClipD?{'clip-path':'url(#'+jurisdictionClipId+')'}:{},cg=svgEl('g',Object.assign({'data-layer':'numbered-elevation-contours'},clipAttrs)),sg=svgEl('g',Object.assign({'data-layer':'swale-opportunities'},clipAttrs)),lg=svgEl('g',Object.assign({'data-layer':'always-visible-labels'},clipAttrs));el.append(cg,sg,lg);
    const renderTier17424=activeTier16168(),showCorridorGeometry17424=corridorGeometryVisible17424(lastData);
    sg.dataset.corridorGeometryVisible17424=showCorridorGeometry17424?'1':'0';
    let contourLines=0,labels=0,waterPaths=0,arrows=0,swales=0;"""
if s.count(old2)!=1: raise SystemExit(f"render setup anchor {s.count(old2)}")
s=s.replace(old2,new2,1)

old3="""      const pts=points(f.geometry.coordinates),len=polyLength(pts),activeTier=activeTier16168();"""
new3="""      const pts=points(f.geometry.coordinates),len=polyLength(pts),activeTier=renderTier17424;"""
if s.count(old3)!=1: raise SystemExit(f"active tier anchor {s.count(old3)}")
s=s.replace(old3,new3,1)

old4="""      }else{
        const regionalZoom=Number(map?.getZoom?.()||6),regionalScale=regionalZoom<7?0.46:(regionalZoom<8?0.62:(regionalZoom<9?0.78:1)),casing=(grade==='A'?15:grade==='B'?12:9)*regionalScale,core=(grade==='A'?9.2:grade==='B'?7.2:5.2)*regionalScale;"""
new4="""      }else if(showCorridorGeometry17424){
        const regionalZoom=Number(map?.getZoom?.()||6),regionalScale=regionalZoom<7?0.46:(regionalZoom<8?0.62:(regionalZoom<9?0.78:1)),casing=(grade==='A'?15:grade==='B'?12:9)*regionalScale,core=(grade==='A'?9.2:grade==='B'?7.2:5.2)*regionalScale;"""
if s.count(old4)!=1: raise SystemExit(f"regional path branch anchor {s.count(old4)}")
s=s.replace(old4,new4,1)

old5="""window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16030=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020={build:'EARTHLINE-REGIONAL-FINAL-16050',contourLines,elevationLabels:labels,waterPaths,directionArrows:arrows,waterOwner:'native-mapbox',svgWaterRendered:false,nativeWaterReady:!!nativeWater.ready,swaleLines:swales,swaleGradeCounts:gradeCounts,swaleGradeLabels:gradeLabels.length,topSwaleGradeLabel:gradeLabels[0]||'',buttonText:(document.getElementById('earthlineMapRun16020')||{}).textContent||'',renderedAt:new Date().toISOString()};"""
new5="""window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16030=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020={build:'EARTHLINE-REGIONAL-FINAL-16050',contourLines,elevationLabels:labels,waterPaths,directionArrows:arrows,waterOwner:'native-mapbox',svgWaterRendered:false,nativeWaterReady:!!nativeWater.ready,swaleLines:swales,swaleGradeCounts:gradeCounts,swaleGradeLabels:gradeLabels.length,topSwaleGradeLabel:gradeLabels[0]||'',corridorGeometryVisible17424:showCorridorGeometry17424,initialRegionalClean17424:renderTier17424==='regional'&&!showCorridorGeometry17424,buttonText:(document.getElementById('earthlineMapRun16020')||{}).textContent||'',renderedAt:new Date().toISOString()};"""
if s.count(old5)!=1: raise SystemExit(f"display audit anchor {s.count(old5)}")
s=s.replace(old5,new5,1)

# 2) Existing progressive-focus owner: toggle reveal state from its existing zoom lifecycle.
old6="""    document.documentElement.dataset.earthlineAnalysisTier=currentTier;
    const svg=document.getElementById(REGIONAL_OVERLAY);"""
new6="""    document.documentElement.dataset.earthlineAnalysisTier=currentTier;
    const revealCorridors17424=currentTier!=='regional'||(regional&&z>visibilityFloor16337+0.05);
    const wasRevealed17424=document.documentElement.classList.contains('earthline-regional-corridors-revealed-17424');
    document.documentElement.classList.toggle('earthline-regional-corridors-revealed-17424',revealCorridors17424);
    if(wasRevealed17424!==revealCorridors17424&&window.EARTHLINE_REGIONAL_VISUAL_DATA_16020&&typeof window.earthlineRenderRegionalOverlay16020==='function'){
      requestAnimationFrame(()=>{try{window.earthlineRenderRegionalOverlay16020(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020)}catch(_){}});
    }
    window.EARTHLINE_REGIONAL_CORRIDOR_VISIBILITY_17424={
      tier:currentTier,zoom:z,publicationZoom:visibilityFloor16337,
      geometryVisible:revealCorridors17424,
      labelsRemainVisible:true,
      waterAndAquiferPriority:true,
      at:new Date().toISOString()
    };
    const svg=document.getElementById(REGIONAL_OVERLAY);"""
if s.count(old6)!=1: raise SystemExit(f"progressive reveal anchor {s.count(old6)}")
s=s.replace(old6,new6,1)

# Reset reveal state on a new Regional search.
old7="""    regionalCache=null;selectedCorridor=null;lastFocusAudit=null;historyTier='home';lastStage='none';document.documentElement.classList.remove('earthline-direct-property-handoff-16250');"""
new7="""    regionalCache=null;selectedCorridor=null;lastFocusAudit=null;historyTier='home';lastStage='none';document.documentElement.classList.remove('earthline-direct-property-handoff-16250','earthline-regional-corridors-revealed-17424');"""
if s.count(old7)!=1: raise SystemExit(f"tier reset anchor {s.count(old7)}")
s=s.replace(old7,new7,1)

# 3) Existing Mapbox swale renderer: keep location labels/hit targets, suppress line worms
# at initial Regional view, restore them once the same existing zoom owner reveals.
old8="""    const focus=t==='focus',property=t==='property';
    for(const id of ORIGINAL)visible(id,!focus&&!property);
    for(const id of Object.values(FOCUS))visible(id,false);"""
new8="""    const focus=t==='focus',property=t==='property';
    const regionalCorridors17424=t==='regional'&&document.documentElement.classList.contains('earthline-regional-corridors-revealed-17424');
    for(const id of ORIGINAL)visible(id,regionalCorridors17424);
    for(const id of Object.values(FOCUS))visible(id,false);"""
if s.count(old8)!=1: raise SystemExit(f"Mapbox original visibility anchor {s.count(old8)}")
s=s.replace(old8,new8,1)

old9="""regionalOriginalVisible:!focus&&!property,focusCrossSectionVisible:focus"""
new9="""regionalOriginalVisible:regionalCorridors17424,regionalLabelsVisible:!property,regionalInitialWormsHidden17424:t==='regional'&&!regionalCorridors17424,focusCrossSectionVisible:focus"""
if s.count(old9)!=1: raise SystemExit(f"render audit visibility anchor {s.count(old9)}")
s=s.replace(old9,new9,1)

# 4) Existing corridor detail "ZOOM TO THIS LOCATION" owner: explicit user
# navigation reveals the already-computed corridor geometry before its existing jump.
old10="""      panel.classList.remove('open');
      try{map()?.stop?.();map()?.jumpTo?.({center:[lng,lat],zoom:Math.max(12.6,Math.min(14,Number(map()?.getZoom?.()||12.6))),bearing:0,pitch:0})}catch(_){}
      return true"""
new10="""      panel.classList.remove('open');
      document.documentElement.classList.add('earthline-regional-corridors-revealed-17424');
      window.EARTHLINE_REGIONAL_CORRIDOR_VISIBILITY_17424={
        tier:'regional',geometryVisible:true,reason:'corridor-zoom-to-location',
        labelsRemainVisible:true,waterAndAquiferPriority:true,at:new Date().toISOString()
      };
      try{
        if(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020&&typeof window.earthlineRenderRegionalOverlay16020==='function')
          window.earthlineRenderRegionalOverlay16020(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020);
      }catch(_){}
      try{map()?.stop?.();map()?.jumpTo?.({center:[lng,lat],zoom:Math.max(12.6,Math.min(14,Number(map()?.getZoom?.()||12.6))),bearing:0,pitch:0})}catch(_){}
      return true"""
if s.count(old10)!=1: raise SystemExit(f"corridor zoom action anchor {s.count(old10)}")
s=s.replace(old10,new10,1)

s="<!-- EARTHLINE_REGIONAL_CLEAN_PRESENTATION_17424: initial Regional keeps corridor tabs/data but suppresses worm geometry until user zooms in; water paths/aquifer context remain primary. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched Regional clean initial presentation 17424")
