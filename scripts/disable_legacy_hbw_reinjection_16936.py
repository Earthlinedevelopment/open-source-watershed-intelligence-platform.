from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(errors='ignore')
pat1=r"if\(firstContentImg16388>=0\)\{const firstCardEnd16388=src\.indexOf\('</article>',firstContentImg16388\);const firstImgEnd16388=src\.indexOf\('>',firstContentImg16388\);const at16388=firstCardEnd16388>=0\?firstCardEnd16388\+10:firstImgEnd16388\+1;if\(at16388>0\)src=src\.slice\(0,at16388\)\+howBioswalesApproved16388\+src\.slice\(at16388\);\}"
rep1="if(firstContentImg16388>=0&&!src.includes('earthlineCanonicalHowBioswales16923')){const firstCardEnd16388=src.indexOf('</article>',firstContentImg16388);const firstImgEnd16388=src.indexOf('>',firstContentImg16388);const at16388=firstCardEnd16388>=0?firstCardEnd16388+10:firstImgEnd16388+1;if(at16388>0)src=src.slice(0,at16388)+howBioswalesApproved16388+src.slice(at16388);}"
s,n1=re.subn(pat1,rep1,s,count=1)
if n1!=1: raise SystemExit(f'legacy long-form injection owner matches={n1}')
pat2=r"src=src\.replace\('</main>',precedentSection\+'</main>'\);\s*if\(!src\.includes\('earthlineSuccessfulSystems16149'\)\)src=src\.replace\('</body>',precedentSection\+'</body>'\);"
rep2="if(!src.includes('earthlineCanonicalHowBioswales16923'))src=src.replace('</main>',precedentSection+'</main>');       if(!src.includes('earthlineCanonicalHowBioswales16923')&&!src.includes('earthlineSuccessfulSystems16149'))src=src.replace('</body>',precedentSection+'</body>');"
s,n2=re.subn(pat2,rep2,s,count=1)
if n2!=1: raise SystemExit(f'legacy precedent injection owner matches={n2}')
p.write_text(s)
print('patched',n1,n2)