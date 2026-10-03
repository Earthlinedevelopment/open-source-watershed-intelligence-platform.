from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(errors='ignore')

pat=re.compile(r"""const canonicalParts=window\.earthlineCanonicalHowBioswales16923\(\);\s*const sourceStart=[\s\S]*?src=src\.slice\(0,mainOpenEnd\+1\)\+preserved\+canonicalBlock\+correctionsBlock\+sourceBlock\+src\.slice\(mainClose\);""")

rep=r"""const canonicalParts=window.earthlineCanonicalHowBioswales16923();
        const sourceStart=canonicalParts.findIndex(x=>/\<h2\>Sources\<\/h2\>/i.test(String(x||'')));
        const bodyParts=(sourceStart>=0?canonicalParts.slice(0,sourceStart):canonicalParts).join('');
        const sourceParts=(sourceStart>=0?canonicalParts.slice(sourceStart):[]).join('');
        const correctionsBlock=String(window.EARTHLINE_CORRECTIONS_REGISTRY_16513||'').replace('class="el49-page el12-corrections"','class="el12-corrections"');
        const bodyHolder=document.createElement('div');bodyHolder.innerHTML=bodyParts;
        const headingMap={
          'How to read this':'The core idea',
          'What happens to rain on this land right now':'What happens to rain on sloped land',
          'Where the water goes after it sinks':'Where the water goes after infiltration',
          'This landscape used to do this by itself':'How healthy landscapes already slow water',
          'What else a swale does':'What bioswales change across the landscape',
          'The short list':'The whole-system effect',
          'A swale is an interruption, not a filter':'Slow the runoff before it concentrates',
          'Snowmelt — the Vermont case':'Snowmelt — a cold-climate case',
          'Water quality — and why slope position decides it':'Water quality — and why position matters',
          'Soil generation and reforestation':'Soil, roots, vegetation, and reforestation',
          'Downstream — rivers, channels, and the floodplains we removed':'Downstream rivers, channels, and floodplains',
          'What the evidence does not support':'Where the evidence is limited',
          'The engineered cousin, for scale':'Engineered bioretention — a useful comparison',
          'What this report does and does not claim':'What the evidence supports — and what it does not',
          'What to do with this report':'From screening to field verification',
          'Why this report tells you what it cannot do':'Why transparent limits matter'
        };
        for(const h of bodyHolder.querySelectorAll('h2,h3')){
          let t=String(h.textContent||'').trim().replace(/^§\d+\s*·\s*/,'').replace(/^\d+\.\d+\s*·\s*/,'');
          h.textContent=headingMap[t]||t;
        }
        const evidenceHeading=[...bodyHolder.querySelectorAll('h2')].find(h=>/What the evidence supports/i.test(h.textContent||''));
        let closing=false,coreHtml='',closingHtml='';
        for(const child of [...bodyHolder.children]){
          if(evidenceHeading&&child.contains(evidenceHeading))closing=true;
          if(closing)closingHtml+=child.outerHTML;else coreHtml+=child.outerHTML;
        }
        const sourceBlock=sourceParts?'<section id="earthlineCanonicalHowBioswalesSources16923" class="earthline-canonical-sources-16923">'+sourceParts+'</section>':'';
        const mainOpen=src.indexOf('<main');
        const mainOpenEnd=mainOpen>=0?src.indexOf('>',mainOpen):-1;
        const matureStart=src.indexOf('<section aria-labelledby="swaleExamplesTitle"');
        const mainClose=src.lastIndexOf('</main>');
        if(mainOpenEnd>=0&&mainClose>mainOpenEnd){
          let preserved='',visualBlock='',proofBlock='';
          if(matureStart>=0&&matureStart<mainClose)preserved=src.slice(matureStart,mainClose);
          if(preserved){
            const holder=document.createElement('div');holder.innerHTML=preserved;
            holder.querySelectorAll('#earthlineHowBioswalesApproved16388,#earthlineSuccessfulSystems16149,.earthline-hbw-v2-16513,.el12-corrections').forEach(el=>el.remove());
            const visual=holder.querySelector('section[aria-labelledby="swaleExamplesTitle"]');
            if(visual){visualBlock=visual.outerHTML;visual.remove()}
            proofBlock=holder.innerHTML;
          }
          const canonicalBlock='<section id="earthlineCanonicalHowBioswales16923" class="earthline-canonical-how-16923"><div class="ehead"><h1>How Bioswales Work</h1><p>Water falls. Water runs downhill. Bioswales interrupt that loss — slowing, spreading, and sinking water so it stays useful longer.</p></div>'+coreHtml+proofBlock+closingHtml+'</section>';
          src=src.slice(0,mainOpenEnd+1)+visualBlock+canonicalBlock+correctionsBlock+sourceBlock+src.slice(mainClose);
        }"""

s,n=pat.subn(rep,s,count=1)
if n!=1: raise SystemExit('How Swales composition owner not replaced')

p.write_text(s)
