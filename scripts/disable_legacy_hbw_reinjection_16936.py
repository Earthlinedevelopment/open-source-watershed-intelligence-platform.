from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')
old="if(firstContentImg16388>=0){const firstCardEnd16388=src.indexOf('</article>',firstContentImg16388);const firstImgEnd16388=src.indexOf('>',firstContentImg16388);const at16388=firstCardEnd16388>=0?firstCardEnd16388+10:firstImgEnd16388+1;if(at16388>0)src=src.slice(0,at16388)+howBioswalesApproved16388+src.slice(at16388);}"
new="if(firstContentImg16388>=0&&!src.includes('earthlineCanonicalHowBioswales16923')){const firstCardEnd16388=src.indexOf('</article>',firstContentImg16388);const firstImgEnd16388=src.indexOf('>',firstContentImg16388);const at16388=firstCardEnd16388>=0?firstCardEnd16388+10:firstImgEnd16388+1;if(at16388>0)src=src.slice(0,at16388)+howBioswalesApproved16388+src.slice(at16388);}"
if old not in s: raise SystemExit('legacy long-form injection owner not found')
s=s.replace(old,new,1)
old2="src=src.replace('</main>',precedentSection+'</main>');       if(!src.includes('earthlineSuccessfulSystems16149'))src=src.replace('</body>',precedentSection+'</body>');"
new2="if(!src.includes('earthlineCanonicalHowBioswales16923'))src=src.replace('</main>',precedentSection+'</main>');       if(!src.includes('earthlineCanonicalHowBioswales16923')&&!src.includes('earthlineSuccessfulSystems16149'))src=src.replace('</body>',precedentSection+'</body>');"
if old2 not in s: raise SystemExit('legacy precedent injection owner not found')
s=s.replace(old2,new2,1)
p.write_text(s)