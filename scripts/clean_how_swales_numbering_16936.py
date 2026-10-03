from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(errors='ignore')

old="""<h2>How to read this</h2>\n<p><strong>If you have two minutes</strong>, read §1 and §6.0. That is the problem and the full list of what a swale does about it.</p>\n<p><strong>If you have ten</strong>, add §2, §5, and §7 — what the structure is, why this landscape used to do the job itself, and what this report does not claim.</p>\n<p><strong>If you are checking our work</strong>, §6.1 through §6.8 carry the evidence with every figure sourced and marked <strong>(measured)</strong> or <strong>(modeled)</strong>, and §6.7 lists what the evidence does <em>not</em> support. A separate Corrections Register documents claims in this field that are wrong or contested, including several we made ourselves.</p>"""
new="""<h2>How to read this</h2>\n<p><strong>If you have two minutes</strong>, start with <em>What happens to rain on this land right now</em> and <em>What else a swale does</em>. Together they explain the problem and the full range of benefits.</p>\n<p><strong>If you have ten</strong>, continue with <em>What a bioswale is</em>, <em>This landscape used to do this by itself</em>, and <em>What this report does — and does not — claim</em>.</p>\n<p><strong>If you are checking our work</strong>, the evidence sections identify every figure as <strong>(measured)</strong> or <strong>(modeled)</strong>, state where the evidence is limited, and retain the source trail. A separate Corrections Registry records claims in this field that are wrong or contested, including several we made ourselves.</p>"""
if old not in s:
    raise SystemExit('How-to-read owner not found')
s=s.replace(old,new,1)

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
