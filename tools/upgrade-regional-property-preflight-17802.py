from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
start=s.index("/* EARTHLINE 17801")
end=s.index("    window.EARTHLINE_REGIONAL_SCORE_ORDER_16717={", start)
new=r'''/* EARTHLINE 17802 — exact Property-terrain preflight for top Regional ranks.
       A Regional candidate may be published as A1/A2/A3 only after the same z15
       Terrain-RGB sampling, governed 20-acre cell size, 3x3 smoothing, parcel
       footprint and <=4% slope math used by Property confirm real slope-safe terrain. */
    if(!focusMode&&chosen.length){
      const rows17801=[],passed17801=[],failed17801=new Set();
      const exactPropertySlope17802=async(lng17802,lat17802)=>{
        const demZ17802=15,areaM217802=20*4046.8564224;
        const wM17802=Math.sqrt(areaM217802*1.15),hM17802=areaM217802/wM17802;
        const cellM17802=clamp(Math.max(wM17802/(GW*.82),hM17802/(GH*.82)),1,7.45);
        const plan17802=earthlinePropertyTilePlan16453(demZ17802,Number(lat17802),Number(lng17802),cellM17802);
        const tmpl17802="https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}@2x.pngraw?access_token="+MAPBOX_TOKEN;
        const imgs17802=await Promise.all(plan17802.tiles.map(([tx17802,ty17802])=>
          loadImg(tmpl17802.replace("{z}",demZ17802).replace("{x}",tx17802).replace("{y}",ty17802)).catch(()=>null)
        ));
        if(imgs17802.every(im17802=>!im17802))throw new Error("all Property preflight terrain tiles failed");
        const canvas17802=document.createElement("canvas");
        canvas17802.width=512*plan17802.widthTiles;canvas17802.height=512*plan17802.heightTiles;
        const ctx17802=canvas17802.getContext("2d");let k17802=0;
        for(let row17802=0;row17802<plan17802.heightTiles;row17802++)for(let col17802=0;col17802<plan17802.widthTiles;col17802++){
          const im17802=imgs17802[k17802++];if(im17802)ctx17802.drawImage(im17802,col17802*512,row17802*512);
        }
        const demW17802=canvas17802.width,demH17802=canvas17802.height;
        const demD17802=ctx17802.getImageData(0,0,demW17802,demH17802).data;
        const raw17802=new Float32Array(GW*GH),smooth17802=new Float32Array(GW*GH);
        const mppD17802=plan17802.mpp;
        for(let gy17802=0;gy17802<GH;gy17802++)for(let gx17802=0;gx17802<GW;gx17802++){
          const dxM17802=(gx17802-GW/2)*cellM17802,dyM17802=(gy17802-GH/2)*cellM17802;
          const px17802=clamp(Math.round((plan17802.tf[0]-plan17802.x0)*512+dxM17802/mppD17802),0,demW17802-1);
          const py17802=clamp(Math.round((plan17802.tf[1]-plan17802.y0)*512+dyM17802/mppD17802),0,demH17802-1);
          const pi17802=(py17802*demW17802+px17802)*4;
          raw17802[gy17802*GW+gx17802]=-10000+(demD17802[pi17802]*65536+demD17802[pi17802+1]*256+demD17802[pi17802+2])*.1;
        }
        for(let gy17802=0;gy17802<GH;gy17802++)for(let gx17802=0;gx17802<GW;gx17802++){
          let sm17802=0,c17802=0;
          for(let oy17802=-1;oy17802<=1;oy17802++)for(let ox17802=-1;ox17802<=1;ox17802++){
            const nx17802=clamp(gx17802+ox17802,0,GW-1),ny17802=clamp(gy17802+oy17802,0,GH-1);
            sm17802+=raw17802[ny17802*GW+nx17802];c17802++;
          }
          smooth17802[gy17802*GW+gx17802]=sm17802/c17802;
        }
        let parcel17802=0,safe17802=0;
        for(let gy17802=1;gy17802<GH-1;gy17802++)for(let gx17802=1;gx17802<GW-1;gx17802++){
          const bx17802=((gx17802+.5)-GW/2)*cellM17802,by17802=((gy17802+.5)-GH/2)*cellM17802;
          if(Math.abs(bx17802)>wM17802/2||Math.abs(by17802)>hM17802/2)continue;
          parcel17802++;
          const sx17802=(smooth17802[gy17802*GW+gx17802+1]-smooth17802[gy17802*GW+gx17802-1])/(2*cellM17802);
          const sy17802=(smooth17802[(gy17802+1)*GW+gx17802]-smooth17802[(gy17802-1)*GW+gx17802])/(2*cellM17802);
          const sp17802=Math.hypot(sx17802,sy17802)*100;
          if(Number.isFinite(sp17802)&&sp17802<=4)safe17802++;
        }
        return {safeCells:safe17802,parcelCells:parcel17802,safeRatio:parcel17802?safe17802/parcel17802:0,cellM:cellM17802};
      };
      const verify17801=async(c17801,rank17801)=>{
        const seg17801=Array.isArray(c17801&&c17801.segment)?c17801.segment:[];
        const mid17801=seg17801.length?seg17801[Math.floor((seg17801.length-1)/2)]:null;
        if(!mid17801||!Number.isFinite(Number(mid17801[0]))||!Number.isFinite(Number(mid17801[1])))
          return {candidate:c17801,rankBefore:rank17801,pass:null,error:"missing-midpoint"};
        const lng17801=Number(mid17801[0]),lat17801=Number(mid17801[1]);
        try{
          const exact17802=await exactPropertySlope17802(lng17801,lat17801);
          const pass17802=exact17802.safeCells>=166&&exact17802.safeRatio>=.01;
          return {candidate:c17801,rankBefore:rank17801,pass:pass17802,safeCells:exact17802.safeCells,finiteCells:exact17802.parcelCells,safeRatio:exact17802.safeRatio,cellM:exact17802.cellM,lng:lng17801,lat:lat17801};
        }catch(e17801){
          return {candidate:c17801,rankBefore:rank17801,pass:null,error:String(e17801&&e17801.message||e17801),lng:lng17801,lat:lat17801};
        }
      };
      const max17801=Math.min(12,chosen.length),batchPlan17801=[4,8];
      let start17801=0;
      for(const batch17801 of batchPlan17801){
        if(start17801>=max17801||passed17801.length>=3)break;
        const end17801=Math.min(max17801,start17801+batch17801);
        const batchRows17801=await Promise.all(chosen.slice(start17801,end17801).map((c17801,i17801)=>verify17801(c17801,start17801+i17801+1)));
        for(const row17801 of batchRows17801){
          rows17801.push(row17801);
          if(row17801.pass===true)passed17801.push(row17801.candidate);
          else if(row17801.pass===false)failed17801.add(row17801.candidate);
        }
        start17801=end17801;
      }
      if(passed17801.length){
        const rest17801=chosen.filter(c17801=>!failed17801.has(c17801)&&!passed17801.includes(c17801));
        chosen.length=0;chosen.push(...passed17801,...rest17801);
      }
      window.EARTHLINE_REGIONAL_PROPERTY_SLOPE_PREFLIGHT_17801={
        build:"EARTHLINE 17802",lockedMaxSlopePct:4,propertyGrid:[GW,GH],propertyParcelCellsExpected:16560,
        requiredSafeCells:166,requiredSafeRatio:.01,tested:rows17801.length,passed:passed17801.length,rejected:rows17801.filter(r17801=>r17801.pass===false).length,
        rows:rows17801.map(r17801=>({rankBefore:r17801.rankBefore,pass:r17801.pass,safeCells:r17801.safeCells??null,parcelCells:r17801.finiteCells??null,safeRatio:Number.isFinite(r17801.safeRatio)?Number(r17801.safeRatio.toFixed(4)):null,cellM:Number.isFinite(r17801.cellM)?Number(r17801.cellM.toFixed(4)):null,lng:r17801.lng??null,lat:r17801.lat??null,error:r17801.error||null})),
        rule:"top Regional ranks use the exact Property Terrain-RGB sampling, smoothing, 20-acre footprint and <=4% slope math before A-rank publication",
        at:new Date().toISOString()
      };
    }
'''
p.write_text(s[:start]+new+s[end:],encoding="utf-8")
