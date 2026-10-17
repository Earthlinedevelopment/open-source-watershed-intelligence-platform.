from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
anchor="  function earthlineLandValidityMask16584(dem16584,product16584){"
i=s.find(anchor)
if i<0: raise SystemExit("land validity mask anchor missing")
j=s.find("  function earthlineLandValidityStatus16584(){",i)
if j<0: raise SystemExit("land validity status anchor missing")
new=r'''  function earthlineRingScanCuts17352(y16584,ring16584){
    const cuts16584=[];
    if(!Array.isArray(ring16584)||ring16584.length<3)return cuts16584;
    for(let i16584=0,j16584=ring16584.length-1;i16584<ring16584.length;j16584=i16584++){
      const a16584=ring16584[i16584]||[],b16584=ring16584[j16584]||[];
      const xi16584=Number(a16584[0]),yi16584=Number(a16584[1]),
            xj16584=Number(b16584[0]),yj16584=Number(b16584[1]);
      if(![xi16584,yi16584,xj16584,yj16584].every(Number.isFinite))continue;
      if((yi16584>y16584)!==(yj16584>y16584))
        cuts16584.push((xj16584-xi16584)*(y16584-yi16584)/((yj16584-yi16584)||1e-15)+xi16584);
    }
    cuts16584.sort((a16584,b16584)=>a16584-b16584);
    return cuts16584;
  }
  function earthlineScanCutsContain17352(x16584,cuts16584){
    let lo16584=0,hi16584=cuts16584.length;
    while(lo16584<hi16584){
      const mid16584=(lo16584+hi16584)>>1;
      if(cuts16584[mid16584]<=x16584)lo16584=mid16584+1;else hi16584=mid16584;
    }
    return ((cuts16584.length-lo16584)&1)===1;
  }
  function earthlinePrepareScanlineParts17352(parts16584,y16584){
    const out16584=[];
    for(const part16584 of parts16584){
      const bb16584=part16584&&part16584.bbox;
      if(!bb16584||y16584<bb16584[1]||y16584>bb16584[3])continue;
      const rings16584=Array.isArray(part16584.rings)?part16584.rings:[];
      if(!rings16584.length)continue;
      const outer16584=earthlineRingScanCuts17352(y16584,rings16584[0]);
      if(!outer16584.length)continue;
      const holes16584=[];
      for(let r16584=1;r16584<rings16584.length;r16584++){
        const c16584=earthlineRingScanCuts17352(y16584,rings16584[r16584]);
        if(c16584.length)holes16584.push(c16584);
      }
      out16584.push({bbox:bb16584,outer:outer16584,holes:holes16584});
    }
    return out16584;
  }
  function earthlineScanlinePartContains17352(x16584,part16584){
    if(x16584<part16584.bbox[0]||x16584>part16584.bbox[2]||
       !earthlineScanCutsContain17352(x16584,part16584.outer))return false;
    for(const hole16584 of part16584.holes)
      if(earthlineScanCutsContain17352(x16584,hole16584))return false;
    return true;
  }
  function earthlineLandValidityMask16584(dem16584,product16584){
    const w16584=dem16584.w,h16584=dem16584.h,b16584=dem16584.bounds;
    const valid16584=new Uint8Array(w16584*h16584),outsideLandMask16632=new Uint8Array(w16584*h16584),inlandWaterMask16632=new Uint8Array(w16584*h16584);
    const landParts16584=Array.isArray(product16584&&product16584.landParts)?product16584.landParts:[];
    const waterParts16584=Array.isArray(product16584&&product16584.waterParts)?product16584.waterParts:[];
    let outsideLand16584=0,inlandWater16584=0,validCount16584=0;
    for(let y16584=0;y16584<h16584;y16584++){
      const lat16584=b16584[3]-(b16584[3]-b16584[1])*(y16584/(h16584-1));
      const landRow16584=earthlinePrepareScanlineParts17352(landParts16584,lat16584);
      const waterRow16584=earthlinePrepareScanlineParts17352(waterParts16584,lat16584);
      for(let x16584=0;x16584<w16584;x16584++){
        const lng16584=b16584[0]+(b16584[2]-b16584[0])*(x16584/(w16584-1));
        let onLand16584=false;
        for(const part16584 of landRow16584){
          if(earthlineScanlinePartContains17352(lng16584,part16584)){onLand16584=true;break;}
        }
        if(!onLand16584){outsideLand16584++;outsideLandMask16632[y16584*w16584+x16584]=1;continue;}
        let inWater16584=false;
        for(const part16584 of waterRow16584){
          if(earthlineScanlinePartContains17352(lng16584,part16584)){inWater16584=true;break;}
        }
        if(inWater16584){inlandWater16584++;inlandWaterMask16632[y16584*w16584+x16584]=1;continue;}
        valid16584[y16584*w16584+x16584]=1;validCount16584++;
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
s=s[:i]+new+s[j:]
s="<!-- EARTHLINE_LAND_VALIDITY_SCANLINE_17352: exact ray-crossing scanline reuse; same Natural Earth land/lake validity rule, no science or threshold change. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed land-validity scanline reuse 17352")
