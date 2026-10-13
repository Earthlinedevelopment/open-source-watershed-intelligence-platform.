from pathlib import Path
import re

p=Path("index.html")
s=p.read_text(encoding="utf-8")

pattern=re.compile(r"function ensureLanguage\(\)\{[\s\S]*?\nfunction earthlineApplyUiLanguage16871",re.M)
matches=list(pattern.finditer(s))
if len(matches)!=1:
    raise SystemExit(f"Expected exactly one ensureLanguage owner, found {len(matches)}")

replacement="""function ensureLanguage(){const wrap=document.getElementById('earthlineLanguageWrap16488');if(wrap)wrap.remove();return null}
function earthlineApplyUiLanguage16871"""

s=pattern.sub(replacement,s,count=1)

if "function ensureLanguage(){const wrap=document.getElementById('earthlineLanguageWrap16488');if(wrap)wrap.remove();return null}" not in s:
    raise SystemExit("Language owner removal not installed")
if "wrap=document.createElement('label');wrap.id='earthlineLanguageWrap16488'" in s:
    raise SystemExit("Language creation code still present")

p.write_text(s,encoding="utf-8")
print("17137 language owner removal PASS")
