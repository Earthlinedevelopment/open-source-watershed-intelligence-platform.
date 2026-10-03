from pathlib import Path
import re

p=Path("index.html")
s=p.read_text(errors="ignore")

# 1) Canonical How Bioswales Work: alphabetize the bibliography while preserving every entry.
old="""  function earthlineCanonicalHowBioswales16923(){
    return HOW_BIOSWALES_REPORT_16388.slice();
  }"""
new="""  function earthlineCanonicalHowBioswales16923(){
    return HOW_BIOSWALES_REPORT_16388.slice().map(function(html){
      if(!/<h2>Sources<\\/h2>/i.test(String(html||'')))return html;
      return String(html).replace(/(<div class="el12-source-list">)([\\s\\S]*?)(<\\/div>)/i,function(_,open,body,close){
        const entries=(body.match(/<p[\\s\\S]*?<\\/p>/gi)||[]);
        const key=x=>String(x||'').replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ').replace(/\\s+/g,' ').trim().toLocaleLowerCase();
        entries.sort((a,b)=>key(a).localeCompare(key(b),'en',{sensitivity:'base'}));
        return open+'\\n'+entries.join('\\n')+'\\n'+close;
      });
    });
  }"""
if old not in s and new not in s:
    raise SystemExit("canonical How Bioswales accessor anchor not found")
s=s.replace(old,new,1)

# 2) Bioswale Impact Report: source/evidence rows are alphabetized by source/statement.
old2="""function sourceRows(d){const rows=[['Terrain',d.terrain?.source||d.terrain?.provider||'Not recorded',d.terrain?.surfaceType||d.terrain?.dataType||'Type not recorded',d.terrain?.limitation||''],['Watershed context',d.watersheds?.source||'Not available',`${d.watersheds?.features??0} feature(s)`,'Context only'],['Aquifer geometry',d.aquifers?.source||'Not available',d.aquifers?.boundaryClass||'', 'Regional context; not a parcel boundary'],['Hydrogeologic context',d.hydrogeologicContext?.statement||'No named context recorded',d.hydrogeologicContext?.status||'not assessed','Absence of polygon is not absence of groundwater'],['Modeled products','Earthline terrain-derived analysis',`${d.derived?.contours??0} contours; ${d.derived?.waterPaths??0} water paths`,'Screening output'],['Camera context','NOAA GRACE / WRI Aqueduct', 'Visual context hidden from report evidence','Not used as an analysis-bounds finding']];return `<table class="el49-table"><thead><tr><th>Component</th><th>Source / statement</th><th>Status</th><th>Reliance</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`}"""
new2="""function sourceEntries16864(d){return [['Terrain',d.terrain?.source||d.terrain?.provider||'Not recorded',d.terrain?.surfaceType||d.terrain?.dataType||'Type not recorded',d.terrain?.limitation||''],['Watershed context',d.watersheds?.source||'Not available',`${d.watersheds?.features??0} feature(s)`,'Context only'],['Aquifer geometry',d.aquifers?.source||'Not available',d.aquifers?.boundaryClass||'', 'Regional context; not a parcel boundary'],['Hydrogeologic context',d.hydrogeologicContext?.statement||'No named context recorded',d.hydrogeologicContext?.status||'not assessed','Absence of polygon is not absence of groundwater'],['Modeled products','Earthline terrain-derived analysis',`${d.derived?.contours??0} contours; ${d.derived?.waterPaths??0} water paths`,'Screening output'],['Camera context','NOAA GRACE / WRI Aqueduct', 'Visual context hidden from report evidence','Not used as an analysis-bounds finding']].sort((a,b)=>String(a[1]||'').localeCompare(String(b[1]||''),'en',{sensitivity:'base'}))}
  function sourceRows(d){const rows=sourceEntries16864(d);return `<table class="el49-table"><thead><tr><th>Component</th><th>Source / statement</th><th>Status</th><th>Reliance</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`}"""
if old2 not in s and "function sourceEntries16864(d)" not in s:
    raise SystemExit("report sourceRows anchor not found")
s=s.replace(old2,new2,1)

# Final report page is explicitly an alphabetized source list, followed by the evidence register.
old3="""function finalSourcesPage16864(data){const d=data&&data.d||data||{};let body='';try{body=typeof sourceRows==='function'?sourceRows(d):''}catch(_){body=''}return `<section class="el49-page el16864-final-sources"><div class="el49-kicker">Sources · Final Page</div><h2>Sources and evidence register</h2>${body}<div class="el49-callout"><b>Groundwater interpretation:</b> well location is not an aquifer boundary; water level is not storage; an aquifer polygon does not mean groundwater is present at every point; absence of a well does not mean absence of groundwater.</div>${footer(data,'Sources')}</section>`}"""
new3="""function finalSourcesPage16864(data){const d=data&&data.d||data||{};let rows=[];try{rows=typeof sourceEntries16864==='function'?sourceEntries16864(d):[]}catch(_){rows=[]}const list=rows.map(r=>`<li><strong>${esc(r[1])}</strong><span>${esc(r[0])} · ${esc(r[2])}${r[3]?' · '+esc(r[3]):''}</span></li>`).join('');const body=typeof sourceRows==='function'?sourceRows(d):'';return `<section class="el49-page el16864-final-sources"><div class="el49-kicker">Sources · Final Page</div><h2>Sources and evidence register</h2><ol class="el16926-source-list">${list}</ol><h3>Evidence register</h3>${body}<div class="el49-callout"><b>Groundwater interpretation:</b> well location is not an aquifer boundary; water level is not storage; an aquifer polygon does not mean groundwater is present at every point; absence of a well does not mean absence of groundwater.</div>${footer(data,'Sources')}</section>`}"""
# Replace both duplicate definitions if present.
count=s.count(old3)
if count==0 and "el16926-source-list" not in s:
    raise SystemExit("finalSourcesPage16864 anchor not found")
s=s.replace(old3,new3)

# 3) Earthline Process: place its source record at the end, and state where run-specific sources live.
proc_old="""<p class="ep-note">Earthline provides decision-support options, not automated project approval. Final alignments require field verification and appropriate engineering/design review.</p></main>"""
proc_new="""<p class="ep-note">Earthline provides decision-support options, not automated project approval. Final alignments require field verification and appropriate engineering/design review.</p><section class="ep-sources"><h2>Sources</h2><ol><li>Earthline Screening Method v1.0.</li></ol><p class="ep-note">Run-specific terrain, hydrography, groundwater, aquifer and contextual data sources are recorded in the final Sources page of each Bioswale Impact Report.</p></section></main>"""
if proc_old not in s and proc_new not in s:
    raise SystemExit("Earthline Process closing anchor not found")
s=s.replace(proc_old,proc_new,1)

# Styling for the alphabetized source lists.
style_anchor="#earthlineProcessPage16265 .ep-note{color:#6f7f85;font-size:13px;font-style:italic}"
style_new=style_anchor+" #earthlineProcessPage16265 .ep-sources{margin-top:34px;padding-top:24px;border-top:1px solid #c8d2cd} #earthlineProcessPage16265 .ep-sources h2{color:#17323d;font:700 24px/1.2 'Fraunces',Georgia,serif} #earthlineProcessPage16265 .ep-sources ol{padding-left:22px;color:#354a52;font:400 16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif} .el16926-source-list{margin:18px 0 28px;padding-left:22px}.el16926-source-list li{margin:0 0 10px;color:#354a52;font-size:12px;line-height:1.5}.el16926-source-list li strong{display:block;color:#17323d}.el16926-source-list li span{display:block;color:#52656d}"
if ".el16926-source-list" not in s and style_anchor in s:
    s=s.replace(style_anchor,style_new,1)

p.write_text(s)
