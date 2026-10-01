from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

world_anchor="""    const worldCopies16584=(()=>{try{return !!(mp16584.getRenderWorldCopies&&mp16584.getRenderWorldCopies())}catch(_){return false}})();"""
vancouver_line="""    const vancouverIsland16584=(()=>{try{return String(window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539&&window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539.capability||'')==='ca-cgndb-vancouver-island'}catch(_){return false}})();"""
if "const vancouverIsland16584=" not in s:
    if world_anchor not in s: raise SystemExit("worldCopies anchor missing")
    s=s.replace(world_anchor,world_anchor+"\n"+vancouver_line,1)

old_cond="if(style16584&&Array.isArray(style16584.layers)&&!worldCopies16584){"
new_cond="if(style16584&&Array.isArray(style16584.layers)&&!worldCopies16584&&!vancouverIsland16584){"
if old_cond in s:
    s=s.replace(old_cond,new_cond,1)
elif new_cond not in s:
    raise SystemExit("final style-water condition missing")

old_audit="failClosedNoEvidence:!evidenceReady16584,worldCopiesSkippedStyleWater:worldCopies16584,at:new Date().toISOString()"
new_audit="failClosedNoEvidence:!evidenceReady16584,worldCopiesSkippedStyleWater:worldCopies16584,vancouverIslandSkippedStyleWater:vancouverIsland16584,at:new Date().toISOString()"
if old_audit in s:
    s=s.replace(old_audit,new_audit,1)
elif "vancouverIslandSkippedStyleWater" not in s:
    raise SystemExit("water audit anchor missing")

old_style='''          try{if(m.getLayer(IDS.aquiferFill))m.setLayoutProperty(IDS.aquiferFill,"visibility","visible");}catch(_){}
          try{if(m.getLayer(IDS.aquiferLine))m.setLayoutProperty(IDS.aquiferLine,"visibility","visible");}catch(_){}'''
new_style='''          try{
            if(m.getLayer(IDS.aquiferFill)){
              m.setLayoutProperty(IDS.aquiferFill,"visibility","visible");
              m.setPaintProperty(IDS.aquiferFill,"fill-opacity",0.54);
              m.moveLayer(IDS.aquiferFill);
            }
          }catch(_){}
          try{
            if(m.getLayer(IDS.aquiferLine)){
              m.setLayoutProperty(IDS.aquiferLine,"visibility","visible");
              m.setPaintProperty(IDS.aquiferLine,"line-width",4.0);
              m.setPaintProperty(IDS.aquiferLine,"line-opacity",1);
              m.moveLayer(IDS.aquiferLine);
            }
          }catch(_){}'''
if 'm.setPaintProperty(IDS.aquiferFill,"fill-opacity",0.54)' not in s:
    if old_style not in s: raise SystemExit("Vancouver aquifer style anchor missing")
    s=s.replace(old_style,new_style,1)

p.write_text(s,encoding="utf-8")
print("patched Vancouver valid-flow preservation and official aquifer visibility")
