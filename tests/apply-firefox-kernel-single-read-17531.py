from pathlib import Path
p=Path("earthline-elder-worker-17129.js")
s=p.read_text(encoding="utf-8")

old_py='''    await py.runPythonAsync(await src.text());
    return py;'''
new_py='''    await py.runPythonAsync(await src.text());
    /* EARTHLINE 17531 — Firefox cold-kernel warm only. Same approved NumPy
       operations, exercised on tiny synthetic arrays before first Property use. */
    try{
      const ua=String(self.navigator&&self.navigator.userAgent||"");
      if(/Firefox\\//i.test(ua)){
        await py.runPythonAsync(\`
import numpy as np
_elw=np.arange(4096,dtype=np.float32).reshape((64,64))%31
_median_filter(_elw,9)
_uniform_filter((_elw>5).astype(np.float32),9)
_maximum_filter(_elw,7)
_gaussian_filter(_elw,1.2)
_elm=_elw>20
_components_4(_elm)
_component_size_4(_elm,32,32)
del _elw,_elm
\`);
      }
    }catch(_){}
    return py;'''
if s.count(old_py)!=1:
    raise SystemExit(f"ensurePy anchor count={s.count(old_py)}")
s=s.replace(old_py,new_py,1)

old_block='''  const screenOptions17413={
    window:[w.col0,w.row0,w.col0+w.ww,w.row0+w.wh],
    samples:[0],interleave:true
  };
  if(ow!==w.ww||oh!==w.wh){
    screenOptions17413.width=ow;
    screenOptions17413.height=oh;
    screenOptions17413.resampleMethod="nearest";
  }
  const screenRaw=await image.readRasters(screenOptions17413);
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
new_block='''  const screenOptions17413={
    window:[w.col0,w.row0,w.col0+w.ww,w.row0+w.wh],
    samples:[0],interleave:true
  };
  if(ow!==w.ww||oh!==w.wh){
    screenOptions17413.width=ow;
    screenOptions17413.height=oh;
    screenOptions17413.resampleMethod="nearest";
  }
  const pix=Math.max(Math.abs(w.rx),Math.abs(w.ry));
  const pad=Math.max(64,Math.ceil(60/Math.max(.01,pix)));
  const ncol0=Math.max(0,w.col0-pad),nrow0=Math.max(0,w.row0-pad);
  const ncol1=Math.min(image.getWidth(),w.col0+w.ww+pad),nrow1=Math.min(image.getHeight(),w.row0+w.wh+pad);
  let screen,native,tScreen,tNative;
  if(ow===w.ww&&oh===w.wh){
    /* EARTHLINE 17531 — exact Property raw-window single-read path.
       Screening pixels are an exact subset of the padded native window, so
       derive them from the same source samples instead of issuing a duplicate
       GeoTIFF read. No resampling, thresholds, or detector inputs change. */
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
if s.count(old_block)!=1:
    raise SystemExit(f"raster block anchor count={s.count(old_block)}")
s=s.replace(old_block,new_block,1)
p.write_text(s,encoding="utf-8")
print("installed corrected Firefox kernel warm + single-read 17531")
