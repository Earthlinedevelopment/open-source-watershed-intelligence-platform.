from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    chosen.sort((a16717,b16717)=>(Number(b16717&&b16717.score)||0)-(Number(a16717&&a16717.score)||0));
    window.EARTHLINE_REGIONAL_SCORE_ORDER_16717={"""
new="""    chosen.sort((a16717,b16717)=>(Number(b16717&&b16717.score)||0)-(Number(a16717&&a16717.score)||0));
    /* EARTHLINE 17801 — Property-scale slope truth must own the top Regional opportunity ranks.
       Statewide/refinement DEMs can smooth mountain terrain enough to create false <=4% A1 sites.
       Verify leading candidates in small parallel batches using a ~20-acre high-resolution DEM. */
    if(!focusMode&&chosen.length&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>=5000){
      const rows17801=[],passed17801=[],failed17801=new Set();
      const verify17801=async(c17801,rank17801)=>{
        const seg17801=Array.isArray(c17801&&c17801.segment)?c17801.segment:[];
        const mid17801=seg17801.length?seg17801[Math.floor((seg17801.length-1)/2)]:null;
        if(!mid17801||!Number.isFinite(Number(mid17801[0]))||!Number.isFinite(Number(mid17801[1])))
          return {candidate:c17801,rankBefore:rank17801,pass:null,error:'missing-midpoint'};
        const lng17801=Number(mid17801[0]),lat17801=Number(mid17801[1]),halfM17801=160;
        const dLat17801=halfM17801/111320;
        const dLng17801=halfM17801/(111320*Math.max(.20,Math.cos(lat17801*Math.PI/180)));
        try{
          const d17801=await loadDEM([lng17801-dLng17801,lat17801-dLat17801,lng17801+dLng17801,lat17801+dLat17801],64,64,4500,'Regional Property-scale slope preflight '+rank17801);
          const h17801=await hydrology(d17801,null);
          let finite17801=0,safe17801=0;
          for(let i17801=0;i17801<h17801.slope.length;i17801++){
            const sp17801=Number(h17801.slope[i17801]);
            if(!Number.isFinite(sp17801))continue;
            finite17801++;
            if(sp17801<=4)safe17801++;
          }
          const ratio17801=finite17801?safe17801/finite17801:0;
          return {candidate:c17801,rankBefore:rank17801,pass:safe17801>=24&&ratio17801>=.01,safeCells:safe17801,finiteCells:finite17801,safeRatio:ratio17801,lng:lng17801,lat:lat17801};
        }catch(e17801){
          return {candidate:c17801,rankBefore:rank17801,pass:null,error:String(e17801&&e17801.message||e17801),lng:lng17801,lat:lat17801};
        }
      };
      const max17801=Math.min(24,chosen.length),batch17801=6;
      for(let start17801=0;start17801<max17801&&passed17801.length<3;start17801+=batch17801){
        const batchRows17801=await Promise.all(chosen.slice(start17801,Math.min(max17801,start17801+batch17801)).map((c17801,i17801)=>verify17801(c17801,start17801+i17801+1)));
        for(const row17801 of batchRows17801){
          rows17801.push(row17801);
          if(row17801.pass===true)passed17801.push(row17801.candidate);
          else if(row17801.pass===false)failed17801.add(row17801.candidate);
        }
      }
      if(passed17801.length){
        const rest17801=chosen.filter(c17801=>!failed17801.has(c17801)&&!passed17801.includes(c17801));
        chosen.length=0;chosen.push(...passed17801,...rest17801);
      }
      window.EARTHLINE_REGIONAL_PROPERTY_SLOPE_PREFLIGHT_17801={
        build:'EARTHLINE 17801',cellThresholdM:5000,lockedMaxSlopePct:4,halfSideM:160,
        requiredSafeCells:24,requiredSafeRatio:.01,tested:rows17801.length,passed:passed17801.length,rejected:rows17801.filter(r17801=>r17801.pass===false).length,
        rows:rows17801.map(r17801=>({rankBefore:r17801.rankBefore,pass:r17801.pass,safeCells:r17801.safeCells??null,finiteCells:r17801.finiteCells??null,safeRatio:Number.isFinite(r17801.safeRatio)?Number(r17801.safeRatio.toFixed(4)):null,lng:r17801.lng??null,lat:r17801.lat??null,error:r17801.error||null})),
        rule:'top coarse Regional candidates are rank-eligible only after a ~20-acre high-resolution DEM confirms real <=4% terrain; Property science threshold is unchanged',
        at:new Date().toISOString()
      };
    }
    window.EARTHLINE_REGIONAL_SCORE_ORDER_16717={"""
n=s.count(old)
if n != 1:
    raise SystemExit(f"expected one ranking marker, found {n}")
p.write_text(s.replace(old,new),encoding="utf-8")
