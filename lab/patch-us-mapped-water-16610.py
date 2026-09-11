from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16610 — DIRECT VECTOR WATER SOURCE QUERY'
if marker in s:
    raise SystemExit('guard failed: 16610 already present')
old="""    try{
      const style16609=map16609&&map16609.getStyle&&map16609.getStyle();
      const layers16609=Array.isArray(style16609&&style16609.layers)?style16609.layers:[];
      const targets16609=[];
      for(const layer16609 of layers16609){const sl16609=String(layer16609&&layer16609['source-layer']||'').toLowerCase();if((sl16609==='water'||sl16609==='waterway')&&layer16609.source)targets16609.push([String(layer16609.source),sl16609]);}
      const seen16609=new Set();
      for(const [sid16609,sl16609] of targets16609){const key16609=sid16609+'|'+sl16609;if(seen16609.has(key16609))continue;seen16609.add(key16609);sourceQueries16609++;try{const rows16609=map16609.querySourceFeatures(sid16609,{sourceLayer:sl16609})||[];sourceSuccess16609++;rawFeatures16609+=rows16609.length;for(const f16609 of rows16609)addGeometry16609(f16609&&f16609.geometry);}catch(_){} }
    }catch(_){}"""
new="""    try{
      /* EARTHLINE 16610 — DIRECT VECTOR WATER SOURCE QUERY.
         Do not infer source-layer availability from style layer names. Query the
         already-loaded vector sources directly, matching the independent NY audit. */
      const style16609=map16609&&map16609.getStyle&&map16609.getStyle();
      const sources16610=Object.entries(style16609&&style16609.sources||{});
      for(const [sid16609,def16610] of sources16610){
        if(String(def16610&&def16610.type||'').toLowerCase()!=='vector')continue;
        for(const sl16609 of ['water','waterway']){
          sourceQueries16609++;
          try{
            const rows16609=map16609.querySourceFeatures(sid16609,{sourceLayer:sl16609})||[];
            sourceSuccess16609++;
            rawFeatures16609+=rows16609.length;
            for(const f16609 of rows16609)addGeometry16609(f16609&&f16609.geometry);
          }catch(_){}
        }
      }
    }catch(_){}"""
if s.count(old)!=1:
    raise SystemExit(f'guard failed: mapped water source block count {s.count(old)}')
s=s.replace(old,new,1)
if marker not in s:
    raise SystemExit('guard failed: 16610 marker absent after replacement')
p.write_text(s,encoding='utf-8')
