from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""        const loadedTiles17348=await Promise.all(tiles16702.map(async tile16702=>({tile16702,d16702:await loadDEM(tile16702.b,112,112,6000,'scale refinement '+tile16702.id)})));
        const tileResults16702=await Promise.all(loadedTiles17348.map(async ({tile16702,d16702})=>{
          const g16702=earthlineLandValidityMask16584(d16702,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16702;
          const h16702=await hydrology(d16702,g16702.mask);h16702.outsideLandMask16632=g16702.outsideLandMask16632||null;h16702.inlandWaterMask16632=g16702.inlandWaterMask16632||null;
"""
new="""        const fetchStart17350=performance.now();
        const loadedTiles17348=await Promise.all(tiles16702.map(async tile16702=>({tile16702,d16702:await loadDEM(tile16702.b,112,112,6000,'scale refinement '+tile16702.id)})));
        const fetchDone17350=performance.now();
        const tileResults16702=await Promise.all(loadedTiles17348.map(async ({tile16702,d16702})=>{
          const computeStart17350=performance.now();
          const g16702=earthlineLandValidityMask16584(d16702,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16702;
          const landDone17350=performance.now();
          const h16702=await hydrology(d16702,g16702.mask);h16702.outsideLandMask16632=g16702.outsideLandMask16632||null;h16702.inlandWaterMask16632=g16702.inlandWaterMask16632||null;
          const hydroDone17350=performance.now();
"""
if s.count(old)!=1: raise SystemExit("17350 start anchor")
s=s.replace(old,new,1)
old2="""          elevs16702.sort((a,b)=>a-b);const levels16702=[],seen16702=new Set();if(elevs16702.length){for(const frac of [.05,.12,.22,.34,.47,.60]){const e=elevs16702[Math.min(elevs16702.length-1,Math.floor((elevs16702.length-1)*frac))],k=Math.round(e*2)/2;if(!seen16702.has(k)){seen16702.add(k);levels16702.push(k);}}}
          const c16702=await makeContours(h16702,true,levels16702),s16702=await makeSwales(h16702,c16702,false,swaleJurisdictionGeometry16539,null);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16702;
"""
new2="""          elevs16702.sort((a,b)=>a-b);const levels16702=[],seen16702=new Set();if(elevs16702.length){for(const frac of [.05,.12,.22,.34,.47,.60]){const e=elevs16702[Math.min(elevs16702.length-1,Math.floor((elevs16702.length-1)*frac))],k=Math.round(e*2)/2;if(!seen16702.has(k)){seen16702.add(k);levels16702.push(k);}}}
          const prepDone17350=performance.now();
          const c16702=await makeContours(h16702,true,levels16702),contourDone17350=performance.now();
          const s16702=await makeSwales(h16702,c16702,false,swaleJurisdictionGeometry16539,null),swaleDone17350=performance.now();window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16702;
"""
if s.count(old2)!=1: raise SystemExit("17350 contour anchor")
s=s.replace(old2,new2,1)
old3="""          const picked=[];for(const r of rows){if(picked.length>=12)break;if(picked.some(p=>Math.hypot(p.f.properties?.rank||0-r.f.properties?.rank||0,0)<0))continue;picked.push(r);}
          return picked.map(r=>{const mg=llGrid(hy,r.mid);return {segment:r.seg,x:Math.max(1,Math.min(hy.w-2,Math.round(mg.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(mg.y))),slope:Number(r.f.properties?.slope_pct||.2),acc:0,maxAcc:0,score:Math.max(0,Math.min(1,Number(r.f.properties?.score||0)/100)),confidence:'preferred',minLinePx16632:4,refined16702:true,coastKm16702:Number(r.km.toFixed(1)),tile16702:tile16702.id};});
        }));
        const rawSupplemental16702=tileResults16702.flat().sort"""
new3="""          const picked=[];for(const r of rows){if(picked.length>=12)break;if(picked.some(p=>Math.hypot(p.f.properties?.rank||0-r.f.properties?.rank||0,0)<0))continue;picked.push(r);}
          const postDone17350=performance.now();
          (window.EARTHLINE_SCALE_TILE_PHASES_17350||(window.EARTHLINE_SCALE_TILE_PHASES_17350=[])).push({id:tile16702.id,landMs:Math.round(landDone17350-computeStart17350),hydrologyMs:Math.round(hydroDone17350-landDone17350),prepMs:Math.round(prepDone17350-hydroDone17350),contourMs:Math.round(contourDone17350-prepDone17350),swaleMs:Math.round(swaleDone17350-contourDone17350),postMs:Math.round(postDone17350-swaleDone17350),totalComputeMs:Math.round(postDone17350-computeStart17350)});
          return picked.map(r=>{const mg=llGrid(hy,r.mid);return {segment:r.seg,x:Math.max(1,Math.min(hy.w-2,Math.round(mg.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(mg.y))),slope:Number(r.f.properties?.slope_pct||.2),acc:0,maxAcc:0,score:Math.max(0,Math.min(1,Number(r.f.properties?.score||0)/100)),confidence:'preferred',minLinePx16632:4,refined16702:true,coastKm16702:Number(r.km.toFixed(1)),tile16702:tile16702.id};});
        }));
        window.EARTHLINE_SCALE_PHASE_PROFILE_17350={fetchMs:Math.round(fetchDone17350-fetchStart17350),computeWallMs:Math.round(performance.now()-fetchDone17350),tiles:(window.EARTHLINE_SCALE_TILE_PHASES_17350||[]).slice()};
        const rawSupplemental16702=tileResults16702.flat().sort"""
if s.count(old3)!=1: raise SystemExit("17350 post anchor")
s=s.replace(old3,new3,1)
s="<!-- EARTHLINE_SCALE_PHASE_PROFILE_17350: diagnostic-only coastal refinement phase timing. -->\n"+s
p.write_text(s,encoding="utf-8")
print("instrumented scale refinement 17350")
