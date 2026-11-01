from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

repls=[]

def replace_once(old,new,label):
    global s
    count=s.count(old)
    if count!=1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    s=s.replace(old,new,1)
    repls.append(label)

replace_once(
"  function makeSwales(hy,contours,focusMode=false){",
"  function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null){",
"makeSwales signature"
)

replace_once(
"      return {segment,x:anchor.x,y:anchor.y,slope:meanSlope,acc:meanAcc,maxAcc,score:slopeScore*.56+flowScore*.28+lengthScore*.16,confidence:relaxed?'screening':'preferred'};\n    }\n    for(const f of lines){",
"      return {segment,x:anchor.x,y:anchor.y,slope:meanSlope,acc:meanAcc,maxAcc,score:slopeScore*.56+flowScore*.28+lengthScore*.16,confidence:relaxed?'screening':'preferred'};\n    }\n    /* EARTHLINE 16591 — jurisdiction eligibility must precede Regional ranking/spacing/capacity.\n       Hydrology and contours still span the full DEM envelope; this only prevents candidates\n       that cannot be published in the selected jurisdiction from consuming selection slots. */\n    function screenJurisdictionCandidate16539(candidate16539){\n      if(focusMode||!jurisdictionGeometry16539)return candidate16539;\n      const runs16539=earthlineClipLine16539(candidate16539&&candidate16539.segment||[],jurisdictionGeometry16539);\n      if(!runs16539.length)return null;\n      runs16539.sort((a16539,b16539)=>lineLengthPixels(hy,b16539)-lineLengthPixels(hy,a16539));\n      const segment16539=runs16539[0];\n      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10)return null;\n      const mid16539=segment16539[Math.floor((segment16539.length-1)/2)],grid16539=llGrid(hy,mid16539);\n      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y))return null;\n      return Object.assign({},candidate16539,{\n        segment:segment16539,\n        x:Math.max(1,Math.min(hy.w-2,Math.round(grid16539.x))),\n        y:Math.max(1,Math.min(hy.h-2,Math.round(grid16539.y))),\n        jurisdiction_screened:true\n      });\n    }\n    function jurisdictionEligibleCount16539(list16539){\n      if(focusMode||!jurisdictionGeometry16539)return list16539.length;\n      let count16539=0;\n      for(const candidate16539 of list16539)if(screenJurisdictionCandidate16539(candidate16539))count16539++;\n      return count16539;\n    }\n    for(const f of lines){",
"candidate jurisdiction screen"
)

replace_once(
"    if(candidates.length<36){\n      for(const f of lines){const coords=f.geometry.coordinates;if(coords.length<12)continue;for(const frac of [.28,.56,.82]){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),true);if(c)candidates.push(c);}}\n    }\n    candidates.sort((a,b)=>b.score-a.score);",
"    const preferredEligibleCount16539=jurisdictionEligibleCount16539(candidates);\n    if(preferredEligibleCount16539<36){\n      for(const f of lines){const coords=f.geometry.coordinates;if(coords.length<12)continue;for(const frac of [.28,.56,.82]){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),true);if(c)candidates.push(c);}}\n    }\n    const candidatesBeforeJurisdiction16539=candidates.length;\n    let jurisdictionRejectedCandidates16539=0;\n    if(!focusMode&&jurisdictionGeometry16539){\n      const eligible16539=[];\n      for(const candidate16539 of candidates){\n        const screened16539=screenJurisdictionCandidate16539(candidate16539);\n        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;\n      }\n      candidates.length=0;candidates.push(...eligible16539);\n    }\n    const jurisdictionEligibleCandidates16539=candidates.length;\n    candidates.sort((a,b)=>b.score-a.score);",
"filter candidates before ranking spacing capacity"
)

replace_once(
"      build:'EARTHLINE 16167',tier:focusMode?'focus':'regional',candidates:candidates.length,\n      chosenBeforeTierGate:chosen.length,publishedFeatures:features.length,",
"      build:'EARTHLINE 16167',tier:focusMode?'focus':'regional',candidates:candidatesBeforeJurisdiction16539,\n      preferredJurisdictionEligibleCandidates:preferredEligibleCount16539,\n      jurisdictionEligibleCandidates:jurisdictionEligibleCandidates16539,\n      jurisdictionRejectedCandidates:jurisdictionRejectedCandidates16539,\n      jurisdictionSelectionOrder:(!focusMode&&jurisdictionGeometry16539)?'jurisdiction-before-ranking-spacing-capacity':'not-applicable',\n      chosenBeforeTierGate:chosen.length,publishedFeatures:features.length,",
"generation audit"
)

replace_once(
"    let swales=makeSwales(hy,contours,focusMode);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);",
"    let selectionBoundary16539=null;\n    if(jurisdictionCapability16539){\n      selectionBoundary16539=await jurisdictionBoundaryPromise16539;\n      if(!selectionBoundary16539||!selectionBoundary16539.geometry)throw new Error('selected administrative boundary could not be resolved; no uncontained Regional result was published');\n    }\n    const swaleJurisdictionGeometry16539=selectionBoundary16539&&(selectionBoundary16539.prepared||selectionBoundary16539.geometry)||null;\n    let swales=makeSwales(hy,contours,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);",
"resolve boundary before swale selection"
)

replace_once(
"      const boundary16539=await jurisdictionBoundaryPromise16539;",
"      const boundary16539=selectionBoundary16539||await jurisdictionBoundaryPromise16539;",
"reuse resolved boundary for final containment"
)

p.write_text(s,encoding='utf-8')
print('applied:', ', '.join(repls))
