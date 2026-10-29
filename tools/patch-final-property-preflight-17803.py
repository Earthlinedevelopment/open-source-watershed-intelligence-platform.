from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="    const priorityPreviewEnabled16329=false;"
if s.count(marker)!=1:
    raise SystemExit(f"expected one final Regional preflight marker, found {s.count(marker)}")
block=r'''    /* EARTHLINE 17803 — FINAL REGIONAL->PROPERTY TARGET PREFLIGHT.
       Before Regional A/B/C publication, verify the actual corridor midpoint that
       Property will analyze using the exact z15 Terrain-RGB / 20-acre Property grid.
       This runs once on the final Regional swale set, not inside recursive refinement. */
    if(!focusMode&&swales&&Array.isArray(swales.features)&&swales.features.length){
      const exactPropertySlope17803=async(lng17803,lat17803)=>{
        const demZ17803=15,areaM217803=20*4046.8564224;
        const wM17803=Math.sqrt(areaM217803*1.15),hM17803=areaM217803/wM17803;
        const cellM17803=clamp(Math.max(wM17803/(GW*.82),hM17803/(GH*.82)),1,7.45);
        const plan17803=earthlinePropertyTilePlan16453(demZ17803,Number(lat17803),Number(lng17803),cellM17803);
        const tmpl17803="https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}@2x.pngraw?access_token="+MAPBOX_TOKEN;
        const imgs17803=await Promise.all(plan17803.tiles.map(([tx17803,ty17803])=>
          loadImg(tmpl17803.replace("{z}",demZ17803).replace("{x}",tx17803).replace("{y}",ty17803)).catch(()=>null)
        ));
        if(imgs17803.every(im17803=>!im17803))throw new Error("all Property preflight terrain tiles failed");
        const canvas17803=document.createElement("canvas");
        canvas17803.width=512*plan17803.widthTiles;canvas17803.height=512*plan17803.heightTiles;
        const ctx17803=canvas17803.getContext("2d");let k17803=0;
        for(let row17803=0;row17803<plan17803.heightTiles;row17803++)for(let col17803=0;col17803<plan17803.widthTiles;col17803++){
          const im17803=imgs17803[k17803++];if(im17803)ctx17803.drawImage(im17803,col17803*512,row17803*512);
        }
        const demW17803=canvas17803.width,demH17803=canvas17803.height;
        const demD17803=ctx17803.getImageData(0,0,demW17803,demH17803).data;
        const raw17803=new Float32Array(GW*GH),smooth17803=new Float32Array(GW*GH),mpp17803=plan17803.mpp;
        for(let gy17803=0;gy17803<GH;gy17803++)for(let gx17803=0;gx17803<GW;gx17803++){
          const dxM17803=(gx17803-GW/2)*cellM17803,dyM17803=(gy17803-GH/2)*cellM17803;
          const px17803=clamp(Math.round((plan17803.tf[0]-plan17803.x0)*512+dxM17803/mpp17803),0,demW17803-1);
          const py17803=clamp(Math.round((plan17803.tf[1]-plan17803.y0)*512+dyM17803/mpp17803),0,demH17803-1);
          const pi17803=(py17803*demW17803+px17803)*4;
          raw17803[gy17803*GW+gx17803]=-10000+(demD17803[pi17803]*65536+demD17803[pi17803+1]*256+demD17803[pi17803+2])*.1;
        }
        for(let gy17803=0;gy17803<GH;gy17803++)for(let gx17803=0;gx17803<GW;gx17803++){
          let sm17803=0,n17803=0;
          for(let oy17803=-1;oy17803<=1;oy17803++)for(let ox17803=-1;ox17803<=1;ox17803++){
            const nx17803=clamp(gx17803+ox17803,0,GW-1),ny17803=clamp(gy17803+oy17803,0,GH-1);
            sm17803+=raw17803[ny17803*GW+nx17803];n17803++;
          }
          smooth17803[gy17803*GW+gx17803]=sm17803/n17803;
        }
        let parcel17803=0,safe17803=0;
        for(let gy17803=1;gy17803<GH-1;gy17803++)for(let gx17803=1;gx17803<GW-1;gx17803++){
          const bx17803=((gx17803+.5)-GW/2)*cellM17803,by17803=((gy17803+.5)-GH/2)*cellM17803;
          if(Math.abs(bx17803)>wM17803/2||Math.abs(by17803)>hM17803/2)continue;
          parcel17803++;
          const sx17803=(smooth17803[gy17803*GW+gx17803+1]-smooth17803[gy17803*GW+gx17803-1])/(2*cellM17803);
          const sy17803=(smooth17803[(gy17803+1)*GW+gx17803]-smooth17803[(gy17803-1)*GW+gx17803])/(2*cellM17803);
          const sp17803=Math.hypot(sx17803,sy17803)*100;
          if(Number.isFinite(sp17803)&&sp17803<=4)safe17803++;
        }
        return {safeCells:safe17803,parcelCells:parcel17803,safeRatio:parcel17803?safe17803/parcel17803:0,cellM:cellM17803};
      };
      const original17803=swales.features.slice().sort((a17803,b17803)=>Number(a17803?.properties?.rank||999)-Number(b17803?.properties?.rank||999));
      const rows17803=[],passed17803=[],failed17803=[],unknown17803=[];
      const verify17803=async(f17803,rankBefore17803)=>{
        const coords17803=f17803?.geometry?.type==="LineString"?f17803.geometry.coordinates:[];
        const mid17803=coords17803[Math.floor((coords17803.length-1)/2)];
        if(!mid17803||!Number.isFinite(Number(mid17803[0]))||!Number.isFinite(Number(mid17803[1])))
          return {feature:f17803,rankBefore:rankBefore17803,pass:null,error:"missing-midpoint"};
        const lng17803=Number(mid17803[0]),lat17803=Number(mid17803[1]);
        try{
          const exact17803=await exactPropertySlope17803(lng17803,lat17803);
          const pass17803=exact17803.safeCells>=166&&exact17803.safeRatio>=.01;
          return {feature:f17803,rankBefore:rankBefore17803,pass:pass17803,lng:lng17803,lat:lat17803,...exact17803};
        }catch(e17803){
          return {feature:f17803,rankBefore:rankBefore17803,pass:null,lng:lng17803,lat:lat17803,error:String(e17803&&e17803.message||e17803)};
        }
      };
      const max17803=Math.min(12,original17803.length);
      for(let start17803=0;start17803<max17803&&passed17803.length<3;start17803+=4){
        const batch17803=await Promise.all(original17803.slice(start17803,Math.min(max17803,start17803+4)).map((f17803,i17803)=>verify17803(f17803,start17803+i17803+1)));
        for(const row17803 of batch17803){
          rows17803.push(row17803);
          if(row17803.pass===true)passed17803.push(row17803.feature);
          else if(row17803.pass===false)failed17803.push(row17803.feature);
          else unknown17803.push(row17803.feature);
        }
      }
      if(passed17803.length){
        const tested17803=new Set(rows17803.map(r17803=>r17803.feature));
        const untouched17803=original17803.filter(f17803=>!tested17803.has(f17803));
        swales={type:"FeatureCollection",features:[...passed17803,...unknown17803,...untouched17803,...failed17803]};
        swales.features.forEach((f17803,i17803)=>{
          const p17803=f17803.properties||(f17803.properties={}),rank17803=i17803+1;
          const grade17803=/^[ABC]$/.test(String(p17803.grade||""))?String(p17803.grade):"C";
          p17803.rank=rank17803;p17803.display_rank=rank17803;p17803.display_code=grade17803+rank17803;
          p17803.label=String(p17803.label||grade17803+rank17803+" — REGIONAL BIOSWALE OPPORTUNITY").replace(/^[ABC]\d+\s*[—•-]\s*/i,grade17803+rank17803+" — ");
        });
      }
      window.EARTHLINE_FINAL_PROPERTY_PREFLIGHT_17803={
        build:"EARTHLINE 17803",lockedMaxSlopePct:4,requiredSafeCells:166,requiredSafeRatio:.01,
        tested:rows17803.length,passed:passed17803.length,rejected:failed17803.length,unknown:unknown17803.length,
        reordered:passed17803.length>0,
        rows:rows17803.map(r17803=>({rankBefore:r17803.rankBefore,pass:r17803.pass,safeCells:r17803.safeCells??null,parcelCells:r17803.parcelCells??null,safeRatio:Number.isFinite(r17803.safeRatio)?Number(r17803.safeRatio.toFixed(4)):null,lng:r17803.lng??null,lat:r17803.lat??null,error:r17803.error||null})),
        rule:"final Regional corridor priority is verified at the exact Property midpoint and exact 20-acre <=4% Terrain-RGB slope grid before publication",
        at:new Date().toISOString()
      };
    }

'''
p.write_text(s.replace(marker,block+marker,1),encoding="utf-8")
