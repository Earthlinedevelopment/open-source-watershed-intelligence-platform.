from pathlib import Path

idx=Path("index.html")
launch=Path("earthline-launch-16872.js")
s=idx.read_text(encoding="utf-8")
j=launch.read_text(encoding="utf-8")

start=s.find("function ensureLanguage(){")
end=s.find("function ensureGauge(){",start)
if start<0 or end<0:
    raise RuntimeError("language owner range not found")

new_language=r'''function ensureLanguage(){
  const rail=document.getElementById('earthlineRail16188');
  if(!rail)return null;
  let wrap=document.getElementById('earthlineLanguageWrap16488');
  if(wrap)return wrap;
  wrap=document.createElement('div');
  wrap.id='earthlineLanguageWrap16488';
  wrap.className='el-rail-control-16188';
  wrap.setAttribute('aria-label','Language');
  const select=document.createElement('select');
  select.id='earthlineLanguage16488';
  select.setAttribute('aria-label','Language');
  for(const [value,label] of [['en','Eng'],['th','Thai'],['vi','Vietnamese'],['lo','Laotian']]){
    const option=document.createElement('option');
    option.value=value;
    option.textContent=label;
    select.appendChild(option);
  }
  wrap.appendChild(select);
  rail.appendChild(wrap);
  return wrap;
}
'''

s=s[:start]+new_language+s[end:]

include='<script src="earthline-language-hotfix-16890.js"></script>'
if s.count(include)!=1:
    raise RuntimeError("language hotfix include count "+str(s.count(include)))
s=s.replace(include,"",1)

old="""function install(){
  try{
    const saved=detectLang(localStorage.getItem('earthlineLanguage16488'));
    launchLangOverride=saved||'en';
    if(!saved)localStorage.setItem('earthlineLanguage16488','en');
    document.documentElement.lang=launchLangOverride;
  }catch(_){
    launchLangOverride='en';
    document.documentElement.lang='en';
  }
  installRail();
"""
new="""function install(){
  try{
    const saved=detectLang(localStorage.getItem('earthlineLanguage16488'));
    launchLangOverride=saved||'en';
    if(!saved)localStorage.setItem('earthlineLanguage16488','en');
    document.documentElement.lang=launchLangOverride;
    const languageControl=document.getElementById('earthlineLanguage16488');
    if(languageControl)languageControl.value=launchLangOverride;
  }catch(_){
    launchLangOverride='en';
    document.documentElement.lang='en';
    const languageControl=document.getElementById('earthlineLanguage16488');
    if(languageControl)languageControl.value='en';
  }
  installRail();
"""
if j.count(old)!=1:
    raise RuntimeError("launch language install count "+str(j.count(old)))
j=j.replace(old,new,1)

for forbidden in [
    "function applyLanguage(",
    "function earthlineApplyUiLanguage16871(",
    "earthline-language-hotfix-16890.js"
]:
    if forbidden in s:
        raise RuntimeError("duplicate inline language owner remains: "+forbidden)

if s.count("function ensureLanguage(){")!=1:
    raise RuntimeError("language control owner count")
if "languageControl.value=launchLangOverride" not in j:
    raise RuntimeError("launch language state sync missing")

idx.write_text(s,encoding="utf-8")
launch.write_text(j,encoding="utf-8")
print("EARTHLINE_17700_SINGLE_LANGUAGE_OWNER",len(s),len(j))
