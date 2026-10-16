from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    try{data=ctx.getImageData(0,0,c.width,c.height);}catch(_){throw new Error('terrain tile blocked by cross-origin policy');}
    image.close&&image.close();if(revoke)setTimeout(()=>{try{URL.revokeObjectURL(revoke)}catch(_){}},800);return {width:c.width,height:c.height,data:data.data};"""
new="""    try{data=ctx.getImageData(0,0,c.width,c.height);}catch(_){throw new Error('terrain tile blocked by cross-origin policy');}
    /* EARTHLINE 17293 — fail closed on impossible blank Terrarium decodes.
       Terrarium encodes physical Earth elevation as R*256+G+B/256-32768.
       A fully black/transparent decode maps to -32768 m, outside physical Earth
       terrain. Sample the decoded tile; if no physically plausible pixel exists,
       reject this decode so fetchTerrainTile can use its existing alternate source. */
    let plausible17293=false,opaque17293=false;
    const pxCount17293=Math.max(1,c.width*c.height),sampleStep17293=Math.max(1,Math.floor(pxCount17293/96));
    for(let p17293=0;p17293<pxCount17293;p17293+=sampleStep17293){
      const o17293=p17293*4,r17293=data.data[o17293],g17293=data.data[o17293+1],b17293=data.data[o17293+2],a17293=data.data[o17293+3];
      if(a17293)opaque17293=true;
      const v17293=r17293*256+g17293+b17293/256-32768;
      if(Number.isFinite(v17293)&&v17293>=-15000&&v17293<=12000){plausible17293=true;if(opaque17293)break;}
    }
    if(!plausible17293||!opaque17293){
      try{image.close&&image.close()}catch(_){}
      if(revoke)setTimeout(()=>{try{URL.revokeObjectURL(revoke)}catch(_){}},800);
      throw new Error('terrain tile decode failed integrity check');
    }
    image.close&&image.close();if(revoke)setTimeout(()=>{try{URL.revokeObjectURL(revoke)}catch(_){}},800);return {width:c.width,height:c.height,data:data.data};"""
n=s.count(old);print("terrain-integrity anchors",n)
if n!=1: raise SystemExit(f"terrain-integrity anchor {n}")
s=s.replace(old,new,1)
s="/* EARTHLINE_TERRAIN_INTEGRITY_17293 — reject physically impossible blank Terrarium decodes before cache/publication; valid pixels unchanged. */\n"+s
p.write_text(s,encoding="utf-8")
print("17293 Terrarium decode integrity guard applied")
