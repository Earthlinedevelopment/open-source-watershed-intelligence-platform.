from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')

# Remove the broken 16939 runtime script injection; replace it with parent-side composition only.
a=s.find("src=src.replace('</head>','<style id=\"earthline-swales-structure-16939\">")
b=s.find('const howBioswalesApproved16388=',a)
if a>=0 and b>a:
    s=s[:a]+s[b:]

start=s.index('const canonicalParts=window.earthlineCanonicalHowBioswales16923();')
end=s.index("}catch(e){console.warn('[Earthline 16923] canonical How Bioswales merge failed',e)}",start)

block=r'''const canonicalParts=window.earthlineCanonicalHowBioswales16923();
        const sourceStart=canonicalParts.findIndex(x=>/\<h2\>Sources\<\/h2\>/i.test(String(x||'')));
        const bodyParts=(sourceStart>=0?canonicalParts.slice(0,sourceStart):canonicalParts).join('');
        const sourceParts=(sourceStart>=0?canonicalParts.slice(sourceStart):[]).join('');
        const correctionsBlock=String(window.EARTHLINE_CORRECTIONS_REGISTRY_16513||'').replace('class="el49-page el12-corrections"','class="el12-corrections"');
        const mainOpen=src.indexOf('<main');
        const mainOpenEnd=mainOpen>=0?src.indexOf('>',mainOpen):-1;
        const matureStart=src.indexOf('<section aria-labelledby="swaleExamplesTitle"');
        const mainClose=src.lastIndexOf('</main>');
        if(mainOpenEnd>=0&&mainClose>mainOpenEnd){
          let preserved=matureStart>=0&&matureStart<mainClose?src.slice(matureStart,mainClose):'';
          let visualBlock='',precedentBlock='';
          if(preserved){
            const ph=document.createElement('div');ph.innerHTML=preserved;
            ph.querySelectorAll('#earthlineHowBioswalesApproved16388,#earthlineSuccessfulSystems16149,.earthline-hbw-v2-16513,.el12-corrections').forEach(el=>el.remove());
            const visual=ph.querySelector('section[aria-labelledby="swaleExamplesTitle"]');
            if(visual){
              visual.querySelectorAll('img').forEach(img=>{
                if(img.parentElement&&img.parentElement.tagName==='A')return;
                const link=document.createElement('a');link.href=img.getAttribute('src')||'';link.target='_blank';link.rel='noopener';link.className='earthline-swale-image-link-16940';link.setAttribute('aria-label',(img.getAttribute('alt')||'Bioswale image')+' — open full size');
                img.parentNode.insertBefore(link,img);link.appendChild(img);
              });
              visualBlock=visual.outerHTML;visual.remove();
            }
            const precedent=ph.querySelector('.el-precedent-16148');
            if(precedent){precedentBlock=precedent.outerHTML;precedent.remove()}
          }
          const bh=document.createElement('div');bh.innerHTML=bodyParts;
          const map16940={
            'How to read this':'The core idea',
            'What happens to rain on this land right now':'What happens when water leaves too quickly',
            'What a bioswale is':'What a bioswale is',
            'Where the water goes after it sinks':'Where infiltrated water goes',
            'Why position on the slope matters':'Why position on the slope matters',
            'This landscape used to do this by itself':'How healthy landscapes already slow water',
            'What else a swale does':'What bioswales change across the landscape',
            'The short list':'The whole-system effect',
            'A swale is an interruption, not a filter':'Slow runoff before it concentrates',
            'Snowmelt — the Vermont case':'Snowmelt — a cold-climate example',
            'Water quality — and why slope position decides it':'Water quality — and why position matters',
            'Soil generation and reforestation':'Soil, roots, vegetation, and reforestation',
            'Downstream — rivers, channels, and the floodplains we removed':'Downstream rivers, channels, and floodplains',
            'What the evidence does not support':'Where the evidence is limited',
            'The engineered cousin, for scale':'Engineered bioretention — a useful comparison',
            'What this report does and does not claim':'What the evidence supports — and what it does not',
            'What to do with this report':'From screening to field verification',
            'Why this report tells you what it cannot do':'Why transparent limits matter'
          };
          bh.querySelectorAll('h2,h3').forEach(h=>{
            let t=String(h.textContent||'').trim().replace(/^§\d+\s*·\s*/,'').replace(/^\d+\.\d+\s*·\s*/,'');
            h.textContent=map16940[t]||t;
          });
          const nodes=[...bh.childNodes],intro=[],chunks=[];let cur=null;
          for(const n of nodes){
            if(n.nodeType===1&&n.tagName==='H2'){
              if(cur)chunks.push(cur);
              cur={title:String(n.textContent||'').trim(),nodes:[n]};
            }else if(cur)cur.nodes.push(n);else intro.push(n);
          }
          if(cur)chunks.push(cur);
          const render=c=>c.nodes.map(n=>n.outerHTML||n.textContent||'').join('');
          const take=title=>{const i=chunks.findIndex(c=>c.title===title);return i>=0?render(chunks.splice(i,1)[0]):''};
          const sequence=[
            take('What a bioswale is'),
            take('The core idea'),
            take('What happens when water leaves too quickly'),
            take('Where infiltrated water goes'),
            take('Why position on the slope matters'),
            take('How healthy landscapes already slow water'),
            take('What bioswales change across the landscape'),
            take('What the evidence supports — and what it does not'),
            take('From screening to field verification'),
            take('Why transparent limits matter')
          ].join('')+chunks.map(render).join('');
          const lead='<div class="ehead"><h1>How Bioswales Work</h1><p>Slow it. Sink it. Spread it. From the basic earthwork to the hydrology, landscape effects, measured precedents, and evidence limits.</p></div>';
          const canonicalBlock='<section id="earthlineCanonicalHowBioswales16923" class="earthline-canonical-how-16923">'+lead+visualBlock+sequence+precedentBlock+'</section>';
          const sourceBlock=sourceParts?'<section id="earthlineCanonicalHowBioswalesSources16923" class="earthline-canonical-sources-16923">'+sourceParts+'</section>':'';
          src=src.slice(0,mainOpenEnd+1)+canonicalBlock+correctionsBlock+sourceBlock+src.slice(mainClose);
        }
       '''
s=s[:start]+block+s[end:]

mark='const howBioswalesApproved16388='
i=s.find(mark)
if i<0: raise SystemExit('How Swales style anchor not found')
style="""src=src.replace('</head>','<style id="earthline-swales-structure-16940">.earthline-canonical-how-16923{max-width:1080px!important;margin:0 auto 30px!important;padding:46px 54px 54px!important;background:#fff!important;border:1px solid #c8d0cb!important;border-radius:16px!important}.earthline-canonical-how-16923>.ehead{max-width:900px!important;margin:0 0 26px!important;padding-bottom:22px!important;border-bottom:2px solid #9eb8a9!important}.earthline-canonical-how-16923>.ehead h1{margin:0 0 10px!important;font:700 clamp(40px,5vw,58px)/1.04 Fraunces,Georgia,serif!important;color:#17323d!important}.earthline-canonical-how-16923>.ehead p{margin:0!important;font:500 18px/1.55 \"Noto Sans\",\"Segoe UI\",Arial,sans-serif!important;color:#476068!important}.earthline-canonical-how-16923 .earthline-swale-examples{max-width:none!important;margin:0 0 34px!important;padding:24px 0 30px!important;border:0!important;border-bottom:1px solid #cbd5d0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important}.earthline-canonical-how-16923 .eswale-sequence{display:grid!important;grid-template-columns:1fr!important;gap:18px!important}.earthline-canonical-how-16923 .eswale-card{overflow:hidden!important;border:1px solid #c7d0cb!important;border-radius:13px!important;background:#fff!important;box-shadow:0 7px 20px rgba(24,47,55,.08)!important}.earthline-swale-image-link-16940{display:block!important;width:100%!important;background:#eef1ed!important;cursor:zoom-in!important}.earthline-swale-image-link-16940 img{display:block!important;width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important}.earthline-canonical-how-16923 .eswale-cap{padding:17px 20px 20px!important}.earthline-canonical-how-16923 .eswale-cap b{font:700 20px/1.25 Fraunces,Georgia,serif!important;color:#17323d!important}.earthline-canonical-how-16923 .eswale-cap span{display:block!important;margin-top:6px!important;font:400 15.5px/1.6 \"Noto Sans\",\"Segoe UI\",Arial,sans-serif!important;color:#52656d!important}.earthline-canonical-how-16923 .earthline-quote{max-width:860px!important;margin:10px auto!important;padding:20px 24px!important;min-height:0!important;background:#f7faf7!important;border:1px solid #c7d6cd!important;border-radius:12px!important}.earthline-canonical-how-16923 .earthline-quote blockquote{margin:0 0 8px!important;font-size:19px!important;line-height:1.5!important}.earthline-canonical-how-16923 h2{margin:40px 0 12px!important;font:700 29px/1.18 Fraunces,Georgia,serif!important;color:#17323d!important}.earthline-canonical-how-16923 h3{margin:25px 0 9px!important;font:700 21px/1.25 Fraunces,Georgia,serif!important;color:#23424b!important}.earthline-canonical-how-16923 p,.earthline-canonical-how-16923 li{font:400 17.5px/1.72 \"Noto Sans\",\"Segoe UI\",Arial,sans-serif!important;color:#354a52!important}.earthline-canonical-how-16923 .el-precedent-16148{margin:48px 0 8px!important;padding-top:36px!important;border-top:2px solid #9eb8a9!important}.earthline-canonical-sources-16923{max-width:1080px!important;margin:0 auto 28px!important;padding:34px 42px!important;background:#fafbf8!important;border:1px solid #c8d0cb!important;border-radius:14px!important}@media(max-width:760px){.earthline-canonical-how-16923{padding:32px 22px 40px!important}.earthline-canonical-how-16923 .earthline-quote{padding:17px 18px!important}}</style></head>');"""
s=s[:i]+style+s[i:]

p.write_text(s)
