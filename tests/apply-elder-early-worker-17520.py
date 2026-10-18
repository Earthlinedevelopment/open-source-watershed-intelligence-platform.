from pathlib import Path

index=Path("index.html")
s=index.read_text(encoding="utf-8")
marker="EARTHLINE_ELDER_EARLY_WORKER_17520"
if marker not in s:
    early="""<script>
/* EARTHLINE_ELDER_EARLY_WORKER_17520
   Performance only: begin the one approved Elder worker runtime warm at parser
   startup, then hand that exact worker to the existing Elder owner. */
(()=>{try{
  if(!window.__EARTHLINE_ELDER_EARLY_WORKER_17520){
    const w=new Worker('earthline-elder-worker-17129.js',{type:'module'});
    window.__EARTHLINE_ELDER_EARLY_WORKER_17520=w;
    window.__EARTHLINE_ELDER_EARLY_WORKER_FAILED_17520=false;
    w.addEventListener('error',()=>{window.__EARTHLINE_ELDER_EARLY_WORKER_FAILED_17520=true},{once:true});
    w.postMessage({id:'elder-early-warm-17520',warm:true});
  }
}catch(_){}})();
</script>
"""
    if "<head>" not in s:
        raise SystemExit("index <head> anchor missing")
    s=s.replace("<head>","<head>\n"+early,1)
    index.write_text(s,encoding="utf-8")

launch=Path("earthline-launch-16872.js")
j=launch.read_text(encoding="utf-8")
old="""    const w=new Worker('earthline-elder-worker-17129.js',{type:'module'});"""
new="""    /* EARTHLINE 17520 — reuse the one parser-started Elder worker when healthy.
       No second worker owner is added; fallback creates the same existing worker. */
    let w=null;
    try{
      const early=window.__EARTHLINE_ELDER_EARLY_WORKER_17520||null;
      if(early&&window.__EARTHLINE_ELDER_EARLY_WORKER_FAILED_17520!==true)w=early;
      else if(early)try{early.terminate()}catch(_){}
      window.__EARTHLINE_ELDER_EARLY_WORKER_17520=null;
    }catch(_){}
    if(!w)w=new Worker('earthline-elder-worker-17129.js',{type:'module'});"""
if old not in j:
    raise SystemExit("dynamicWorker creation anchor missing")
j=j.replace(old,new,1)
launch.write_text(j,encoding="utf-8")
print("installed single early Elder worker warm 17520")
