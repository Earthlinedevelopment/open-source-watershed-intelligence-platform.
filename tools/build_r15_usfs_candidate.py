from pathlib import Path
from hashlib import sha256
import sys
src=Path(sys.argv[1]); dst=Path(sys.argv[2]);b=src.read_bytes()
expected='53b667b330ed1edd5c4dde3e0fa9a279615649e4506b8750d62c7ee0f26ff335'
actual=sha256(b).hexdigest()
assert actual==expected,(actual,expected)
old=b'<script src="earthline-property-swales.js?v=92b3e42d"></script>\n'
new=old+b'<script src="earthline-usfs-canopy-r15.js?v=a3c8a3db"></script>\n'
assert b.count(old)==1 and new not in b
b=b.replace(old,new,1)
old=b'''    /* intact closed forest ranks last, never removed */
    let landcover=null;
    try{if(typeof _canopyData!=="undefined"&&_canopyData){landcover=new Uint8Array(N);for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(canopyAt(x,y)>0.40)landcover[idx(x,y)]=1;}}catch(_){landcover=null;}
    earthlineRecordTerrainHandoff15791("clean-engine-inputs",myGen);'''
new=b'''    /* R15 CANDIDATE ONLY: georeferenced, independent USDA Forest Service TCC 30m data.
       Do not substitute absent Mapbox satellite canvas. Missing coverage => fail closed. */
    let landcover=null,canopyProvenance16600=null;
    const canopySource16600=window.EarthlineUSFSCanopyR15;
    if(!canopySource16600||typeof canopySource16600.load!=="function"){
      fail("r15-canopy-source-module-unavailable",{source:"USDA Forest Service TCC 30m"});return false;
    }
    const canopyResult16600=await canopySource16600.load({frame,w:GW,h:GH,cellM,inside});
    if(earthlineIsStale(myGen))return false;
    if(!canopyResult16600.ok||!canopyResult16600.mask||canopyResult16600.mask.length!==N){
      fail("r15-canopy-evidence-unavailable",{reason:canopyResult16600.reason||"incomplete",source:canopyResult16600.source||"USFS TCC"});return false;
    }
    landcover=canopyResult16600.mask;
    canopyProvenance16600=canopyResult16600.evidence;
    earthlineRecordTerrainHandoff15791("clean-engine-inputs",myGen);'''
assert b.count(old)==1,"canopy engine anchor mismatch"
b=b.replace(old,new,1)
old=b'      rejections:rej,coverage:out.evidence.coverage,evidence:out.evidence,params,'
new=b'      rejections:rej,coverage:out.evidence.coverage,evidence:Object.assign({},out.evidence,{canopyProvenance:canopyProvenance16600}),params,'
assert b.count(old)==1
b=b.replace(old,new,1)
assert b.count(b'earthline-usfs-canopy-r15.js')==1
print('R15_USFS_CANDIDATE', sha256(b).hexdigest(), 'delta',len(b)-len(src.read_bytes()))
dst.write_bytes(b)
