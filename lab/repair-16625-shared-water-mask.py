from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
marker = 'EARTHLINE 16625 — SHARED REGIONAL MAPPED-WATER FINAL MASK'
if marker in s:
    raise SystemExit('guard failed: 16625 marker already present')

old_sig = "async function earthlineMappedWaterSwaleGate16609(map16609,swales16609,runToken16609,useTiger16617=false){"
new_sig = "async function earthlineMappedWaterSwaleGate16609(map16609,swales16609,runToken16609,useTiger16617=false,hy16609=null){"
if s.count(old_sig) != 1:
    raise SystemExit(f'guard failed: 16609 signature count {s.count(old_sig)}')
s = s.replace(old_sig, new_sig, 1)

old_safe = """    const safe16609=[];let rejected16609=0;
    for(const f16609 of (swales16609&&swales16609.features||[])){
      const c16609=f16609&&f16609.geometry&&f16609.geometry.type==='LineString'?f16609.geometry.coordinates:[];let bad16609=false;
      for(let i16609=1;i16609<c16609.length&&!bad16609;i16609++)if(segmentHits16609(c16609[i16609-1],c16609[i16609]))bad16609=true;
      if(bad16609)rejected16609++;else safe16609.push(f16609);
    }"""
new_safe = """    /* EARTHLINE 16625 — SHARED REGIONAL MAPPED-WATER FINAL MASK.
       Extend the existing 16584 validity mask in place with the exact mapped-water
       evidence already acquired by the authoritative 16609 gate. Swales and the
       Regional recharge calculation below therefore consume one final no-build mask. */
    let sharedMaskApplied16625=false,sharedMaskInvalidatedCells16625=0;
    if(hy16609&&hy16609.validityMask16584&&hy16609.validityMask16584.length===hy16609.w*hy16609.h){
      const mask16625=hy16609.validityMask16584;
      const invalidate16625=(x16625,y16625)=>{
        if(x16625<0||y16625<0||x16625>=hy16609.w||y16625>=hy16609.h)return;
        const i16625=y16625*hy16609.w+x16625;
        if(mask16625[i16625]){mask16625[i16625]=0;sharedMaskInvalidatedCells16625++;}
        if(hy16609.slope&&i16625<hy16609.slope.length)hy16609.slope[i16625]=NaN;
        if(hy16609.acc&&i16625<hy16609.acc.length)hy16609.acc[i16625]=NaN;
      };
      for(const poly16625 of polys16609){
        const bb16625=poly16625&&poly16625.bbox;if(!bb16625)continue;
        const gA16625=llGrid(hy16609,[bb16625[0],bb16625[1]]),gB16625=llGrid(hy16609,[bb16625[2],bb16625[3]]);
        const x016625=Math.max(0,Math.floor(Math.min(gA16625.x,gB16625.x))-1),x116625=Math.min(hy16609.w-1,Math.ceil(Math.max(gA16625.x,gB16625.x))+1);
        const y016625=Math.max(0,Math.floor(Math.min(gA16625.y,gB16625.y))-1),y116625=Math.min(hy16609.h-1,Math.ceil(Math.max(gA16625.y,gB16625.y))+1);
        for(let y16625=y016625;y16625<=y116625;y16625++)for(let x16625=x016625;x16625<=x116625;x16625++){
          const ll16625=gridLL(hy16609,x16625,y16625);
          if(polyInside16609(ll16625,poly16625.rings))invalidate16625(x16625,y16625);
        }
      }
      for(const line16625 of lines16609){
        for(let j16625=1;j16625<line16625.length;j16625++){
          const a16625=line16625[j16625-1],b16625=line16625[j16625];if(!finite16609(a16625)||!finite16609(b16625))continue;
          const ga16625=llGrid(hy16609,a16625),gb16625=llGrid(hy16609,b16625),steps16625=Math.max(1,Math.ceil(Math.hypot(gb16625.x-ga16625.x,gb16625.y-ga16625.y)*4));
          for(let q16625=0;q16625<=steps16625;q16625++){
            const t16625=q16625/steps16625,x16625=Math.round(ga16625.x+(gb16625.x-ga16625.x)*t16625),y16625=Math.round(ga16625.y+(gb16625.y-ga16625.y)*t16625);
            for(let oy16625=-1;oy16625<=1;oy16625++)for(let ox16625=-1;ox16625<=1;ox16625++)invalidate16625(x16625+ox16625,y16625+oy16625);
          }
        }
      }
      sharedMaskApplied16625=true;
    }
    const safe16609=[];let rejected16609=0;
    for(const f16609 of (swales16609&&swales16609.features||[])){
      const c16609=f16609&&f16609.geometry&&f16609.geometry.type==='LineString'?f16609.geometry.coordinates:[];let bad16609=false;
      for(let i16609=1;i16609<c16609.length&&!bad16609;i16609++){
        if(segmentHits16609(c16609[i16609-1],c16609[i16609])||(sharedMaskApplied16625&&!earthlineRegionalSegmentValid16584(hy16609,c16609[i16609-1],c16609[i16609])))bad16609=true;
      }
      if(bad16609)rejected16609++;else safe16609.push(f16609);
    }"""
if s.count(old_safe) != 1:
    raise SystemExit(f'guard failed: exact 16609 swale filter count {s.count(old_safe)}')
s = s.replace(old_safe, new_safe, 1)

old_audit = "tigerHydroSource:useTiger16617?'U.S. Census Bureau TIGERweb/Hydro':null,before:before16609,after:out16609.features.length,rejected:rejected16609+tigerRejected16620,verified:verified16609,safe:verified16609,at:new Date().toISOString()"
new_audit = "tigerHydroSource:useTiger16617?'U.S. Census Bureau TIGERweb/Hydro':null,sharedFinalMask16625:sharedMaskApplied16625,sharedMaskInvalidatedCells16625:sharedMaskInvalidatedCells16625,rechargeUsesSharedMask16625:sharedMaskApplied16625,before:before16609,after:out16609.features.length,rejected:rejected16609+tigerRejected16620,verified:verified16609,safe:verified16609,at:new Date().toISOString()"
if s.count(old_audit) != 1:
    raise SystemExit(f'guard failed: 16609 audit tail count {s.count(old_audit)}')
s = s.replace(old_audit, new_audit, 1)

old_recharge = "if(!hy)hy=await hydrology(dem,validityGrid16584&&validityGrid16584.mask||null);const regionalRecharge16492=regionalRechargeModel16492(hy,loc);const contoursStarted16245=performance.now();"
new_recharge = "if(!hy)hy=await hydrology(dem,validityGrid16584&&validityGrid16584.mask||null);let regionalRecharge16492=null;const contoursStarted16245=performance.now();"
if s.count(old_recharge) != 1:
    raise SystemExit(f'guard failed: early recharge calculation count {s.count(old_recharge)}')
s = s.replace(old_recharge, new_recharge, 1)

old_call = "const mappedWaterGate16609=await earthlineMappedWaterSwaleGate16609(m,swales,runToken,usStateWaterRun16609);"
new_call = "const mappedWaterGate16609=await earthlineMappedWaterSwaleGate16609(m,swales,runToken,usStateWaterRun16609,hy);"
if s.count(old_call) != 1:
    raise SystemExit(f'guard failed: mapped-water gate call count {s.count(old_call)}')
s = s.replace(old_call, new_call, 1)

old_after = """      swales=mappedWaterGate16609.swales;
    }

    /* EARTHLINE 16329 — core preflight occurs before any final Regional display"""
new_after = """      swales=mappedWaterGate16609.swales;
    }
    /* 16625: calculate Regional recharge only after the shared final water mask is frozen. */
    regionalRecharge16492=regionalRechargeModel16492(hy,loc);

    /* EARTHLINE 16329 — core preflight occurs before any final Regional display"""
if s.count(old_after) != 1:
    raise SystemExit(f'guard failed: post-water recharge insertion count {s.count(old_after)}')
s = s.replace(old_after, new_after, 1)

p.write_text(s, encoding='utf-8')
print('16625 patch applied')
