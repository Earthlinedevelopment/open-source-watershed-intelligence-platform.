from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name,old,new):
    global s
    n=s.count(old)
    if n!=1: raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

old1="""      for(const [key16736,list16736] of coverageGroups16736){
        list16736.sort((a16736,b16736)=>(Number(b16736.score)||0)-(Number(a16736.score)||0));
        const c16736=list16736[0];if(c16736&&!chosen.includes(c16736)){chosen.push(c16736);coverageReserved16736.push({key:key16736,x:c16736.x,y:c16736.y,score:Number(c16736.score)||0,refined:!!(c16736.refined16710||c16736.refined16702),coverageGap:!!c16736.coverageGap16731});}
      }
    }
    window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16739',candidateBins:coverageGroups16736.size,reserved:coverageReserved16736.length,rows:coverageReserved16736,dualBorderBin:true,rule:'reserve one highest-scoring jurisdiction-screened candidate for both its source 6x6 terrain bin and its post-clip midpoint bin so boundary clipping cannot erase the only corridor representation for a border sector',at:new Date().toISOString()};"""

new1="""      for(const [key16736,list16736] of coverageGroups16736){
        list16736.sort((a16736,b16736)=>(Number(b16736.score)||0)-(Number(a16736.score)||0));
        const reserve16755=[];
        if(list16736[0])reserve16755.push(list16736[0]);
        if(list16736.length>=6){
          const first16755=list16736[0];
          const second16755=list16736.find((c16755,i16755)=>i16755>0&&Math.hypot(Number(c16755.x)-Number(first16755.x),Number(c16755.y)-Number(first16755.y))>=2);
          if(second16755)reserve16755.push(second16755);
        }
        for(const c16736 of reserve16755){
          if(c16736&&!chosen.includes(c16736)){
            chosen.push(c16736);
            coverageReserved16736.push({key:key16736,x:c16736.x,y:c16736.y,score:Number(c16736.score)||0,refined:!!(c16736.refined16710||c16736.refined16702),coverageGap:!!c16736.coverageGap16731,densityReserve16755:true});
          }
        }
      }
    }
    const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));
    window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16755',candidateBins:coverageGroups16736.size,reserved:coverageReserved16736.length,capacity:regionalCapacity16755,rows:coverageReserved16736,dualBorderBin:true,densityReserve:true,rule:'reserve a second spatially distinct valid candidate in candidate-rich 6x6 sectors and scale Regional capacity from 80 up to 120 by occupied terrain sectors; science gates and final score ordering are unchanged',at:new Date().toISOString()};"""
patch("density reserve",old1,new1)

old2="""    for(const c of candidates){
      if(chosen.length>=80)break;"""
new2="""    for(const c of candidates){
      if(chosen.length>=regionalCapacity16755)break;"""
patch("dynamic capacity",old2,new2)

old3="""      chosen:chosen.length,
      refined:chosen.filter(c16717=>c16717&&(c16717.refined16710||c16717.refined16702)).length,"""
new3="""      chosen:chosen.length,
      capacity16755:regionalCapacity16755,
      refined:chosen.filter(c16717=>c16717&&(c16717.refined16710||c16717.refined16702)).length,"""
patch("rank audit capacity",old3,new3)

p.write_text(s,encoding="utf-8")
print("16755 applied")
