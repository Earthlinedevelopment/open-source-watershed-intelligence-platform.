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
    /* EARTHLINE 17293 — prepare immutable jurisdiction geometry once per makeSwales run.
       Same exact containment/clipping science; removes repeated polygon/ring preparation in Firefox/WebKit. */
    const preparedJurisdiction17293=(focusMode||!jurisdictionGeometry16539)?null:earthlinePrepareJurisdiction16539(jurisdictionGeometry16539);
    function screenJurisdictionCandidate16539(candidate16539){
      if(focusMode||!jurisdictionGeometry16539)return candidate16539;
      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);
      const runs16539=(jurisdictionGeometry16539&&jurisdictionGeometry16539.earthlineVermontExactClip16750===true&&typeof window.earthlineClipVermontLine16178==='function')
        ?window.earthlineClipVermontLine16178(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539.earthlineVermontGeometry16750)
        :earthlineClipLine16539(candidate16539&&candidate16539.segment||[],preparedJurisdiction17293||jurisdictionGeometry16539);"""
if s.count(old)!=1: raise SystemExit(f"anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("prepared jurisdiction once per makeSwales run 17293")
