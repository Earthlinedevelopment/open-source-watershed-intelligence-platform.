from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
anchor="""        window.EARTHLINE_VANCOUVER_AQUIFER_AUDIT_16912={
          build:"EARTHLINE 16912",runToken,query:String(q||""),source:"Government of British Columbia — Ground Water Aquifers",
          returned:Number(raw16912&&raw16912.features&&raw16912.features.length||0),published:filtered16912.length,
          boundary:"Canadian Geographical Names Database — Vancouver Island (JBRIN)",at:new Date().toISOString()
        };"""
insert=anchor+"""
        try{
          /* EARTHLINE 16915 — Vancouver Island display hierarchy.
             Data already exists; this only guarantees visible stacking/legibility:
             aquifers below runoff paths, runoff paths below proposed swales. */
          if(m.getLayer(IDS.aquiferFill)){
            m.setLayoutProperty(IDS.aquiferFill,'visibility','visible');
            m.setPaintProperty(IDS.aquiferFill,'fill-opacity',0.34);
            m.moveLayer(IDS.aquiferFill);
          }
          if(m.getLayer(IDS.aquiferLine)){
            m.setLayoutProperty(IDS.aquiferLine,'visibility','visible');
            m.setPaintProperty(IDS.aquiferLine,'line-width',3.4);
            m.setPaintProperty(IDS.aquiferLine,'line-opacity',1);
            m.moveLayer(IDS.aquiferLine);
          }
          if(m.getLayer(IDS.flowCasing)){
            m.setLayoutProperty(IDS.flowCasing,'visibility','visible');
            m.setPaintProperty(IDS.flowCasing,'line-opacity',0.98);
            m.moveLayer(IDS.flowCasing);
          }
          if(m.getLayer(IDS.flowLine)){
            m.setLayoutProperty(IDS.flowLine,'visibility','visible');
            m.setPaintProperty(IDS.flowLine,'line-width',['interpolate',['linear'],['zoom'],4,3.8,7,5.2,10,7.0]);
            m.setPaintProperty(IDS.flowLine,'line-opacity',1);
            m.moveLayer(IDS.flowLine);
          }
          if(m.getLayer(IDS.flowArrow)){
            m.setLayoutProperty(IDS.flowArrow,'visibility','visible');
            m.moveLayer(IDS.flowArrow);
          }
          if(m.getLayer(IDS.swaleHalo))m.moveLayer(IDS.swaleHalo);
          if(m.getLayer(IDS.swaleLine))m.moveLayer(IDS.swaleLine);
          window.EARTHLINE_VANCOUVER_DISPLAY_AUDIT_16915={
            build:'EARTHLINE 16915',runToken,
            aquifers:filtered16912.length,
            waterPaths:(flows.features||[]).filter(f=>f&&f.properties&&f.properties.feature_type==='flow').length,
            stacking:'aquifer < flow < swale',
            at:new Date().toISOString()
          };
        }catch(_){}"""
if "EARTHLINE_VANCOUVER_DISPLAY_AUDIT_16915" not in s:
    if anchor not in s: raise SystemExit("Vancouver aquifer audit anchor missing")
    s=s.replace(anchor,insert,1)

context_anchor="""        if(!propertyOwnsDisplay16726)setRunStatus((focusMode?'Focus screening published. ':(isVermont?'Vermont screening published. ':'Regional screening published. '))+(failures16198.length?'Unavailable context: '+failures16198.join(', ')+'. ':'Watershed and groundwater context updated. ')+swaleNote+(!focusMode?earthlineLandValidityStatus16584():''),'published');"""
context_insert="""        if(!propertyOwnsDisplay16726&&!focusMode&&/vancouver\\s+island/i.test(String(q||''))){
          try{
            if(m.getLayer(IDS.aquiferFill)){m.setLayoutProperty(IDS.aquiferFill,'visibility','visible');m.moveLayer(IDS.aquiferFill);}
            if(m.getLayer(IDS.aquiferLine)){m.setLayoutProperty(IDS.aquiferLine,'visibility','visible');m.moveLayer(IDS.aquiferLine);}
            if(m.getLayer(IDS.flowCasing)){m.setLayoutProperty(IDS.flowCasing,'visibility','visible');m.moveLayer(IDS.flowCasing);}
            if(m.getLayer(IDS.flowLine)){m.setLayoutProperty(IDS.flowLine,'visibility','visible');m.moveLayer(IDS.flowLine);}
            if(m.getLayer(IDS.flowArrow)){m.setLayoutProperty(IDS.flowArrow,'visibility','visible');m.moveLayer(IDS.flowArrow);}
            if(m.getLayer(IDS.swaleHalo))m.moveLayer(IDS.swaleHalo);
            if(m.getLayer(IDS.swaleLine))m.moveLayer(IDS.swaleLine);
          }catch(_){}
        }
"""+context_anchor
if "stacking:'aquifer < flow < swale'" not in s: raise SystemExit("Vancouver display patch missing")
if context_insert not in s:
    if context_anchor not in s: raise SystemExit("context completion anchor missing")
    s=s.replace(context_anchor,context_insert,1)
p.write_text(s,encoding="utf-8")
print("patched Vancouver display hierarchy")

# trigger apply
