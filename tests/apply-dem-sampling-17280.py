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
    /* EARTHLINE 17280 — exact DEM sample-coordinate precompute.
       Longitude/tile-X depends only on gx and Mercator latitude/tile-Y only on gy.
       Compute each once instead of repeating expensive transforms for every pixel. */
    const mod17280=Math.pow(2,z),tx17280=new Float64Array(w),ix17280=new Int32Array(w),xx17280=new Int32Array(w);
    const ty17280=new Float64Array(h),iy17280=new Int32Array(h);
    for(let gx17280=0;gx17280<w;gx17280++){
      const lon17280=b[0]+(b[2]-b[0])*(gx17280/(w-1)),txv17280=lon2x(lon17280,z),ixv17280=Math.floor(txv17280);
      tx17280[gx17280]=txv17280;ix17280[gx17280]=ixv17280;xx17280[gx17280]=((ixv17280%mod17280)+mod17280)%mod17280;
    }
    for(let gy17280=0;gy17280<h;gy17280++){
      const lat17280=b[3]-(b[3]-b[1])*(gy17280/(h-1)),tyv17280=lat2y(lat17280,z);
      ty17280[gy17280]=tyv17280;iy17280[gy17280]=Math.floor(tyv17280);
    }
    for(let gy=0;gy<h;gy++){
      const ty=ty17280[gy],iy=iy17280[gy];
      for(let gx=0;gx<w;gx++){
        const tx=tx17280[gx],ix=ix17280[gx],img=tiles.get(xx17280[gx]+','+iy);
        if(!img)throw new Error('terrain tile missing');const px=Math.max(0,Math.min(img.width-1,Math.floor((tx-ix)*img.width))),py=Math.max(0,Math.min(img.height-1,Math.floor((ty-iy)*img.height))),o=(py*img.width+px)*4;
        const v=img.data[o]*256+img.data[o+1]+img.data[o+2]/256-32768;elev[gy*w+gx]=v;if(v<min)min=v;if(v>max)max=v;
      }
      if((gy&7)===7)await Promise.resolve();
    }"""
n=s.count(old)
print("DEM sample anchors",n)
if n!=1: raise SystemExit(f"expected one DEM sample anchor, found {n}")
s=s.replace(old,new,1)
s="/* EARTHLINE_DEM_SAMPLING_17280 — exact Mercator/tile coordinate precompute by row/column; terrain pixels unchanged. */\n"+s
p.write_text(s,encoding="utf-8")
print("17280 DEM sampling optimization applied")
