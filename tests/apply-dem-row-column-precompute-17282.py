from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    const elev=new Float32Array(w*h);let min=Infinity,max=-Infinity;
    for(let gy=0;gy<h;gy++){
      for(let gx=0;gx<w;gx++){
        const lon=b[0]+(b[2]-b[0])*(gx/(w-1)),lat=b[3]-(b[3]-b[1])*(gy/(h-1)),tx=lon2x(lon,z),ty=lat2y(lat,z),ix=Math.floor(tx),iy=Math.floor(ty),img=tiles.get((((ix%Math.pow(2,z))+Math.pow(2,z))%Math.pow(2,z))+','+iy);
        if(!img)throw new Error('terrain tile missing');const px=Math.max(0,Math.min(img.width-1,Math.floor((tx-ix)*img.width))),py=Math.max(0,Math.min(img.height-1,Math.floor((ty-iy)*img.height))),o=(py*img.width+px)*4;
        const v=img.data[o]*256+img.data[o+1]+img.data[o+2]/256-32768;elev[gy*w+gx]=v;if(v<min)min=v;if(v>max)max=v;
      }
      if((gy&7)===7)await Promise.resolve();
    }"""
new="""    const elev=new Float32Array(w*h);let min=Infinity,max=-Infinity;
    const worldTiles17282=Math.pow(2,z),tileX17282=new Int32Array(w),fracX17282=new Float64Array(w),tileY17282=new Int32Array(h),fracY17282=new Float64Array(h);
    for(let gx=0;gx<w;gx++){
      const lon=b[0]+(b[2]-b[0])*(gx/(w-1)),tx=lon2x(lon,z),ix=Math.floor(tx);
      tileX17282[gx]=((ix%worldTiles17282)+worldTiles17282)%worldTiles17282;
      fracX17282[gx]=tx-ix;
    }
    for(let gy=0;gy<h;gy++){
      const lat=b[3]-(b[3]-b[1])*(gy/(h-1)),ty=lat2y(lat,z),iy=Math.floor(ty);
      tileY17282[gy]=iy;fracY17282[gy]=ty-iy;
    }
    for(let gy=0;gy<h;gy++){
      const iy=tileY17282[gy],fy17282=fracY17282[gy];
      for(let gx=0;gx<w;gx++){
        const img=tiles.get(tileX17282[gx]+','+iy);
        if(!img)throw new Error('terrain tile missing');const px=Math.max(0,Math.min(img.width-1,Math.floor(fracX17282[gx]*img.width))),py=Math.max(0,Math.min(img.height-1,Math.floor(fy17282*img.height))),o=(py*img.width+px)*4;
        const v=img.data[o]*256+img.data[o+1]+img.data[o+2]/256-32768;elev[gy*w+gx]=v;if(v<min)min=v;if(v>max)max=v;
      }
      if((gy&7)===7)await Promise.resolve();
    }"""
if s.count(old)!=1: raise SystemExit(f"DEM sampler anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_DEM_ROW_COLUMN_PRECOMPUTE_17282: identical Terrarium pixel lookup with Mercator X computed once per column and Y once per row; no grid/source/science changes. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched DEM row/column coordinate precompute 17282")
