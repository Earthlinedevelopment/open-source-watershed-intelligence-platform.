from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
start=s.find("  function earthlineLandValidityMask16584(dem16584,product16584){")
end=s.find("  function earthlineLandValidityStatus16584(){",start)
if start<0 or end<0: raise SystemExit("land validity mask owner anchor missing")
new=r'''  function earthlineRingCrossings17352(y17352,ring17352){
    const xs17352=[];
    if(!Array.isArray(ring17352)||ring17352.length<3)return xs17352;
    for(let i17352=0,j17352=ring17352.length-1;i17352<ring17352.length;j17352=i17352++){
      const a17352=ring17352[i17352]||[],b17352=ring17352[j17352]||[];
      const xi17352=Number(a17352[0]),yi17352=Number(a17352[1]),
            xj17352=Number(b17352[0]),yj17352=Number(b17352[1]);
      if(![xi17352,yi17352,xj17352,yj17352].every(Number.isFinite))continue;
      if((yi17352>y17352)!==(yj17352>y17352))
        xs17352.push((xj17352-xi17352)*(y17352-yi17352)/((yj17352-yi17352)||1e-15)+xi17352);
    }
    xs17352.sort((a17352,b17352)=>a17352-b17352);
    return xs17352;
  }
  function earthlineInsideCrossings17352(x17352,xs17352){
    let lo17352=0,hi17352=xs17352.length;
    while(lo17352<hi17352){
      const mid17352=(lo17352+hi17352)>>1;
      if(xs17352[mid17352]<=x17352)lo17352=mid17352+1;else hi17352=mid17352;
    }
    return ((xs17352.length-lo17352)&1)===1;
  }
  function earthlinePreparePartsRow17352(parts17352,lat17352){
    const rows17352=[];
    for(const part17352 of parts17352){
      const bb17352=part17352&&part17352.bbox;
      if(!bb17352||lat17352<bb17352[1]||lat17352>bb17352[3])continue;
      const rings17352=Array.isArray(part17352.rings)?part17352.rings:[];
      if(!rings17352.length)continue;
      const outer17352=earthlineRingCrossings17352(lat17352,rings17352[0]);
      if(!outer17352.length)continue;
      const holes17352=[];
      for(let i17352=1;i17352<rings17352.length;i17352++){
        const hx17352=earthlineRingCrossings17352(lat17352,rings17352[i17352]);
        if(hx17352.length)holes17352.push(hx17352);
      }
      rows17352.push({bbox:bb17352,outer:outer17352,holes:holes17352});
    }
    return rows17352;
  }
  function earthlinePointInPreparedPartsRow17352(lng17352,rowParts17352){
    for(const part17352 of rowParts17352){
      if(lng17352<part17352.bbox[0]||lng17352>part17352.bbox[2])continue;
      if(!earthlineInsideCrossings17352(lng17352,part17352.outer))continue;
      let inHole17352=false;
      for(const hole17352 of part17352.holes){
        if(earthlineInsideCrossings17352(lng17352,hole17352)){inHole17352=true;break;}
      }
      if(!inHole17352)return true;
    }
    return false;
  }
  function earthlineLandValidityMask16584(dem16584,product16584){
    const w16584=dem16584.w,h16584=dem16584.h,b16584=dem16584.bounds;
    const valid16584=new Uint8Array(w16584*h16584),outsideLandMask16632=new Uint8Array(w16584*h16584),inlandWaterMask16632=new Uint8Array(w16584*h16584);
    const landParts16584=Array.isArray(product16584&&product16584.landParts)?product16584.landParts:[];
    const waterParts16584=Array.isArray(product16584&&product16584.waterParts)?product16584.waterParts:[];
    let outsideLand16584=0,inlandWater16584=0,validCount16584=0;
    const lngs17352=new Float64Array(w16584);
    for(let x16584=0;x16584<w16584;x16584++)
      lngs17352[x16584]=b16584[0]+(b16584[2]-b16584[0])*(x16584/(w16584-1));
    for(let y16584=0;y16584<h16584;y16584++){
      const lat16584=b16584[3]-(b16584[3]-b16584[1])*(y16584/(h16584-1));
      const landRow17352=earthlinePreparePartsRow17352(landParts16584,lat16584);
      const waterRow17352=earthlinePreparePartsRow17352(waterParts16584,lat16584);
      for(let x16584=0;x16584<w16584;x16584++){
        const lng16584=lngs17352[x16584],idx17352=y16584*w16584+x16584;
        const onLand16584=earthlinePointInPreparedPartsRow17352(lng16584,landRow17352);
        if(!onLand16584){outsideLand16584++;outsideLandMask16632[idx17352]=1;continue;}
        const inWater16584=earthlinePointInPreparedPartsRow17352(lng16584,waterRow17352);
        if(inWater16584){inlandWater16584++;inlandWaterMask16632[idx17352]=1;continue;}
        valid16584[idx17352]=1;validCount16584++;
      }
    }
    const audit16584={
      build:"EARTHLINE 16584",
      grid:{w:w16584,h:h16584,total:w16584*h16584,rule:"DEM node coordinate inside land AND outside Natural Earth lake polygon"},
      mappedFeatureCount:{
        land:Number(product16584&&product16584.landSurfaceGeometry&&product16584.landSurfaceGeometry.mappedFeatureCount||0),
        inlandWater:Number(product16584&&product16584.inlandWaterGeometry&&product16584.inlandWaterGeometry.mappedFeatureCount||0)
      },
      mappedAreaCount:{
        land:Number(product16584&&product16584.landSurfaceGeometry&&product16584.landSurfaceGeometry.mappedAreaCount||0),
        inlandWater:Number(product16584&&product16584.inlandWaterGeometry&&product16584.inlandWaterGeometry.mappedAreaCount||0)
      },
      rasterizedInvalidWaterCellCount:outsideLand16584+inlandWater16584,
      outsideLandCellCount:outsideLand16584,
      inlandWaterCellCount:inlandWater16584,
      validLandCellCount:validCount16584,
      at:new Date().toISOString()
    };
    window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=audit16584;
    return {mask:valid16584,audit:audit16584,outsideLandMask16632,inlandWaterMask16632};
  }
'''
s=s[:start]+new+s[end:]
s="<!-- EARTHLINE_SCANLINE_LAND_VALIDITY_17352: exact row-cached ray-casting; same land/lake evidence and point-in-polygon parity, no browser-specific science. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed scanline land-validity owner 17352")
