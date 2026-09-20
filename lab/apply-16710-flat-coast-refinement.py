from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name,old,new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

patch(
    "coarse-trigger",
    "if(!focusMode&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>10000&&hy.outsideLandMask16632&&hy.validityMask16584){",
    "if(!focusMode&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>=12000&&hy.outsideLandMask16632&&hy.validityMask16584){"
)

patch(
    "coarse-slope-cap",
    "if(Number.isFinite(sp16705)&&sp16705>=.20&&sp16705<=13.5&&Number.isFinite(ac16705)&&ac16705<channelTrigger16705)screenPass16705++;",
    "if(Number.isFinite(sp16705)&&sp16705>=.20&&sp16705<=4&&Number.isFinite(ac16705)&&ac16705<channelTrigger16705)screenPass16705++;"
)

patch(
    "refined-slope-levels",
    "if(Number.isFinite(sp)&&sp>=.20&&sp<=13.5&&Number.isFinite(ac)&&ac<channel16702&&Number.isFinite(el))elevs16702.push(el);",
    "if(Number.isFinite(sp)&&sp>=.20&&sp<=4&&Number.isFinite(ac)&&ac<channel16702&&Number.isFinite(el))elevs16702.push(el);"
)

patch(
    "refined-row-filter",
    """const rows=(s16702.features||[]).map(f=>{const seg=f.geometry&&f.geometry.coordinates||[],mid=seg[Math.floor((seg.length-1)/2)]||null,dd=mid?dist16702(mid):null,km=Number.isFinite(dd)?dd*Math.max(h16702.cellX,h16702.cellY)/1000:null;return {f,seg,mid,km};}).filter(r=>Number.isFinite(r.km)&&r.km<=20).sort((a,b)=>(b.f.properties?.score||0)-(a.f.properties?.score||0));""",
    """const rows=(s16702.features||[]).map(f=>{const seg=f.geometry&&f.geometry.coordinates||[],mid=seg[Math.floor((seg.length-1)/2)]||null,dd=mid?dist16702(mid):null,km=Number.isFinite(dd)?dd*Math.max(h16702.cellX,h16702.cellY)/1000:null,sp=Number(f.properties&&f.properties.slope_pct);return {f,seg,mid,km,sp};}).filter(r=>Number.isFinite(r.km)&&r.km<=20&&Number.isFinite(r.sp)&&r.sp>=.20&&r.sp<=4).sort((a,b)=>(b.f.properties?.score||0)-(a.f.properties?.score||0));"""
)

patch(
    "trigger-audit",
    "window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705={maxCellM:Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0),coastalCells:coastalCells16705,screenPass:screenPass16705,screenPassRatio:screenPassRatio16705,triggered:scaleRefineTrigger16705,at:new Date().toISOString()};",
    "window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705={maxCellM:Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0),coastalCells:coastalCells16705,screenPass:screenPass16705,screenPassRatio:screenPassRatio16705,triggered:scaleRefineTrigger16705,slopeBand:'0.2-4%',minCellM:12000,rule:'refine only coarse coastal grids with <=2% usable low-slope screening cells',at:new Date().toISOString()};"
)

p.write_text(s,encoding="utf-8")
print("16710 applied in-place to existing 16702 refinement owner")
