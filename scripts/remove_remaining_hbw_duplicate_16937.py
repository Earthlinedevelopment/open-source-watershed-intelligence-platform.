from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')
old="holder.querySelectorAll('#earthlineHowBioswalesApproved16388,#earthlineSuccessfulSystems16149,.el12-corrections').forEach(el=>el.remove());"
new="holder.querySelectorAll('#earthlineHowBioswalesApproved16388,#earthlineSuccessfulSystems16149,.earthline-hbw-v2-16513,.el12-corrections').forEach(el=>el.remove());"
if old not in s: raise SystemExit('preserved duplicate cleanup selector not found')
s=s.replace(old,new,1)
p.write_text(s)