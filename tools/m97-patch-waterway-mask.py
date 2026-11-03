from pathlib import Path
import hashlib
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old_sha=hashlib.sha256(s.encode()).hexdigest()
assert old_sha=='8d8d3d61bb25d4f83890ed04d2480557f8ad36e53d558ea77d8a95ed78ffe132',f'Unexpected live source; refuse modification: {old_sha}'
edits=[
 ("function earthlineBuildNoBuildMask(){",
  """/* M97: a modeled D8 rill is not automatically a mapped/protected waterway.
   Require at least 0.25 ha of locally modeled contributing area before treating
   a DEM-only path as a protected major channel. Roads, structures, mapped water
   and actual pond cells remain absolute exclusions; slope stays <=4%. The
   unverified source must never be presented as construction-ready clearance. */
function earthlineProtectedMajorChannelThresholdM97(){
  const cellM=Math.max(0.5,Number(M.cellM||1));
  const minAreaM2=2500; /* 0.25 hectare of upstream contributing area */
  return Math.max(3,Math.ceil(streamThreshold()*3.2),Math.ceil(minAreaM2/(cellM*cellM)));
}
function earthlineBuildNoBuildMask(){"""),
 ("  const cell=Math.max(.5,Number(M.cellM||1));\n  const channelThreshold=Math.max(3,streamThreshold()*3.0);",
  "  const cell=Math.max(.5,Number(M.cellM||1));\n  const channelThreshold=earthlineProtectedMajorChannelThresholdM97();"),
 ("function earthlineMajorChannelUnsafeAt16288(cx,cy){\n  const threshold=streamThreshold()*3.2;",
  "function earthlineMajorChannelUnsafeAt16288(cx,cy){\n  const threshold=earthlineProtectedMajorChannelThresholdM97();"),
 ("  if(earthlineNoBuildBuffered(gx,gy))return false;\n  const channelThreshold=streamThreshold()*3.2;",
  "  if(earthlineNoBuildBuffered(gx,gy))return false;\n  const channelThreshold=earthlineProtectedMajorChannelThresholdM97();"),
 ("    waterRadiusM:waterRadius*cell,\n    noBuildCellsFromWater:",
  "    waterRadiusM:waterRadius*cell,\n    terrainOnlyProtectedChannelThresholdCells:channelThreshold,\n    terrainOnlyMinimumMajorContributingAreaM2:2500,\n    noBuildCellsFromWater:"),
 ("    const safeSlope=slopePct(x,y)<=33;",
  "    const safeSlope=slopePct(x,y)<=4;"),
 ("the live terrain is classifying most cells above the 33% slope limit",
  "the live terrain is classifying most cells above the 4% slope limit")
]
for old,new in edits:
 hits=s.count(old)
 assert hits==1,(f'Wrong occurrence count {hits}',old[:100])
 s=s.replace(old,new,1)
assert s.count("function earthlineProtectedMajorChannelThresholdM97()")==1
assert s.count("terrainOnlyProtectedChannelThresholdCells:channelThreshold")==1
p.write_text(s,encoding='utf-8')
new_sha=hashlib.sha256(s.encode()).hexdigest()
print('M97_PROPERTY_WATERWAY_MASK_PATCH',new_sha)
