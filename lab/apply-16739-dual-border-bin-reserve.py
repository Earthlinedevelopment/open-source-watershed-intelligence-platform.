from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name,old,new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

old="""      for(const c16736 of candidates){
        if(!c16736)continue;
        const seg16736=Array.isArray(c16736.segment)?c16736.segment:[],mid16736=seg16736[Math.floor((seg16736.length-1)/2)]||null;
        const mg16736=mid16736?llGrid(hy,mid16736):null;
        const gx16736=mg16736&&Number.isFinite(Number(mg16736.x))?Number(mg16736.x):Number(c16736.x);
        const gy16736=mg16736&&Number.isFinite(Number(mg16736.y))?Number(mg16736.y):Number(c16736.y);
        if(!Number.isFinite(gx16736)||!Number.isFinite(gy16736))continue;
        const bx16736=Math.max(0,Math.min(5,Math.floor(gx16736*6/Math.max(1,hy.w))));
        const by16736=Math.max(0,Math.min(5,Math.floor(gy16736*6/Math.max(1,hy.h))));
        const key16736=bx16736+','+by16736;let list16736=coverageGroups16736.get(key16736);
        if(!list16736)coverageGroups16736.set(key16736,list16736=[]);
        list16736.push(c16736);
      }"""

new="""      for(const c16736 of candidates){
        if(!c16736)continue;
        const seg16736=Array.isArray(c16736.segment)?c16736.segment:[],mid16736=seg16736[Math.floor((seg16736.length-1)/2)]||null;
        const mg16736=mid16736?llGrid(hy,mid16736):null;
        const coords16739=[];
        if(Number.isFinite(Number(c16736.x))&&Number.isFinite(Number(c16736.y)))coords16739.push([Number(c16736.x),Number(c16736.y),'source']);
        if(mg16736&&Number.isFinite(Number(mg16736.x))&&Number.isFinite(Number(mg16736.y)))coords16739.push([Number(mg16736.x),Number(mg16736.y),'clipped-midpoint']);
        const seenBins16739=new Set();
        for(const row16739 of coords16739){
          const gx16736=row16739[0],gy16736=row16739[1];
          const bx16736=Math.max(0,Math.min(5,Math.floor(gx16736*6/Math.max(1,hy.w))));
          const by16736=Math.max(0,Math.min(5,Math.floor(gy16736*6/Math.max(1,hy.h))));
          const key16736=bx16736+','+by16736;
          if(seenBins16739.has(key16736))continue;seenBins16739.add(key16736);
          let list16736=coverageGroups16736.get(key16736);
          if(!list16736)coverageGroups16736.set(key16736,list16736=[]);
          list16736.push(c16736);
        }
      }"""
patch("dual-bin-group",old,new)

old2="""window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16737',candidateBins:coverageGroups16736.size,reserved:coverageReserved16736.length,rows:coverageReserved16736,rule:'reserve one highest-scoring jurisdiction-screened candidate in every occupied 6x6 bin using the actual screened segment midpoint; verified coverage-gap clips may survive below the old 4 px regional display cutoff',at:new Date().toISOString()};"""
new2="""window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16739',candidateBins:coverageGroups16736.size,reserved:coverageReserved16736.length,rows:coverageReserved16736,dualBorderBin:true,rule:'reserve one highest-scoring jurisdiction-screened candidate for both its source 6x6 terrain bin and its post-clip midpoint bin so boundary clipping cannot erase the only corridor representation for a border sector',at:new Date().toISOString()};"""
patch("audit",old2,new2)

p.write_text(s,encoding="utf-8")
print("16739 applied")
