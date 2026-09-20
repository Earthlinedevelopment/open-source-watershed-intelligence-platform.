from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name,old,new):
    global s
    n=s.count(old)
    if n!=1: raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

old_screen="""      const segment16539=runs16539[0];
      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<Math.max(4,Math.min(10,Number(candidate16539&&candidate16539.minLinePx16632)||10))){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}"""
new_screen="""      const segment16539=runs16539[0];
      const minimumScreenPx16737=candidate16539&&candidate16539.coverageGap16731
        ?0.75
        :Math.max(4,Math.min(10,Number(candidate16539&&candidate16539.minLinePx16632)||10));
      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<minimumScreenPx16737){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}"""
patch("boundary-length",old_screen,new_screen)

old_group="""      for(const c16736 of candidates){
        if(!c16736||!Number.isFinite(Number(c16736.x))||!Number.isFinite(Number(c16736.y)))continue;
        const bx16736=Math.max(0,Math.min(5,Math.floor(Number(c16736.x)*6/Math.max(1,hy.w))));
        const by16736=Math.max(0,Math.min(5,Math.floor(Number(c16736.y)*6/Math.max(1,hy.h))));
        const key16736=bx16736+','+by16736;let list16736=coverageGroups16736.get(key16736);"""
new_group="""      for(const c16736 of candidates){
        if(!c16736)continue;
        const seg16736=Array.isArray(c16736.segment)?c16736.segment:[],mid16736=seg16736[Math.floor((seg16736.length-1)/2)]||null;
        const mg16736=mid16736?llGrid(hy,mid16736):null;
        const gx16736=mg16736&&Number.isFinite(Number(mg16736.x))?Number(mg16736.x):Number(c16736.x);
        const gy16736=mg16736&&Number.isFinite(Number(mg16736.y))?Number(mg16736.y):Number(c16736.y);
        if(!Number.isFinite(gx16736)||!Number.isFinite(gy16736))continue;
        const bx16736=Math.max(0,Math.min(5,Math.floor(gx16736*6/Math.max(1,hy.w))));
        const by16736=Math.max(0,Math.min(5,Math.floor(gy16736*6/Math.max(1,hy.h))));
        const key16736=bx16736+','+by16736;let list16736=coverageGroups16736.get(key16736);"""
patch("precise-bin",old_group,new_group)

old_audit="""window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16736',candidateBins:coverageGroups16736.size,reserved:coverageReserved16736.length,rows:coverageReserved16736,rule:'reserve one highest-scoring jurisdiction-screened candidate in every occupied 6x6 candidate bin before statewide score/spacing fill',at:new Date().toISOString()};"""
new_audit="""window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16737',candidateBins:coverageGroups16736.size,reserved:coverageReserved16736.length,rows:coverageReserved16736,rule:'reserve one highest-scoring jurisdiction-screened candidate in every occupied 6x6 bin using the actual screened segment midpoint; verified coverage-gap clips may survive below the old 4 px regional display cutoff',at:new Date().toISOString()};"""
patch("audit",old_audit,new_audit)

p.write_text(s,encoding="utf-8")
print("16737 applied")
