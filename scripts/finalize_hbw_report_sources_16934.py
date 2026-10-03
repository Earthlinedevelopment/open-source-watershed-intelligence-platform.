from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')

old_cb = """const correctionsBlock=String(EARTHLINE_CORRECTIONS_REGISTRY_16513||'').replace('class=\\"el49-page el12-corrections\\"','class=\\"el12-corrections\\"');const canonicalBlock='<section id="earthlineCanonicalHowBioswales16923" class="earthline-canonical-how-16923"><div class="ehead"><h1>How Bioswales Work</h1><p>One complete explanation — mechanism, evidence, limits, precedents, and field use — without duplicated sections.</p></div>'+bodyParts+correctionsBlock+'</section>';"""
new_cb = """const correctionsBlock=String(EARTHLINE_CORRECTIONS_REGISTRY_16513||'').replace('class=\\"el49-page el12-corrections\\"','class=\\"el12-corrections\\"');const canonicalBlock='<section id="earthlineCanonicalHowBioswales16923" class="earthline-canonical-how-16923"><div class="ehead"><h1>How Bioswales Work</h1><p>One complete explanation — mechanism, evidence, limits, precedents, and field use — without duplicated sections.</p></div>'+bodyParts+'</section>';"""
if old_cb not in s:
    raise SystemExit('canonical block owner not found')
s=s.replace(old_cb,new_cb,1)

start = """let preserved='';
          if(matureStart>=0&&matureStart<mainClose) preserved=src.slice(matureStart,mainClose);
          preserved=preserved
            .replace(/<section[^>]*id=["']earthlineSuccessfulSystems16149["'][\\s\\S]*?<\\/section>/gi,'')
            .replace(/<section[^>]*class=["'][^"']*el12-corrections[^"']*["'][\\s\\S]*?<\\/section>/gi,'')
            .replace(/<section[^>]*class=["'][^"']*el-precedent-16148[^"']*["'][\\s\\S]*?<\\/section>/gi,'');
          src=src.slice(0,mainOpenEnd+1)+canonicalBlock+preserved+sourceBlock+src.slice(mainClose);"""
replacement = """let preserved='';
          if(matureStart>=0&&matureStart<mainClose) preserved=src.slice(matureStart,mainClose);
          if(preserved){
            const holder=document.createElement('div');
            holder.innerHTML=preserved;
            holder.querySelectorAll('#earthlineHowBioswalesApproved16388,#earthlineSuccessfulSystems16149,.el12-corrections').forEach(el=>el.remove());
            preserved=holder.innerHTML;
          }
          src=src.slice(0,mainOpenEnd+1)+canonicalBlock+preserved+correctionsBlock+sourceBlock+src.slice(mainClose);"""
if start not in s:
    raise SystemExit('preserved cleanup owner not found')
s=s.replace(start,replacement,1)

new_fs = r'''function finalSourcesPage16864(data){const d=data&&data.d||data||{};let rows=[];try{rows=typeof sourceEntries16864==='function'?sourceEntries16864(d):[]}catch(_){rows=[]}const list=rows.map(r=>`<li><strong>${esc(r[1])}</strong><span><b>${esc(r[0])}</b> · ${esc(r[2])}${r[3]?' · '+esc(r[3]):''}</span></li>`).join('');return `<section class="el49-page el16864-final-sources"><div class="el49-kicker">Sources · Final Page</div><h2>Sources and evidence register</h2><ol class="el16926-source-list">${list}</ol><div class="el49-callout"><b>Groundwater interpretation:</b> well location is not an aquifer boundary; water level is not storage; an aquifer polygon does not mean groundwater is present at every point; absence of a well does not mean absence of groundwater.</div>${footer(data,'Sources')}</section>`}'''
marker='<h3>Evidence register</h3>${body}'
repaired=0
while marker in s:
    m=s.find(marker)
    a=s.rfind('function finalSourcesPage16864',0,m)
    b=s.find('/* Black and white by default.',m)
    if a<0 or b<0:
        raise SystemExit('could not bound nested duplicate final sources owner')
    s=s[:a]+new_fs+' ;    '+s[b:]
    repaired+=1
if repaired<1:
    raise SystemExit('remaining duplicate final sources owner not found')

p.write_text(s)
print('finalSources owners repaired',repaired)
