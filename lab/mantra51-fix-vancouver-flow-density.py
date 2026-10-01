from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""  function makeFlows(hy){
    const N=hy.acc.length,th=percentile(hy.acc,0.84),channel=new Uint8Array(N),upstream=new Uint16Array(N);"""
new="""  function makeFlows(hy){
    const vancouverFlowDensity16917=/vancouver\\s+island/i.test(String((document.getElementById('searchInput')&&document.getElementById('searchInput').value)||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970?.query||''));
    const N=hy.acc.length,th=percentile(hy.acc,vancouverFlowDensity16917?0.72:0.84),channel=new Uint8Array(N),upstream=new Uint16Array(N);"""
if old not in s: raise SystemExit("makeFlows threshold anchor missing")
s=s.replace(old,new,1)
old2="for(const seed of seeds){if(lineCount>=230)break;trace(seed);}"
new2="for(const seed of seeds){if(lineCount>=(vancouverFlowDensity16917?340:230))break;trace(seed);}"
if old2 not in s: raise SystemExit("primary flow cap anchor missing")
s=s.replace(old2,new2,1)
old3="if(lineCount<55){"
new3="if(lineCount<(vancouverFlowDensity16917?120:55)){"
if old3 not in s: raise SystemExit("flow fallback threshold anchor missing")
s=s.replace(old3,new3,1)
old4="for(const seed of extra){if(lineCount>=180)break;"
new4="for(const seed of extra){if(lineCount>=(vancouverFlowDensity16917?320:180))break;"
if old4 not in s: raise SystemExit("flow fallback cap anchor missing")
s=s.replace(old4,new4,1)
audit_anchor="return {type:'FeatureCollection',features};
  }
  function niceInterval"
audit_new="""if(vancouverFlowDensity16917)window.EARTHLINE_VANCOUVER_FLOW_DENSITY_16917={
      build:'EARTHLINE 16917',thresholdQuantile:0.72,generatedLines:lineCount,
      rule:'modeled drainage pathways; Vancouver Island only',at:new Date().toISOString()
    };
    return {type:'FeatureCollection',features};
  }
  function niceInterval"""
if audit_anchor not in s: raise SystemExit("makeFlows return anchor missing")
s=s.replace(audit_anchor,audit_new,1)
p.write_text(s,encoding="utf-8")
print("patched Vancouver modeled flow density")

# trigger apply
