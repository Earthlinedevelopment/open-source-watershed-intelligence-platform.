from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old1="""    (window.EARTHLINE_MAKESWALES_POSTSKIP_17314||(window.EARTHLINE_MAKESWALES_POSTSKIP_17314=[])).push(row17314);
    candidates.sort((a,b)=>b.score-a.score);"""
new1="""    (window.EARTHLINE_MAKESWALES_POSTSKIP_17314||(window.EARTHLINE_MAKESWALES_POSTSKIP_17314=[])).push(row17314);
    const phase17334SelectionStart=performance.now();
    candidates.sort((a,b)=>b.score-a.score);"""
if s.count(old1)!=1: raise SystemExit(f"selection start anchor {s.count(old1)}")
s=s.replace(old1,new1,1)

old2="""    const features=[],total=Math.max(1,acceptedChosen.length);"""
new2="""    const phase17334FeaturesStart=performance.now();
    const features=[],total=Math.max(1,acceptedChosen.length);"""
if s.count(old2)!=1: raise SystemExit(f"features start anchor {s.count(old2)}")
s=s.replace(old2,new2,1)

old3="""window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;
    return {type:'FeatureCollection',features};"""
new3="""    const phase17334End=performance.now();
    row17314.postScreenSelectionMs=Math.round(phase17334FeaturesStart-phase17334SelectionStart);
    row17314.featureBuildMs=Math.round(phase17334End-phase17334FeaturesStart);
    row17314.afterScreenTotalMs=Math.round(phase17334End-phase17334SelectionStart);
    window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;
    return {type:'FeatureCollection',features};"""
if s.count(old3)!=1: raise SystemExit(f"selection end anchor {s.count(old3)}")
s=s.replace(old3,new3,1)

p.write_text(s,encoding="utf-8")
print("instrumented post-screen selection phases 17334")
