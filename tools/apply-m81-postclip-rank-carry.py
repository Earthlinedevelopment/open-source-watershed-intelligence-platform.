from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""        for(const row17803 of batch17803){
          rows17803.push(row17803);
          if(row17803.pass===true)passed17803.push(row17803.feature);
          else if(row17803.pass===false)failed17803.push(row17803.feature);
          else unknown17803.push(row17803.feature);
        }"""
new="""        for(const row17803 of batch17803){
          rows17803.push(row17803);
          if(row17803.feature){
            const p17805=row17803.feature.properties||(row17803.feature.properties={});
            p17805.property_preflight_17805=row17803.pass===true?'pass':(row17803.pass===false?'fail':'unknown');
            p17805.property_preflight_safe_cells_17805=Number(row17803.safeCells||0);
            p17805.property_preflight_safe_ratio_17805=Number(row17803.safeRatio||0);
          }
          if(row17803.pass===true)passed17803.push(row17803.feature);
          else if(row17803.pass===false)failed17803.push(row17803.feature);
          else unknown17803.push(row17803.feature);
        }"""
if old not in s: raise SystemExit("preflight annotation owner not found")
s=s.replace(old,new,1)

anchor="""      window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539=
        JSON.parse(JSON.stringify(genericBoundaryAudit16539));
    }
    if(focusMode){for(const f of swales.features||[])"""
insert="""      window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539=
        JSON.parse(JSON.stringify(genericBoundaryAudit16539));
    }
    if(!focusMode&&swales&&Array.isArray(swales.features)&&swales.features.length){
      const pass17805=[],unknown17805=[],fail17805=[];
      for(const f17805 of swales.features){
        const mark17805=String(f17805?.properties?.property_preflight_17805||'unknown');
        if(mark17805==='pass')pass17805.push(f17805);
        else if(mark17805==='fail')fail17805.push(f17805);
        else unknown17805.push(f17805);
      }
      if(pass17805.length){
        swales={type:'FeatureCollection',features:[...pass17805,...unknown17805,...fail17805]};
        swales.features.forEach((f17805,i17805)=>{
          const p17805=f17805.properties||(f17805.properties={}),rank17805=i17805+1;
          const grade17805=/^[ABC]$/.test(String(p17805.grade||''))?String(p17805.grade):'C';
          p17805.rank=rank17805;p17805.display_rank=rank17805;p17805.display_code=grade17805+rank17805;
          p17805.label=String(p17805.label||grade17805+rank17805+' — REGIONAL BIOSWALE OPPORTUNITY').replace(/^[ABC]\\d+\\s*[—•-]\\s*/i,grade17805+rank17805+' — ');
        });
      }
      window.EARTHLINE_POSTCLIP_PROPERTY_PREFLIGHT_17805={
        build:'EARTHLINE 17805',survivingPass:pass17805.length,survivingUnknown:unknown17805.length,survivingFail:fail17805.length,
        reordered:pass17805.length>0,
        rule:'carry exact Property-scale preflight verdict through jurisdiction clipping; surviving verified candidates remain ahead of unknown or failed candidates without a second terrain fetch',
        at:new Date().toISOString()
      };
    }
    if(focusMode){for(const f of swales.features||[])"""
if anchor not in s: raise SystemExit("postclip anchor not found")
s=s.replace(anchor,insert,1)
p.write_text(s,encoding="utf-8")
print("applied post-clip preflight carry")
