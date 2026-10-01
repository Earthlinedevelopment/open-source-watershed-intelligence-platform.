from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    const relief16918=Math.max(0,percentile(hy.elev,0.98)-percentile(hy.elev,0.02));
    const flowQuantile16918=relief16918>=900?0.72:relief16918>=450?0.76:relief16918>=180?0.80:0.84;
    const primaryCap16918=relief16918>=900?340:relief16918>=450?300:relief16918>=180?260:230;
    const fallbackFloor16918=relief16918>=900?120:relief16918>=450?90:relief16918>=180?70:55;
    const fallbackCap16918=relief16918>=900?320:relief16918>=450?270:relief16918>=180?220:180;"""
new="""    const relief16918=Math.max(0,percentile(hy.elev,0.98)-percentile(hy.elev,0.02));
    const reliefFactor16918=Math.max(0,Math.min(1,relief16918/1000));
    const flowQuantile16918=Math.max(0.66,Math.min(0.84,0.84-0.18*reliefFactor16918));
    const primaryCap16918=Math.round(230+150*reliefFactor16918);
    const fallbackFloor16918=Math.round(55+95*reliefFactor16918);
    const fallbackCap16918=Math.round(180+180*reliefFactor16918);"""
if old not in s: raise SystemExit("shared 16918 profile anchor missing")
s=s.replace(old,new,1)
oldrule="rule:'shared relief-adaptive Regional drainage density'"
newrule="rule:'shared continuous relief-adaptive Regional drainage density'"
s=s.replace(oldrule,newrule,1)
p.write_text(s,encoding="utf-8")
print("refined shared Regional flow-density owner")

# trigger
