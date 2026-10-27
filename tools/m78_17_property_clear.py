from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.17 — clear prior Property presentation at authoritative run start"
if marker not in s:
    anchor="    /* EARTHLINE 17509 — compute prime already started from the exact current Property target at accepted click. */"
    if s.count(anchor)!=1: raise SystemExit(f"M78.17 anchor count={s.count(anchor)}")
    block='''    /* EARTHLINE M78.17 — clear prior Property presentation at authoritative run start.
       A blocked/failing current run must never leave the previous Property's swales or Elder points on screen. */
    try{
      const emptyM7817={type:"FeatureCollection",features:[]};
      ["earthline-property-safe-visible-16221","earthline-property-swale-texture-16174","earthline-elder-trees-17097"].forEach(id=>{
        try{const src=earthlineMap?.getSource?.(id);if(src&&typeof src.setData==="function")src.setData(emptyM7817)}catch(_){}
      });
    }catch(_){}
'''
    s=s.replace(anchor,block+anchor,1)
s=s.replace("earthline-launch-16872.js?v=17605","earthline-launch-16872.js?v=17606")
s=s.replace("earthline-elder-worker-17129.js?v=17604","earthline-elder-worker-17129.js?v=17606")
p.write_text(s,encoding="utf-8")
