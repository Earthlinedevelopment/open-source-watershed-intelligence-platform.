from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(errors='ignore')

heading_re=re.compile(r"bh\.querySelectorAll\('h2,h3'\)\.forEach\(h=>\{[\s\S]*?h\.textContent=map16940\[t\]\|\|t;\s*\}\);")
hm=heading_re.search(s)
if not hm:
    raise SystemExit('How Swales heading normalization owner not found')

copy_cleanup="""+hm.group(0)+"""
          const replacements16941=[
            ['The three words on this report describe the sequence:','Earthline’s three-word principle describes the sequence:'],
            ['regional expatriation by the early 1700s','regional extirpation by the early 1700s'],
            ["the recommendations in this report","Earthline’s recommendations"],
            [" — the same grade as this report's Vermont test site —",''],
            ['See §6.6.','See the evidence limits below.'],
            ["This couples badly with §6.1 and §6.3: macropore flow in frozen soil facilitates preferential contaminant transport to aquifers, and the peak chloride window is the snowmelt window. Vermont's largest recharge opportunity and its highest contamination risk are the same event, moving through the same pathway.","Macropore flow in frozen soil can facilitate preferential contaminant transport to aquifers, and the peak chloride window often overlaps the snowmelt window. In cold regions, a major recharge opportunity and a major contamination risk can therefore occur during the same event, moving through the same preferential pathways."],
            ['Earthline is a screening tool. Every result in this report is labelled (MODELED) because it is produced from terrain, soil, and flow modelling — not from measurements taken on your ground.','Earthline is a screening tool. Its mapped corridors and hydrologic outputs are modeled screening results, not measurements taken on the ground.'],
            ['The corridors ranked in this report are ranked partly for this reason:','Earthline ranks corridors partly for this reason:'],
            ['if the analysis finds that this land does not warrant bioswales, this report will say so.','if the analysis finds that a landscape does not warrant bioswales, Earthline should return no intervention.'],
            ['A swale is the only water structure that manufactures its own growing medium.','A planted swale can improve the soil system that supports its own function.'],
            ['A grassed swale can still shed water. A treed swale increasingly cannot.','A grassed swale can still shed water; as woody roots and macropores develop, a planted swale can shift more water toward infiltration.'],
            ['This makes a planted contour swale close to the only stormwater structure that improves with age rather than degrading.','This is one reason a planted contour swale can improve its infiltration function as vegetation matures, provided it is maintained.'],
            ['Blunts flash flooding specifically. Flash floods are a rate problem, not a volume problem. A swale converts a fast surface pulse into slow subsurface travel, which is the exact intervention.','Helps attenuate fast runoff pulses. Distributed hillslope retention can convert part of a rapid surface pulse into slower infiltration and subsurface release.'],
            ['Attenuates where nothing else can. On steep rivers, gravity dominates flood-wave propagation and floodplain storage barely helps. In mountain terrain the only place to slow water is upslope, before it reaches the channel.','Adds retention where floodplain attenuation is limited. In steep river corridors, gravity can dominate flood-wave propagation, making upslope distributed retention especially important before water reaches the channel.'],
            ['In steep terrain — Vermont, the Green Mountains, most of the places where flash flooding kills people — the valley cannot attenuate the flood. The only place left to slow the water is upslope, before it ever reaches the channel.','In steep terrain, floodplain storage may provide limited attenuation. Distributed upslope retention can therefore matter before runoff reaches the channel.'],
            ['That is precisely where a contour swale sits.','That is the hydrologic position a contour swale is designed to use.'],
            ['A swale is not a substitute for floodplain restoration. It is the intervention available where floodplain restoration cannot work, distributed across the hillsides that feed the channel.','A swale is not a substitute for floodplain restoration. It is a complementary hillslope intervention where distributed retention is appropriate.'],
            ['Corrections governance: Earthline Screening Method v1.0 §15.5 and §16. Claim entries: How Bioswales Work v2.0 §§6.4, 6.7, 6.8 and §9.','Corrections governance follows Earthline Screening Method v1.0. Claim-level corrections and source notes are retained in the Corrections Register below.']
          ];
          const walker=document.createTreeWalker(bh,NodeFilter.SHOW_TEXT);let tn;
          while((tn=walker.nextNode())){let t=tn.nodeValue||'';for(const pair of replacements16941)t=t.split(pair[0]).join(pair[1]);tn.nodeValue=t;}"""
s=s[:hm.start()]+copy_cleanup+s[hm.end():]

prec_old="if(precedent){precedentBlock=precedent.outerHTML;precedent.remove()}"
prec_new="""if(precedent){
              const ph2=precedent.querySelector('h2');if(ph2)ph2.textContent='Evidence from real water-harvesting systems';
              precedent.querySelectorAll('h3').forEach(h=>{if(String(h.textContent||'').trim()==='Shared hydrologic mechanism')h.textContent='Candidate sites for blind validation';});
              precedentBlock=precedent.outerHTML;precedent.remove()
            }"""
if prec_old not in s:
    raise SystemExit('precedent preservation owner not found')
s=s.replace(prec_old,prec_new,1)

seq_pat=re.compile(r"const sequence=\[\s*take\('What a bioswale is'\),[\s\S]*?take\('Why transparent limits matter'\)\s*\]\.join\(''\)\+chunks\.map\(render\)\.join\(''\);")
seq_new="""take('The core idea');take('Why transparent limits matter');
          const sequence=[
            take('What happens when water leaves too quickly'),
            take('What a bioswale is'),
            take('Where infiltrated water goes'),
            take('Why position on the slope matters'),
            take('How healthy landscapes already slow water'),
            take('What bioswales change across the landscape'),
            precedentBlock,
            take('What the evidence supports — and what it does not'),
            take('From screening to field verification')
          ].join('')+chunks.map(render).join('');"""
s,n=seq_pat.subn(seq_new,s,count=1)
if n!=1:
    raise SystemExit('How Swales sequence owner not replaced')

old_can="+lead+visualBlock+sequence+precedentBlock+'</section>'"
new_can="+lead+visualBlock+sequence+'</section>'"
if old_can not in s:
    raise SystemExit('canonical precedent append owner not found')
s=s.replace(old_can,new_can,1)

s=s.replace(
 'Corrections governance: Earthline Screening Method v1.0 §15.5 and §16. Claim entries: How Bioswales Work v2.0 §§6.4, 6.7, 6.8 and §9.',
 'Corrections governance follows Earthline Screening Method v1.0. Claim-level corrections and source notes are retained in this Corrections Register.'
)

p.write_text(s)
