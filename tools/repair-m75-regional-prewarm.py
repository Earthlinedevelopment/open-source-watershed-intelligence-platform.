from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")
old="""    syncLayers15778("regional");
    const gen=++M.searchGen;setBusy(true,"ANALYZING 0/"+plan.tiles.length);
    try{
      const deadline=performance.now()+55000;"""
new="""    syncLayers15778("regional");
    const gen=++M.searchGen;setBusy(true,"ANALYZING 0/"+plan.tiles.length);

    /* EARTHLINE 17701 — Regional DEM prewarm.
       The governed Terrain-RGB loader already owns one shared URL cache/in-flight map.
       Start the exact z15 DEM requests for every planned Regional tile together, then
       let each serial scientific tile consume those same promises/cache entries.
       Request set, DEM source, cell size, hydrology and publication verdicts are unchanged. */
    try{
      const demZ17701=15;
      const tmpl17701="https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}@2x.pngraw?access_token="+MAPBOX_TOKEN;
      const urls17701=new Set();
      for(let pi17701=0;pi17701<plan.tiles.length;pi17701++){
        const tile17701=plan.tiles[pi17701];
        const site17701=tileSite(tile17701,parent,pi17701+1);
        const cell17701=analysisCellM(site17701);
        const tp17701=earthlinePropertyTilePlan16453(demZ17701,tile17701.lat,tile17701.lng,cell17701);
        for(const [tx17701,ty17701] of tp17701.tiles){
          urls17701.add(tmpl17701.replace("{z}",demZ17701).replace("{x}",tx17701).replace("{y}",ty17701));
        }
      }
      const jobs17701=[...urls17701].map(url17701=>loadImg(url17701).catch(()=>null));
      window.EARTHLINE_REGIONAL_DEM_PREWARM_17701={
        build:"EARTHLINE 17701",tiles:plan.tiles.length,uniqueRequests:jobs17701.length,
        startedAt:new Date().toISOString()
      };
      Promise.all(jobs17701).then(()=>{
        const a=window.EARTHLINE_REGIONAL_DEM_PREWARM_17701||{};
        a.completedAt=new Date().toISOString();a.complete=true;
      }).catch(()=>{});
    }catch(error17701){
      window.EARTHLINE_REGIONAL_DEM_PREWARM_17701={
        build:"EARTHLINE 17701",error:String(error17701&&error17701.message||error17701),
        startedAt:new Date().toISOString(),complete:false
      };
    }

    try{
      const deadline=performance.now()+55000;"""
n=s.count(old)
if n!=1: raise SystemExit(f"regional prewarm target count {n}, expected 1")
s=s.replace(old,new,1)
p.write_text(s)
print("EARTHLINE_M75_REGIONAL_PREWARM_OK")
