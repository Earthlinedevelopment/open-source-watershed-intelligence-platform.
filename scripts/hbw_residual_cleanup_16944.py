from pathlib import Path

p=Path('index.html')
s=p.read_text(errors='ignore')

anchor="""[...bh.querySelectorAll('p')].forEach(el=>{if(/^On soil carbon — a caution\\./.test(String(el.textContent||'').trim()))el.remove();});"""
if anchor not in s:
    raise SystemExit('HBW element cleanup anchor not found')

extra=anchor+"""
          const elementReplacements16944=[
            [/^Sink it\. Standing water infiltrates\./,'Sink it. Ponded water has time to infiltrate. Some remains in the soil and root zone; some may move deeper and, where local hydrogeology allows, contribute to groundwater recharge.'],
            [/^This couples badly with §6\.1 and §6\.3:/,'Macropore flow in frozen soil can also carry dissolved contaminants rapidly toward groundwater, and the peak chloride window often overlaps the snowmelt window. In cold regions, a major recharge opportunity and a major contamination risk can therefore occur during the same event and through the same preferential pathways.'],
            [/^This makes a planted contour swale close to the only stormwater structure that improves with age rather than degrading\./,'This is one reason a planted contour swale can improve its infiltration function as vegetation matures, provided it is maintained.'],
            [/^Blunts flash flooding specifically\./,'Helps attenuate fast runoff pulses. Distributed hillslope retention can convert part of a rapid surface pulse into slower infiltration and subsurface release.']
          ];
          [...bh.querySelectorAll('p,li')].forEach(el=>{
            const t=String(el.textContent||'').replace(/\\s+/g,' ').trim();
            for(const pair of elementReplacements16944){
              if(pair[0].test(t)){el.textContent=pair[1];break;}
            }
          });"""

s=s.replace(anchor,extra,1)

# Corrections Registry should describe bioretention as comparison evidence, not a calibrated ceiling.
old="Engineered bioretention figures are shown only as mechanism/scale context and an upper bound, not as a property-level prediction."
new="Engineered bioretention figures are shown only as mechanism and scale context, not as a prediction or calibrated performance bound for a contour swale."
s=s.replace(old,new)

p.write_text(s)
