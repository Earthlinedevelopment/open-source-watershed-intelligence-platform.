from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="    const tileTotal16349=Math.max(1,(x1-x0+1)*(y1-y0+1));let tileDone16349=0;"
new="    const tileTotal16349=Math.max(1,(x1-x0+1)*(y1-y0+1));let tileDone16349=0,tileScheduled17347=0;"
if s.count(old)!=1: raise SystemExit("tile counter anchor")
s=s.replace(old,new,1)
old2="""      jobs.push(fetchTerrainTile(z,xx,y,ctl.signal).then(img=>{
        tiles.set(xx+','+y,img);tileDone16349++;
        if(tileDone16349===1||tileDone16349===tileTotal16349||(tileDone16349&3)===0)noteRegionalProgress16347('LOADING ELEVATION · '+tileDone16349+'/'+tileTotal16349+' TILES');
      }));
"""
new2="""      jobs.push(fetchTerrainTile(z,xx,y,ctl.signal).then(img=>{
        tiles.set(xx+','+y,img);tileDone16349++;
        if(tileDone16349===1||tileDone16349===tileTotal16349||(tileDone16349&3)===0)noteRegionalProgress16347('LOADING ELEVATION · '+tileDone16349+'/'+tileTotal16349+' TILES');
      }));
      tileScheduled17347++;
      await Promise.resolve();
"""
if s.count(old2)!=1: raise SystemExit("tile scheduling anchor")
s=s.replace(old2,new2,1)
s="<!-- EARTHLINE_INTERLEAVED_TERRAIN_SCHEDULING_17347: concurrent loadDEM callers enqueue one tile per microtask round, preserving exact tiles while preventing request-queue starvation. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed interleaved terrain scheduling 17347")
