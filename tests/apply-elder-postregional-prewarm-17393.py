from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="""    document.addEventListener('earthline:analysis-complete',()=>{wrapCorridor();refresh();},{passive:true});
    prewarmDynamicWorker();
    load().then(()=>{if(window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970)refresh()}).catch(()=>{});"""
new="""    document.addEventListener('earthline:analysis-complete',e=>{
      wrapCorridor();
      void refresh();
      const tier17393=String(e?.detail?.tier||e?.detail?.mode||'').toLowerCase();
      if(!tier17393.includes('property'))void prewarmDynamicWorker();
    },{passive:true});
    /* EARTHLINE 17393 — do not compete with the first Regional run for network/CPU.
       Elder runtime warms immediately after Regional publication, before normal Property use. */
    if(window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970){
      void load().then(()=>refresh()).catch(()=>{});
      void prewarmDynamicWorker();
    }"""
if s.count(old)!=1: raise SystemExit(f"elder startup scheduling anchor {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("deferred Elder runtime warm until Regional publication 17393")
