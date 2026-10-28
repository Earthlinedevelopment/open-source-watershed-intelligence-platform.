from pathlib import Path
import sys

path=Path(sys.argv[1] if len(sys.argv)>1 else "index.html")
s=path.read_text(encoding="utf-8")

old='''    const medSlopeRaw=Number(medianSlopeInParcel());
    const medSlope=clampN(Number.isFinite(medSlopeRaw)?medSlopeRaw:0.012,0.012,0.45);
'''
new='''    const propertySafeSlopeFractions15771=[];
    if(!isRegionalTile15769){
      for(let y=2;y<GH-2;y++)for(let x=2;x<GW-2;x++){
        const i=idx(x,y);
        if(!M.inP[i]||M.pond[i]||(M.noBuildMask&&M.noBuildMask[i]))continue;
        if((M.acc[i]||0)>=chanThr)continue;
        const sp=Number(slopePct(x,y));
        if(Number.isFinite(sp)&&sp<=maxS)propertySafeSlopeFractions15771.push(sp/100);
      }
      propertySafeSlopeFractions15771.sort((a,b)=>a-b);
    }
    const parcelMedianSlope15771=Number(medianSlopeInParcel());
    const medSlopeRaw=propertySafeSlopeFractions15771.length
      ?propertySafeSlopeFractions15771[Math.floor(propertySafeSlopeFractions15771.length/2)]
      :parcelMedianSlope15771;
    const medSlope=clampN(Number.isFinite(medSlopeRaw)?medSlopeRaw:0.012,0.012,maxS/100);
'''
if s.count(old)!=1:
    raise SystemExit(f"expected one Property median-slope owner; found {s.count(old)}")
s=s.replace(old,new)

old2='''    const maxLevels=Math.max(1,Number(work15771.maxLevels)||1);
    if(!Number.isFinite(levelStep)||levelStep<=0){
      levelStep=Math.max(0.08,range/maxLevels);
      M.swaleDiagnostics.levelGenerator.levelStepGuard="nonfinite-or-nonpositive";
    }
    if(range/levelStep>maxLevels)levelStep=range/maxLevels;
'''
new2='''    const configuredMaxLevels15771=Math.max(1,Number(work15771.maxLevels)||1);
    const targetLevelCount15771=Math.ceil(range/Math.max(0.08,Number(levelStep)||0.08));
    const maxLevels=isRegionalTile15769
      ?configuredMaxLevels15771
      :Math.max(configuredMaxLevels15771,Math.min(512,targetLevelCount15771));
    if(!Number.isFinite(levelStep)||levelStep<=0){
      levelStep=Math.max(0.08,range/maxLevels);
      M.swaleDiagnostics.levelGenerator.levelStepGuard="nonfinite-or-nonpositive";
    }
    if(range/levelStep>maxLevels)levelStep=range/maxLevels;
    M.swaleDiagnostics.levelGenerator.propertySafeSlopeSamples15771=propertySafeSlopeFractions15771.length;
    M.swaleDiagnostics.levelGenerator.parcelMedianSlope15771=Number.isFinite(parcelMedianSlope15771)?parcelMedianSlope15771:null;
    M.swaleDiagnostics.levelGenerator.targetLevelCount15771=targetLevelCount15771;
    M.swaleDiagnostics.levelGenerator.effectiveMaxLevels15771=maxLevels;
'''
if s.count(old2)!=1:
    raise SystemExit(f"expected one level-cap owner; found {s.count(old2)}")
s=s.replace(old2,new2)
path.write_text(s,encoding="utf-8")
print("PROPERTY_LEVEL_SPACING_SCIENCE_READY")
