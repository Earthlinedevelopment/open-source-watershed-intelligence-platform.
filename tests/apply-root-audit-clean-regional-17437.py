from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""    /* 7 — publication / render */
    if(pub){
      const generated=Number(pub.generated||0),visible=Number(disp&&disp.swaleLines||pub.overlaySwaleLines||0),source=Number(pub.sourceFeatures);
      if(generated!==visible)set('publication-render','critical','Generated corridor count does not equal visible overlay corridor count',{generated,visible,sourceFeatures:Number.isFinite(source)?source:null});
      else if(Number.isFinite(source)&&source!==generated)set('publication-render','fail','Map source corridor count does not equal generated corridor count',{generated,visible,sourceFeatures:source});
      else set('publication-render','clear','Generated, source and visible corridor publication counts agree',{generated,visible,sourceFeatures:Number.isFinite(source)?source:null});
    }"""
new="""    /* 7 — publication / render */
    if(pub){
      const generated=Number(pub.generated||0),visible=Number(disp&&disp.swaleLines||pub.overlaySwaleLines||0),source=Number(pub.sourceFeatures);
      const initialCorridorsSuppressed17437=!!(
        disp&&disp.corridorGeometryVisible===false&&
        Number(disp.generatedSwales||0)===generated&&
        Number(disp.swaleGradeLabels||0)>0
      );
      if(initialCorridorsSuppressed17437){
        if(Number.isFinite(source)&&source!==generated)set('publication-render','fail','Map source corridor count does not equal generated corridor count',{generated,visible,sourceFeatures:source,tabs:Number(disp.swaleGradeLabels||0),corridorGeometryVisible:false});
        else set('publication-render','clear','Generated corridor data and corridor tabs are complete; corridor geometry is intentionally hidden at the initial Regional view',{generated,visible,sourceFeatures:Number.isFinite(source)?source:null,tabs:Number(disp.swaleGradeLabels||0),corridorGeometryVisible:false});
      }else if(generated!==visible)set('publication-render','critical','Generated corridor count does not equal visible overlay corridor count',{generated,visible,sourceFeatures:Number.isFinite(source)?source:null});
      else if(Number.isFinite(source)&&source!==generated)set('publication-render','fail','Map source corridor count does not equal generated corridor count',{generated,visible,sourceFeatures:source});
      else set('publication-render','clear','Generated, source and visible corridor publication counts agree',{generated,visible,sourceFeatures:Number.isFinite(source)?source:null});
    }"""
if s.count(old)!=1: raise SystemExit(f"root publication anchor count {s.count(old)}")
s=s.replace(old,new,1)

s="<!-- EARTHLINE_ROOT_AUDIT_CLEAN_REGIONAL_17437: intentional initial corridor-geometry suppression is valid when data/source/tabs are complete. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched root-cause publication semantics for clean Regional presentation 17437")
