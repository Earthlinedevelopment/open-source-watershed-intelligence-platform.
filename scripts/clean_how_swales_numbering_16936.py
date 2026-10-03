from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(errors='ignore')

pat_intro=re.compile(r'<h2>How to read this</h2>\\n<p><strong>If you have two minutes</strong>[\\s\\S]*?<p>Nothing here is a construction drawing\\. Everything here requires field verification\\.</p>')
new_intro='<h2>How to read this</h2>\\n<p><strong>If you have two minutes</strong>, start with <em>What happens to rain on this land right now</em> and <em>What else a swale does</em>. Together they explain the problem and the full range of benefits.</p>\\n<p><strong>If you have ten</strong>, continue with <em>What a bioswale is</em>, <em>This landscape used to do this by itself</em>, and <em>What this report does — and does not — claim</em>.</p>\\n<p><strong>If you are checking our work</strong>, the evidence sections identify every figure as <strong>(measured)</strong> or <strong>(modeled)</strong>, state where the evidence is limited, and retain the source trail. A separate Corrections Registry records claims in this field that are wrong or contested, including several we made ourselves.</p>\\n<p>Nothing here is a construction drawing. Everything here requires field verification.</p>'
s,n=pat_intro.subn(new_intro,s,count=1)
if n!=1: raise SystemExit('How-to-read owner not found')

# Remove legacy section-number prefixes from the canonical How Bioswales Work narrative.
# Keep the actual heading text and all substantive content unchanged.
start=s.find('const HOW_BIOSWALES_REPORT_16388=')
if start<0: raise SystemExit('canonical narrative owner not found')
end=s.find('function earthlineCanonicalHowBioswales16923',start)
if end<0: raise SystemExit('canonical narrative end not found')
block=s[start:end]
block=re.sub(r'(<h[23]>)§\d+(?:\.\d+)?\s*·\s*',r'\1',block)
s=s[:start]+block+s[end:]
p.write_text(s)
