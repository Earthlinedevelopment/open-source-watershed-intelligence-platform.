from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
s=s.replace("  async function fetchTerrainTile(z,x,y,signal){","  async function fetchTerrainTile(z,x,y,signal,requestLabel17346=''){",1)
s=s.replace("    const promise=(async()=>{\n      const primary=TERRARIUM.replace('{z}',z).replace('{x}',x).replace('{y}',y);",
"""    const tileStart17346=performance.now();
    const promise=(async()=>{
      const primary=TERRARIUM.replace('{z}',z).replace('{x}',x).replace('{y}',y);""",1)
old="""        const finishSuccess=img=>{
          if(settled)return;
          settled=true;
          if(stagger)clearTimeout(stagger);
          resolve(rememberRegionalTerrain16297(key,img));
        };
"""
new="""        const finishSuccess=(img,source17346)=>{
          if(settled)return;
          settled=true;
          if(stagger)clearTimeout(stagger);
          (window.EARTHLINE_TERRAIN_TILE_TIMINGS_17346||(window.EARTHLINE_TERRAIN_TILE_TIMINGS_17346=[])).push({key,label:String(requestLabel17346||''),source:source17346||'unknown',ms:Math.round(performance.now()-tileStart17346)});
          resolve(rememberRegionalTerrain16297(key,img));
        };
"""
if s.count(old)!=1: raise SystemExit("finishSuccess anchor")
s=s.replace(old,new,1)
s=s.replace("          fetchImageData(alternate,signal).then(finishSuccess,finishFailure);",
            "          fetchImageData(alternate,signal).then(img=>finishSuccess(img,'alternate'),finishFailure);",1)
s=s.replace("        fetchImageData(primary,signal).then(finishSuccess,finishFailure);",
            "        fetchImageData(primary,signal).then(img=>finishSuccess(img,'primary'),finishFailure);",1)
oldcall="""      jobs.push(fetchTerrainTile(z,xx,y,ctl.signal).then(img=>{"""
newcall="""      jobs.push(fetchTerrainTile(z,xx,y,ctl.signal,timeoutLabel).then(img=>{"""
if s.count(oldcall)!=1: raise SystemExit("loadDEM tile call anchor")
s=s.replace(oldcall,newcall,1)
s="<!-- EARTHLINE_TERRAIN_TILE_PROFILE_17346: diagnostic-only per-tile source/winner timing; no behavior change. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed terrain tile timing 17346")
