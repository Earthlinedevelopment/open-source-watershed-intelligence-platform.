from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
anchor="""    const jurisdictionBoundaryIndex17373=(()=>{
      if(!jurisdictionFastGeometry17373)return null;"""
if s.count(anchor)!=1: raise SystemExit("boundary index anchor missing")
# Insert fast PIP index just before boundary index definition.
insert=r'''    const jurisdictionFastPipIndex17378=(()=>{
      if(!jurisdictionFastGeometry17373)return null;
      const prepared17378=earthlinePrepareJurisdiction16539(jurisdictionFastGeometry17373);
      if(!prepared17378||!Array.isArray(prepared17378.polygons))return null;
      const scale17378=96;
      const buildRing17378=(ring17378)=>{
        const bins17378=new Map();
        if(!Array.isArray(ring17378)||ring17378.length<3)return {bins:bins17378};
        for(let i17378=0,j17378=ring17378.length-1;i17378<ring17378.length;j17378=i17378++){
          const a17378=ring17378[j17378],b17378=ring17378[i17378];
          if(!earthlineFinitePoint16539(a17378)||!earthlineFinitePoint16539(b17378))continue;
          const x1=Number(a17378[0]),y1=Number(a17378[1]),x2=Number(b17378[0]),y2=Number(b17378[1]);
          if(y1===y2)continue;
          const lo17378=Math.floor(Math.min(y1,y2)*scale17378),hi17378=Math.floor(Math.max(y1,y2)*scale17378);
          const edge17378=[x1,y1,x2,y2];
          for(let bin17378=lo17378;bin17378<=hi17378;bin17378++){
            let list17378=bins17378.get(bin17378);if(!list17378)bins17378.set(bin17378,list17378=[]);list17378.push(edge17378);
          }
        }
        return {bins:bins17378};
      };
      const polygons17378=[];
      for(const poly17378 of prepared17378.polygons){
        polygons17378.push({
          bbox:poly17378.bbox,
          outer:buildRing17378(poly17378.outer),
          holes:(poly17378.holes||[]).map(h17378=>({bbox:h17378.bbox,index:buildRing17378(h17378.ring)}))
        });
      }
      return {scale:scale17378,polygons:polygons17378};
    })();
    function jurisdictionFastContains17378(p17378){
      const idx17378=jurisdictionFastPipIndex17378;
      if(!idx17378||!earthlineFinitePoint16539(p17378))return earthlinePointInJurisdiction16539(p17378,jurisdictionFastGeometry17373);
      const x17378=Number(p17378[0]),y17378=Number(p17378[1]),bin17378=Math.floor(y17378*idx17378.scale);
      const insideRing17378=(ringIdx17378)=>{
        let inside17378=false;
        for(const e17378 of (ringIdx17378.bins.get(bin17378)||[])){
          const x1=e17378[0],y1=e17378[1],x2=e17378[2],y2=e17378[3];
          if(((y2>y17378)!==(y1>y17378))&&(x17378<(x1-x2)*(y17378-y2)/((y1-y2)||1e-15)+x2))inside17378=!inside17378;
        }
        return inside17378;
      };
      for(const poly17378 of idx17378.polygons){
        const b17378=poly17378.bbox;
        if(!b17378||x17378<b17378[0]||x17378>b17378[2]||y17378<b17378[1]||y17378>b17378[3])continue;
        if(!insideRing17378(poly17378.outer))continue;
        let hole17378=false;
        for(const h17378 of poly17378.holes){
          const hb17378=h17378.bbox;
          if(hb17378&&x17378>=hb17378[0]&&x17378<=hb17378[2]&&y17378>=hb17378[1]&&y17378<=hb17378[3]&&insideRing17378(h17378.index)){hole17378=true;break;}
        }
        if(!hole17378)return true;
      }
      return false;
    }
'''
s=s.replace(anchor,insert+anchor,1)
old="if(!earthlinePointInJurisdiction16539(probe17373,jurisdictionFastGeometry17373)){"
new="if(!jurisdictionFastContains17378(probe17373)){"
if s.count(old)!=1: raise SystemExit("fast PIP call anchor missing")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_FAST_PIP_ROW_INDEX_17378: finer exact numeric row index for no-boundary-contact candidate containment; authoritative boundary-touching clip unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed fast exact PIP row index 17378")
