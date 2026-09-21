from pathlib import Path
import sys

p=Path(sys.argv[1])
s=p.read_text(encoding="utf-8")

def rep(name, old, new):
    global s
    n=s.count(old)
    if n != 1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

sig="  async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){"
rep("signature", sig, sig + r'''
    const m45diag=window.EARTHLINE_M45_CANDIDATE_GATE_DIAG;
    const m45targets=new Set((m45diag&&m45diag.targetCells)||[]);
    const m45cellLL=ll=>{
      const b=window.EARTHLINE_M45_STATE_BOUNDS;
      if(!Array.isArray(b)||b.length!==4||!Array.isArray(ll)||!Number.isFinite(Number(ll[0]))||!Number.isFinite(Number(ll[1])))return null;
      const dx=Number(b[2])-Number(b[0]),dy=Number(b[3])-Number(b[1]);if(!(dx>0)||!(dy>0))return null;
      const x=Math.max(0,Math.min(11,Math.floor((Number(ll[0])-Number(b[0]))/dx*12)));
      const y=Math.max(0,Math.min(11,Math.floor((Number(b[3])-Number(ll[1]))/dy*12)));
      return x+','+y;
    };
    const m45row=cell=>{
      if(!m45diag||!cell||!m45targets.has(cell))return null;
      if(!m45diag.cells[cell])m45diag.cells[cell]={cell};
      return m45diag.cells[cell];
    };
    const m45inc=(cell,key,n=1)=>{const r=m45row(cell);if(r)r[key]=(Number(r[key])||0)+n;};
    const m45segmentCell=seg=>Array.isArray(seg)&&seg.length?m45cellLL(seg[Math.floor((seg.length-1)/2)]):null;
''')

sample="    function sampleSegment(coords,center,relaxed){"
rep("sample sig", sample, sample + r'''
      const m45sampleCell=Array.isArray(coords)&&coords.length?m45cellLL(coords[Math.max(0,Math.min(coords.length-1,center))]):null;
      m45inc(m45sampleCell,relaxed?'sampleAttemptsRelaxed':'sampleAttemptsPreferred');
''')

rep("raw", "      const raw=coords.slice(start,end);if(raw.length<10)return null;",
    "      const raw=coords.slice(start,end);if(raw.length<10){m45inc(m45sampleCell,'rejectRawTooShort');return null;}")

rep("smooth", "      const segment=chaikin(raw,2,false);if(segment.length<10)return null;",
    "      const segment=chaikin(raw,2,false);if(segment.length<10){m45inc(m45sampleCell,'rejectSmoothedTooShort');return null;}")

rep("line length", "      if(linePx16632<minLinePx16632)return null;",
    "      if(linePx16632<minLinePx16632){m45inc(m45sampleCell,'rejectLineLength');return null;}")

rep("point gate",
"        if(!Number.isFinite(slope)||slope<minSlope||slope>maxSlope||acc>=channel)continue;",
r"""        if(!Number.isFinite(slope)){m45inc(m45sampleCell,'samplePointSlopeNonfinite');continue;}
        if(slope<minSlope){m45inc(m45sampleCell,'samplePointSlopeLow');continue;}
        if(slope>maxSlope){m45inc(m45sampleCell,'samplePointSlopeHigh');continue;}
        if(!Number.isFinite(acc)){m45inc(m45sampleCell,'samplePointAccNonfinite');continue;}
        if(acc>=channel){m45inc(m45sampleCell,'samplePointChannel');continue;}""")

rep("valid", "      if(valid<(relaxed?1:2)||!anchor)return null;",
    "      if(valid<(relaxed?1:2)||!anchor){m45inc(m45sampleCell,'rejectInsufficientValidSamples');return null;}")

ret="      return {segment,x:anchor.x,y:anchor.y,slope:meanSlope,acc:meanAcc,maxAcc,score:slopeScore*.56+flowScore*.28+lengthScore*.16,confidence:relaxed?'screening':'preferred',minLinePx16632};"
rep("sample return", ret,
    "      m45inc(m45sampleCell,relaxed?'sampleAcceptedRelaxed':'sampleAcceptedPreferred');"+ret)

line_loop="""    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;"""
line_new=r"""    for(const f of lines){
      const coords=f.geometry.coordinates;
      if(m45diag&&Array.isArray(coords)){
        const touched=new Set();
        for(const p of coords){const c=m45cellLL(p);if(c&&m45targets.has(c))touched.add(c);}
        for(const c of touched)m45inc(c,'contourLinesTouching');
      }
      if(coords.length<16){
        if(m45diag&&Array.isArray(coords)){const touched=new Set();for(const p of coords){const c=m45cellLL(p);if(c&&m45targets.has(c))touched.add(c);}for(const c of touched)m45inc(c,'contourTooShortCoords');}
        continue;
      }"""
rep("line loop", line_loop, line_new)

screen="    function screenJurisdictionCandidate16539(candidate16539){"
rep("screen sig", screen, screen + r'''
      const m45jurCell=m45segmentCell(candidate16539&&candidate16539.segment||[]);
      m45inc(m45jurCell,'jurisdictionAttempts');
''')

rep("no runs",
"      if(!runs16539.length){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}",
"      if(!runs16539.length){m45inc(m45jurCell,'jurisdictionRejectNoRun');if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}")

rep("jur short",
"      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<minimumScreenPx16737){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}",
"      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<minimumScreenPx16737){m45inc(m45jurCell,'jurisdictionRejectShort');if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}")

rep("jur mid",
"      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}",
"      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){m45inc(m45jurCell,'jurisdictionRejectBadMid');if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}")

rep("jur accepted",
"""      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screenedCandidate16592);
      return screenedCandidate16592;""",
"""      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screenedCandidate16592);
      m45inc(m45jurCell,'jurisdictionAccepted');
      return screenedCandidate16592;""")

rep("supplemental",
"    if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);",
r"""    if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length){
      for(const c of supplementalCandidates16702){const cc=m45segmentCell(c&&c.segment||[]);m45inc(cc,'supplementalCandidatesInput');}
      candidates.push(...supplementalCandidates16702);
    }""")

rep("eligible",
"""    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);""",
r"""    const jurisdictionEligibleCandidates16539=candidates.length;
    if(m45diag){for(const c of candidates){const cc=m45segmentCell(c&&c.segment||[]);m45inc(cc,'finalScreenedCandidate');}}
    candidates.sort((a,b)=>b.score-a.score);""")

anchor="    phaseMark16198('terrainMs',terrainStarted16198);"
rep("state bounds", anchor,
    "    if(!focusMode&&hy&&Array.isArray(hy.bounds))window.EARTHLINE_M45_STATE_BOUNDS=hy.bounds.slice();\n"+anchor)

p.write_text(s,encoding="utf-8")
print("patched candidate gate diagnostic")
