from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""  function makeFlows(hy){
    const vancouverFlowDensity16917=/vancouver\\s+island/i.test(String((document.getElementById('searchInput')&&document.getElementById('searchInput').value)||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970?.query||''));
    const N=hy.acc.length,th=percentile(hy.acc,vancouverFlowDensity16917?0.72:0.84),channel=new Uint8Array(N),upstream=new Uint16Array(N);"""
new="""  function makeFlows(hy){
    /* EARTHLINE 16918 — shared adaptive Regional drainage density.
       One owner for every Regional run: rugged terrain exposes more modeled drainage
       branches; lower-relief terrain retains the original conservative threshold. */
    const relief16918=Math.max(0,percentile(hy.elev,0.98)-percentile(hy.elev,0.02));
    const flowQuantile16918=relief16918>=900?0.72:relief16918>=450?0.76:relief16918>=180?0.80:0.84;
    const primaryCap16918=relief16918>=900?340:relief16918>=450?300:relief16918>=180?260:230;
    const fallbackFloor16918=relief16918>=900?120:relief16918>=450?90:relief16918>=180?70:55;
    const fallbackCap16918=relief16918>=900?320:relief16918>=450?270:relief16918>=180?220:180;
    const N=hy.acc.length,th=percentile(hy.acc,flowQuantile16918),channel=new Uint8Array(N),upstream=new Uint16Array(N);"""
if old not in s: raise SystemExit("current makeFlows owner not found")
s=s.replace(old,new,1)
s=s.replace("for(const seed of seeds){if(lineCount>=(vancouverFlowDensity16917?340:230))break;trace(seed);}","for(const seed of seeds){if(lineCount>=primaryCap16918)break;trace(seed);}",1)
s=s.replace("if(lineCount<(vancouverFlowDensity16917?120:55)){","if(lineCount<fallbackFloor16918){",1)
s=s.replace("for(const seed of extra){if(lineCount>=(vancouverFlowDensity16917?320:180))break;","for(const seed of extra){if(lineCount>=fallbackCap16918)break;",1)
old_audit="""if(vancouverFlowDensity16917)window.EARTHLINE_VANCOUVER_FLOW_DENSITY_16917={
      build:'EARTHLINE 16917',thresholdQuantile:0.72,generatedLines:lineCount,
      rule:'modeled drainage pathways; Vancouver Island only',at:new Date().toISOString()
    };"""
new_audit="""window.EARTHLINE_REGIONAL_FLOW_PROFILE_16918={
      build:'EARTHLINE 16918',reliefM:Math.round(relief16918),thresholdQuantile:flowQuantile16918,
      primaryCap:primaryCap16918,fallbackFloor:fallbackFloor16918,fallbackCap:fallbackCap16918,
      generatedLines:lineCount,rule:'shared relief-adaptive Regional drainage density',at:new Date().toISOString()
    };"""
if old_audit not in s: raise SystemExit("local Vancouver audit not found")
s=s.replace(old_audit,new_audit,1)
p.write_text(s,encoding="utf-8")
print("replaced local Vancouver exception with shared adaptive Regional hydrology owner")
