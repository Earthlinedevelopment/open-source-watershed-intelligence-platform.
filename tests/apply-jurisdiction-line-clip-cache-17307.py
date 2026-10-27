from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

anchor="""  function earthlineClipLine16539(coords,g){"""
insert="""  const earthlineJurisdictionLineClipCache17307=new WeakMap();
  function earthlineClipLine16539(coords,g){"""
if s.count(anchor)!=1: raise SystemExit(f"clip function anchor count {s.count(anchor)}")
s=s.replace(anchor,insert,1)

old="""      const runs16539=(jurisdictionGeometry16539&&jurisdictionGeometry16539.earthlineVermontExactClip16750===true&&typeof window.earthlineClipVermontLine16178==='function')
        ?window.earthlineClipVermontLine16178(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539.earthlineVermontGeometry16750)
        :earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);"""
new="""      const segmentSource17307=candidate16539&&candidate16539.segment||[];
      let runs16539;
      const cacheOwner17307=jurisdictionGeometry16539&&typeof jurisdictionGeometry16539==='object'?jurisdictionGeometry16539:null;
      if(cacheOwner17307){
        let cache17307=earthlineJurisdictionLineClipCache17307.get(cacheOwner17307);
        if(!cache17307){cache17307=new Map();earthlineJurisdictionLineClipCache17307.set(cacheOwner17307,cache17307);}
        const key17307=JSON.stringify(segmentSource17307);
        if(cache17307.has(key17307))runs16539=cache17307.get(key17307).slice();
        else{
          runs16539=(jurisdictionGeometry16539.earthlineVermontExactClip16750===true&&typeof window.earthlineClipVermontLine16178==='function')
            ?window.earthlineClipVermontLine16178(segmentSource17307,jurisdictionGeometry16539.earthlineVermontGeometry16750)
            :earthlineClipLine16539(segmentSource17307,jurisdictionGeometry16539);
          cache17307.set(key17307,runs16539.slice());
        }
      }else{
        runs16539=(jurisdictionGeometry16539&&jurisdictionGeometry16539.earthlineVermontExactClip16750===true&&typeof window.earthlineClipVermontLine16178==='function')
          ?window.earthlineClipVermontLine16178(segmentSource17307,jurisdictionGeometry16539.earthlineVermontGeometry16750)
          :earthlineClipLine16539(segmentSource17307,jurisdictionGeometry16539);
      }"""
if s.count(old)!=1: raise SystemExit(f"screen clip anchor count {s.count(old)}")
s=s.replace(old,new,1)

s="<!-- EARTHLINE_JURISDICTION_LINE_CLIP_CACHE_17307: exact clipped line runs cached by boundary object + exact segment coordinates; downstream grid/ranking/length science unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed exact cross-pass jurisdiction line clip cache 17307")
