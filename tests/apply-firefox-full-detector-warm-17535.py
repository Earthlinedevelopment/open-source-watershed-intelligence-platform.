from pathlib import Path
p=Path('earthline-elder-worker-17129.js')
s=p.read_text(encoding='utf-8')
old='''    await py.runPythonAsync(await src.text());
    return py;'''
new='''    await py.runPythonAsync(await src.text());
    /* EARTHLINE 17535 — Firefox-only full-detector cold execution warm.
       Runs once in the existing background Elder worker on synthetic canopy
       so real Property evidence uses the unchanged approved 17118 equations. */
    try{
      const ua=String(self.navigator&&self.navigator.userAgent||'');
      if(/Firefox\\//i.test(ua)){
        await py.runPythonAsync(`
import json, math, os
import numpy as np
_eh=_ew=160
_yy,_xx=np.mgrid[0:_eh,0:_ew]
_ez=(18.0+6.0*np.sin(_xx/4.0)+5.0*np.cos(_yy/5.0)+2.0*np.sin((_xx+_yy)/3.0)).astype(np.float32)
_esp='/tmp/earthline_elder_warm_screen.bin'
_enp='/tmp/earthline_elder_warm_native.bin'
_ez.tofile(_esp)
_ez.tofile(_enp)
_R=6378137.0
_lon0=-72.7
_lat_top=44.1
_ox=_R*math.radians(_lon0)
_oy=_R*math.log(math.tan(math.pi/4+math.radians(_lat_top)/2))
_east=math.degrees((_ox+_ew)/_R)
_south=math.degrees(2*math.atan(math.exp((_oy-_eh)/_R))-math.pi/2)
_meta=json.dumps({'bbox':[_lon0,_south,_east,_lat_top],'quadkey':'earthline-warm','source_url':'earthline://synthetic-warm','res_x':1.0,'res_y':-1.0,'screen_col0':0,'screen_row0':0,'screen_ww':_ew,'screen_wh':_eh,'native_col0':0,'native_row0':0,'origin_x':_ox,'origin_y':_oy})
detect_from_files(_esp,_eh,_ew,_enp,_eh,_ew,_meta,96,True)
try: os.unlink(_esp)
except: pass
try: os.unlink(_enp)
except: pass
del _yy,_xx,_ez,_meta
`);
      }
    }catch(_){}
    return py;'''
if old not in s: raise SystemExit('ensurePy warm anchor missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('installed Firefox full-detector cold warm 17535')