from pathlib import Path
p=Path('earthline-elder-worker-17129.js')
s=p.read_text(encoding='utf-8')
old='''  const screenRaw=await image.readRasters(screenOptions17413);
  const tScreen=performance.now();
  const pix=Math.max(Math.abs(w.rx),Math.abs(w.ry));
  const pad=Math.max(64,Math.ceil(60/Math.max(.01,pix)));
  const ncol0=Math.max(0,w.col0-pad),nrow0=Math.max(0,w.row0-pad);
  const ncol1=Math.min(image.getWidth(),w.col0+w.ww+pad),nrow1=Math.min(image.getHeight(),w.row0+w.wh+pad);
  const nativeRaw=await image.readRasters({
    window:[ncol0,nrow0,ncol1,nrow1],samples:[0],interleave:true
  });
  const tNative=performance.now();
  const screen=f32(screenRaw),native=f32(nativeRaw);'''
new='''  const pix=Math.max(Math.abs(w.rx),Math.abs(w.ry));
  const pad=Math.max(64,Math.ceil(60/Math.max(.01,pix)));
  const ncol0=Math.max(0,w.col0-pad),nrow0=Math.max(0,w.row0-pad);
  const ncol1=Math.min(image.getWidth(),w.col0+w.ww+pad),nrow1=Math.min(image.getHeight(),w.row0+w.wh+pad);
  let screen,native,tScreen,tNative;
  if(ow===w.ww&&oh===w.wh){
    const nativeRaw=await image.readRasters({
      window:[ncol0,nrow0,ncol1,nrow1],samples:[0],interleave:true
    });
    native=f32(nativeRaw);
    const nw=ncol1-ncol0,offR=w.row0-nrow0,offC=w.col0-ncol0;
    screen=new Float32Array(ow*oh);
    for(let r=0;r<oh;r++){
      const a=(offR+r)*nw+offC;
      screen.set(native.subarray(a,a+ow),r*ow);
    }
    tScreen=performance.now();
    tNative=tScreen;
  }else{
    const screenRaw=await image.readRasters(screenOptions17413);
    tScreen=performance.now();
    screen=f32(screenRaw);
    const nativeRaw=await image.readRasters({
      window:[ncol0,nrow0,ncol1,nrow1],samples:[0],interleave:true
    });
    tNative=performance.now();
    native=f32(nativeRaw);
  }'''
if old not in s: raise SystemExit('single-read anchor missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('installed exact single-read Elder raster path 17534')