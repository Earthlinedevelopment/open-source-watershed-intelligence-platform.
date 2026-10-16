from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
anchor="  function earthlineClipLine16539(coords,g){"
if s.count(anchor)!=1: raise SystemExit(f"clip anchor count {s.count(anchor)}")
helper=r'''  const earthlineInteriorEdgeIndex17326=new WeakMap();
  function earthlineInteriorIndex17326(g){
    if(!g||(typeof g!=='object'&&typeof g!=='function'))return null;
    let idx17326=earthlineInteriorEdgeIndex17326.get(g);if(idx17326)return idx17326;
    const prepared17326=earthlinePrepareJurisdiction16539(g);if(!prepared17326)return null;
    const scale17326=16,bins17326=new Map();let id17326=0;
    for(const poly17326 of (prepared17326.polygons||[])){
      const rings17326=[poly17326.outer,...(poly17326.holes||[]).map(h17326=>h17326.ring)];
      for(const ring17326 of rings17326){
        if(!Array.isArray(ring17326)||ring17326.length<2)continue;
        for(let i17326=0,j17326=ring17326.length-1;i17326<ring17326.length;j17326=i17326++){
          const a17326=ring17326[j17326],b17326=ring17326[i17326];
          if(!earthlineFinitePoint16539(a17326)||!earthlineFinitePoint16539(b17326))continue;
          const minx17326=Math.min(Number(a17326[0]),Number(b17326[0])),maxx17326=Math.max(Number(a17326[0]),Number(b17326[0])),
                miny17326=Math.min(Number(a17326[1]),Number(b17326[1])),maxy17326=Math.max(Number(a17326[1]),Number(b17326[1])),
                e17326={id:id17326++,minx:minx17326,maxx:maxx17326,miny:miny17326,maxy:maxy17326};
          const x0=Math.floor(minx17326*scale17326),x1=Math.floor(maxx17326*scale17326),y0=Math.floor(miny17326*scale17326),y1=Math.floor(maxy17326*scale17326);
          for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const k=x+','+y;let list=bins17326.get(k);if(!list)bins17326.set(k,list=[]);list.push(e17326);}
        }
      }
    }
    idx17326={prepared:prepared17326,scale:scale17326,bins:bins17326};earthlineInteriorEdgeIndex17326.set(g,idx17326);return idx17326;
  }
  function earthlineCertifiedInteriorLine17326(raw17326,g17326){
    if(!Array.isArray(raw17326)||raw17326.length<2||!g17326)return false;
    const idx17326=earthlineInteriorIndex17326(g17326);if(!idx17326)return false;
    const probe17326=raw17326[Math.floor((raw17326.length-1)/2)];
    if(!earthlinePointInJurisdiction16539(probe17326,idx17326.prepared))return false;
    let minx=Infinity,maxx=-Infinity,miny=Infinity,maxy=-Infinity;
    for(const p17326 of raw17326){const x=Number(p17326[0]),y=Number(p17326[1]);if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;}
    const x0=Math.floor(minx*idx17326.scale),x1=Math.floor(maxx*idx17326.scale),y0=Math.floor(miny*idx17326.scale),y1=Math.floor(maxy*idx17326.scale),seen=new Set();
    for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(const e of (idx17326.bins.get(x+','+y)||[])){
      if(seen.has(e.id))continue;seen.add(e.id);
      if(e.maxx>=minx&&e.minx<=maxx&&e.maxy>=miny&&e.miny<=maxy)return false;
    }
    return true;
  }
'''
s=s.replace(anchor,helper+anchor,1)
old="""    const pts=[raw[0]];for(let i=1;i<raw.length;i++){const a=raw[i-1],b=raw[i],steps=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b[0])-Number(a[0])),Math.abs(Number(b[1])-Number(a[1])))/.01));for(let k=1;k<=steps;k++)pts.push(earthlineInterpolate16539(a,b,k/steps));}
    if(g&&g.earthlineCertifiedInterior16850===true)return [pts];
    const runs=[];"""
new="""    const pts=[raw[0]];for(let i=1;i<raw.length;i++){const a=raw[i-1],b=raw[i],steps=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b[0])-Number(a[0])),Math.abs(Number(b[1])-Number(a[1])))/.01));for(let k=1;k<=steps;k++)pts.push(earthlineInterpolate16539(a,b,k/steps));}
    if(g&&g.earthlineCertifiedInterior16850===true)return [pts];
    if(earthlineCertifiedInteriorLine17326(raw,g))return [pts];
    const runs=[];"""
if s.count(old)!=1: raise SystemExit(f"clip body anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_2D_INTERIOR_CLIP_FASTPATH_17326: exact conservative interior certification using 2-D boundary-edge boxes; boundary-near lines retain full authoritative clip. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed 2-D certified interior line fastpath 17326")
