from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    const jurisdictionScreenCache16592=new WeakMap();
    function screenJurisdictionCandidate16539(candidate16539){
      if(focusMode||!jurisdictionGeometry16539)return candidate16539;
      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);
      const runs16539=(jurisdictionGeometry16539&&jurisdictionGeometry16539.earthlineVermontExactClip16750===true&&typeof window.earthlineClipVermontLine16178==='function')
        ?window.earthlineClipVermontLine16178(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539.earthlineVermontGeometry16750)
        :earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);"""
new="""    const jurisdictionScreenCache16592=new WeakMap();
    const jurisdictionSegmentClipRoot17315=(!focusMode&&hy&&typeof hy==='object')
      ?(hy.__earthlineJurisdictionSegmentClipRoot17315||(hy.__earthlineJurisdictionSegmentClipRoot17315=new WeakMap()))
      :null;
    function clipJurisdictionSegment17315(segment17315){
      const direct17315=()=>((jurisdictionGeometry16539&&jurisdictionGeometry16539.earthlineVermontExactClip16750===true&&typeof window.earthlineClipVermontLine16178==='function')
        ?window.earthlineClipVermontLine16178(segment17315,jurisdictionGeometry16539.earthlineVermontGeometry16750)
        :earthlineClipLine16539(segment17315,jurisdictionGeometry16539));
      if(!jurisdictionSegmentClipRoot17315||!jurisdictionGeometry16539||!Array.isArray(segment17315)||segment17315.length<2)return direct17315();
      const first17315=segment17315[0],mid17315=segment17315[Math.floor((segment17315.length-1)/2)],last17315=segment17315[segment17315.length-1];
      if(!first17315||typeof first17315!=='object'||!mid17315||typeof mid17315!=='object'||!last17315||typeof last17315!=='object')return direct17315();
      let byBoundary17315=jurisdictionSegmentClipRoot17315.get(jurisdictionGeometry16539);
      if(!byBoundary17315){byBoundary17315=new WeakMap();jurisdictionSegmentClipRoot17315.set(jurisdictionGeometry16539,byBoundary17315);}
      let byFirst17315=byBoundary17315.get(first17315);
      if(!byFirst17315){byFirst17315=new WeakMap();byBoundary17315.set(first17315,byFirst17315);}
      let byMid17315=byFirst17315.get(mid17315);
      if(!byMid17315){byMid17315=new WeakMap();byFirst17315.set(mid17315,byMid17315);}
      const hit17315=byMid17315.get(last17315);
      if(hit17315&&hit17315.length===segment17315.length)return hit17315.runs.map(run17315=>run17315.slice());
      const runs17315=direct17315();
      byMid17315.set(last17315,{length:segment17315.length,runs:runs17315.map(run17315=>run17315.slice())});
      return runs17315;
    }
    function screenJurisdictionCandidate16539(candidate16539){
      if(focusMode||!jurisdictionGeometry16539)return candidate16539;
      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);
      const runs16539=clipJurisdictionSegment17315(candidate16539&&candidate16539.segment||[]);"""
if s.count(old)!=1: raise SystemExit(f"segment cache anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_RUN_SCOPED_SEGMENT_CLIP_CACHE_17315: exact jurisdiction clip reuse only for identical contour point objects within the same hydrology object + boundary; no cross-run cache or science change. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed exact run-scoped segment clip cache 17315")
