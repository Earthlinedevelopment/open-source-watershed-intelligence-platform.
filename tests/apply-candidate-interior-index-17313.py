from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
anchor="""  function earthlineClipLine16539(coords,g){
    const raw=(coords||[]).filter(earthlineFinitePoint16539);if(raw.length<2)return [];
    const pts=[raw[0]];for(let i=1;i<raw.length;i++){const a=raw[i-1],b=raw[i],steps=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b[0])-Number(a[0])),Math.abs(Number(b[1])-Number(a[1])))/.01));for(let k=1;k<=steps;k++)pts.push(earthlineInterpolate16539(a,b,k/steps));}
    if(g&&g.earthlineCertifiedInterior16850===true)return [pts];"""
insert="""  const earthlineCandidateBoundaryBins17313=new WeakMap();
  function earthlineCandidateBoundaryIndex17313(g){
    if(!g||(typeof g!=='object'&&typeof g!=='function'))return null;
    if(earthlineCandidateBoundaryBins17313.has(g))return earthlineCandidateBoundaryBins17313.get(g);
    const source17313=earthlineBoundaryBoxes16850(g);if(!source17313)return null;
    const scale17313=4,bins17313=new Map();
    for(const box17313 of source17313.boxes||[]){
      const lo17313=Math.floor(Number(box17313[1])*scale17313),hi17313=Math.floor(Number(box17313[3])*scale17313);
      for(let bin17313=lo17313;bin17313<=hi17313;bin17313++){
        let list17313=bins17313.get(bin17313);if(!list17313)bins17313.set(bin17313,list17313=[]);list17313.push(box17313);
      }
    }
    const out17313={prepared:source17313.prepared,scale:scale17313,bins:bins17313};
    earthlineCandidateBoundaryBins17313.set(g,out17313);return out17313;
  }
  function earthlineCertifiedCandidateInterior17313(raw17313,g17313){
    const idx17313=earthlineCandidateBoundaryIndex17313(g17313);
    if(!idx17313||!raw17313||raw17313.length<2||!earthlinePointInJurisdiction16539(raw17313[0],idx17313.prepared))return false;
    const seen17313=new Set();
    for(let i17313=1;i17313<raw17313.length;i17313++){
      const a17313=raw17313[i17313-1],b17313=raw17313[i17313],
            minx17313=Math.min(Number(a17313[0]),Number(b17313[0])),maxx17313=Math.max(Number(a17313[0]),Number(b17313[0])),
            miny17313=Math.min(Number(a17313[1]),Number(b17313[1])),maxy17313=Math.max(Number(a17313[1]),Number(b17313[1])),
            lo17313=Math.floor(miny17313*idx17313.scale),hi17313=Math.floor(maxy17313*idx17313.scale);
      seen17313.clear();
      for(let bin17313=lo17313;bin17313<=hi17313;bin17313++)for(const edgeBox17313 of (idx17313.bins.get(bin17313)||[])){
        if(seen17313.has(edgeBox17313))continue;seen17313.add(edgeBox17313);
        if(edgeBox17313[2]>=minx17313&&edgeBox17313[0]<=maxx17313&&edgeBox17313[3]>=miny17313&&edgeBox17313[1]<=maxy17313)return false;
      }
    }
    return true;
  }
  function earthlineClipLine16539(coords,g){
    const raw=(coords||[]).filter(earthlineFinitePoint16539);if(raw.length<2)return [];
    const pts=[raw[0]];for(let i=1;i<raw.length;i++){const a=raw[i-1],b=raw[i],steps=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b[0])-Number(a[0])),Math.abs(Number(b[1])-Number(a[1])))/.01));for(let k=1;k<=steps;k++)pts.push(earthlineInterpolate16539(a,b,k/steps));}
    if(g&&g.earthlineCertifiedInterior16850===true)return [pts];
    if(earthlineCertifiedCandidateInterior17313(raw,g))return [pts];"""
if s.count(anchor)!=1: raise SystemExit(f"candidate interior anchor count {s.count(anchor)}")
s=s.replace(anchor,insert,1)
s="<!-- EARTHLINE_CANDIDATE_INTERIOR_INDEX_17313: exact-safe boundary-box index skips PIP only when no jurisdiction boundary edge bbox can intersect the candidate; original densification preserved. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed exact-safe candidate interior index 17313")
