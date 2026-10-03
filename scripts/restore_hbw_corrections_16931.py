from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')
old="const canonicalBlock='<section id=\"earthlineCanonicalHowBioswales16923\" class=\"earthline-canonical-how-16923\"><div class=\"ehead\"><h1>How Bioswales Work</h1><p>One complete explanation — mechanism, evidence, limits, precedents, and field use — without duplicated sections.</p></div>'+bodyParts+'</section>';"
new="const correctionsBlock=String(EARTHLINE_CORRECTIONS_REGISTRY_16513||'').replace('class=\\\"el49-page el12-corrections\\\"','class=\\\"el12-corrections\\\"');const canonicalBlock='<section id=\"earthlineCanonicalHowBioswales16923\" class=\"earthline-canonical-how-16923\"><div class=\"ehead\"><h1>How Bioswales Work</h1><p>One complete explanation — mechanism, evidence, limits, precedents, and field use — without duplicated sections.</p></div>'+bodyParts+correctionsBlock+'</section>';"
if old not in s: raise SystemExit('canonicalBlock owner not found')
s=s.replace(old,new,1)
css_anchor='.earthline-canonical-how-16923 strong{color:#17323d!important}'
css_add='.earthline-canonical-how-16923 .el12-corrections{margin-top:38px;padding-top:30px;border-top:1px solid #cbd5d0}.earthline-canonical-how-16923 .el12-corrections .el49-kicker{color:#24785c!important;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.earthline-canonical-how-16923 .el12-corrections table{width:100%;border-collapse:collapse;margin:18px 0 12px;background:#fff}.earthline-canonical-how-16923 .el12-corrections th,.earthline-canonical-how-16923 .el12-corrections td{border:1px solid #cbd5d0;padding:12px 14px;vertical-align:top;text-align:left;color:#354a52}.earthline-canonical-how-16923 .el12-corrections th{background:#eaf3ee;color:#17323d}.earthline-canonical-how-16923 .el12-corrections .el49-callout{margin:16px 0;padding:14px 16px;border-left:4px solid #2c7a5b;background:#f3f7f4;color:#354a52}.earthline-canonical-how-16923 .el12-corrections .el49-source{font-size:15px!important;color:#52656d!important}'
if css_anchor not in s: raise SystemExit('canonical CSS anchor not found')
s=s.replace(css_anchor,css_anchor+css_add,1)
p.write_text(s)